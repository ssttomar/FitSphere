package com.fitsphere.api.service;

import com.fitsphere.api.dto.AuthDtos;
import com.fitsphere.api.model.FitnessUser;
import com.fitsphere.api.repository.FitnessUserRepository;
import com.fitsphere.api.repository.FollowRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final FitnessUserRepository userRepository;
    private final FollowRepository followRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final SmsService smsService;
    private final EmailOtpService emailOtpService;

    @Value("${fitsphere.google.client-id:}")
    private String googleClientId;

    public AuthService(FitnessUserRepository userRepository,
                       FollowRepository followRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       OtpService otpService,
                       SmsService smsService,
                       EmailOtpService emailOtpService) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.smsService = smsService;
        this.emailOtpService = emailOtpService;
    }

    // ── Legacy email/password register ────────────────────────────────────────

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        FitnessUser user = new FitnessUser();
        user.setEmail(email);
        user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPreferredCategory("Gym");
        user.setFitnessGoal("Strength");
        user.setExperienceLevel("Beginner");
        user.setTrainingDaysPerWeek(4);
        user.setSessionDurationMinutes(60);
        user.setEmailVerified(false);

        FitnessUser saved = userRepository.save(user);
        return toAuthResponse(saved, true);
    }

    // ── Flexible login (phone / username / email) ─────────────────────────────

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String identifier = request.identifier().trim();
        FitnessUser user;

        if (identifier.contains("@")) {
            user = userRepository.findByEmail(identifier.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        } else if (identifier.startsWith("+") || identifier.matches("\\d{10,15}")) {
            String phone = identifier.startsWith("+") ? identifier : "+" + identifier;
            user = userRepository.findByPhoneNumber(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        } else {
            user = userRepository.findByUsername(identifier.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return toAuthResponse(user, false);
    }

    // ── Phone OTP ─────────────────────────────────────────────────────────────

    public AuthDtos.OtpSendResponse sendPhoneOtp(String phone) {
        String otp = otpService.generate("otp:phone:" + phone);
        String msg = "Your FitSphere verification code is: " + otp + ". Valid for 10 minutes.";

        String devOtp = null;
        if (!smsService.isConfigured()) {
            devOtp = otp; // return to client only in dev mode
        }
        smsService.send(phone, msg);

        return new AuthDtos.OtpSendResponse(
            "Verification code sent to " + maskPhone(phone),
            devOtp
        );
    }

    public void verifyPhoneOtp(String phone, String otp) {
        boolean valid = otpService.verify("otp:phone:" + phone, otp);
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }
        otpService.markVerified("verified:phone:" + phone);
    }

    // ── Email OTP ─────────────────────────────────────────────────────────────

    public AuthDtos.OtpSendResponse sendEmailOtp(String email) {
        email = email.trim().toLowerCase();
        String otp = otpService.generate("otp:email:" + email);

        String devOtp = null;
        if (!emailOtpService.isConfigured()) {
            devOtp = otp;
        }
        emailOtpService.send(email, otp);

        return new AuthDtos.OtpSendResponse("Verification code sent to " + email, devOtp);
    }

    // ── Username availability ─────────────────────────────────────────────────

    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username.trim().toLowerCase());
    }

    // ── Phone-first registration ───────────────────────────────────────────────

    public AuthDtos.AuthResponse registerPhone(AuthDtos.PhoneRegisterRequest request) {
        String phone = request.phone().trim();
        String username = request.username().trim().toLowerCase();
        String email = request.email() != null ? request.email().trim().toLowerCase() : null;

        // Verify phone was OTP-checked
        if (!otpService.consumeVerified("verified:phone:" + phone)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Phone number has not been verified. Please complete OTP verification first.");
        }

        // Username uniqueness
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        // Phone uniqueness
        if (userRepository.existsByPhoneNumber(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already registered");
        }

        // Optional email: verify OTP if provided
        boolean emailVerified = false;
        if (email != null && !email.isBlank()) {
            if (request.emailOtp() == null || request.emailOtp().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email OTP is required when email is provided");
            }
            boolean emailOtpValid = otpService.verify("otp:email:" + email, request.emailOtp());
            if (!emailOtpValid) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired email OTP");
            }
            if (userRepository.existsByEmail(email)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
            }
            emailVerified = true;
        }

        FitnessUser user = new FitnessUser();
        user.setUsername(username);
        user.setDisplayName(request.displayName().trim());
        user.setPhoneNumber(phone);
        user.setPhoneVerified(true);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPreferredCategory("Gym");
        user.setFitnessGoal("Strength");
        user.setExperienceLevel("Beginner");
        user.setTrainingDaysPerWeek(4);
        user.setSessionDurationMinutes(60);

        if (email != null && !email.isBlank()) {
            user.setEmail(email);
            user.setEmailVerified(emailVerified);
        }

        FitnessUser saved = userRepository.save(user);
        return toAuthResponse(saved, true);
    }

    // ── Google OAuth ──────────────────────────────────────────────────────────

    public AuthDtos.AuthResponse googleAuth(String idToken) {
        Map<String, Object> payload = verifyGoogleToken(idToken);

        String googleId = (String) payload.get("sub");
        String email = (String) payload.get("email");
        String name = (String) payload.getOrDefault("name", "Athlete");

        if (googleId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }

        // Find existing user by googleId or email
        FitnessUser user = userRepository.findByGoogleId(googleId)
            .orElseGet(() -> email != null
                ? userRepository.findByEmail(email.toLowerCase()).orElse(null)
                : null);

        boolean isNewUser = false;
        if (user == null) {
            // New user via Google
            user = new FitnessUser();
            user.setGoogleId(googleId);
            if (email != null) {
                user.setEmail(email.toLowerCase());
                user.setEmailVerified(true);
            }
            user.setDisplayName(name);
            // Random password — Google users won't use it
            user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setPreferredCategory("Gym");
            user.setFitnessGoal("Strength");
            user.setExperienceLevel("Beginner");
            user.setTrainingDaysPerWeek(4);
            user.setSessionDurationMinutes(60);
            user = userRepository.save(user);
            isNewUser = true;
        } else {
            // Link googleId to existing account if not already linked
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                user = userRepository.save(user);
            }
        }

        return toAuthResponse(user, isNewUser);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyGoogleToken(String idToken) {
        try {
            RestTemplate rt = new RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            Map<String, Object> payload = rt.getForObject(url, Map.class);

            if (payload == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Could not verify Google token");
            }

            // Verify audience if client ID is configured
            if (!googleClientId.isBlank()) {
                String aud = (String) payload.get("aud");
                if (!googleClientId.equals(aud)) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token audience mismatch");
                }
            }

            return payload;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }
    }

    // ── Password reset (unchanged) ────────────────────────────────────────────

    public AuthDtos.ForgotPasswordResponse forgotPassword(AuthDtos.ForgotPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        var maybeUser = userRepository.findByEmail(normalizedEmail);

        String resetToken = null;
        if (maybeUser.isPresent()) {
            FitnessUser user = maybeUser.get();
            resetToken = UUID.randomUUID().toString().replace("-", "");
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetExpiresAt(Instant.now().plusSeconds(15 * 60));
            userRepository.save(user);
        }

        return new AuthDtos.ForgotPasswordResponse(
            "If the account exists, a password reset token has been generated.",
            resetToken
        );
    }

    public AuthDtos.BasicResponse resetPassword(AuthDtos.ResetPasswordRequest request) {
        FitnessUser user = userRepository.findByPasswordResetToken(request.token().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));

        if (user.getPasswordResetExpiresAt() == null || user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        return new AuthDtos.BasicResponse("Password reset successful. You can now sign in.");
    }

    // ── Profile management ────────────────────────────────────────────────────

    public AuthDtos.UserProfileResponse updateOnboarding(UUID userId, AuthDtos.OnboardingRequest request) {
        FitnessUser user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setHeightCm(request.heightCm());
        user.setWeightKg(request.weightKg());
        user.setFitnessGoal(request.fitnessGoal());
        user.setExperienceLevel(request.experienceLevel());
        user.setPreferredCategory(request.preferredCategory());
        user.setTrainingDaysPerWeek(request.trainingDaysPerWeek());
        user.setSessionDurationMinutes(request.sessionDurationMinutes());
        user.setNotes(request.notes());

        return toProfile(userRepository.save(user));
    }

    public AuthDtos.UserProfileResponse updateProfile(UUID userId, AuthDtos.UpdateProfileRequest request) {
        FitnessUser user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

        user.setDisplayName(request.displayName().trim());
        user.setHeightCm(request.heightCm());
        user.setWeightKg(request.weightKg());
        user.setFitnessGoal(request.fitnessGoal());
        user.setExperienceLevel(request.experienceLevel());
        user.setPreferredCategory(request.preferredCategory());
        user.setTrainingDaysPerWeek(request.trainingDaysPerWeek());
        user.setSessionDurationMinutes(request.sessionDurationMinutes());
        user.setNotes(request.notes());
        // Only overwrite images if the client explicitly sent a value (null = not provided → keep existing)
        if (request.profileImageDataUrl() != null) {
            user.setProfileImageDataUrl(request.profileImageDataUrl().isEmpty() ? null : request.profileImageDataUrl());
        }
        if (request.coverImageDataUrl() != null) {
            user.setCoverImageDataUrl(request.coverImageDataUrl().isEmpty() ? null : request.coverImageDataUrl());
        }

        return toProfile(userRepository.save(user));
    }

    public void setupUsername(UUID userId, String username) {
        String uname = username.trim().toLowerCase();
        if (!uname.matches("[a-z0-9._]+") || uname.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid username");
        }
        if (userRepository.existsByUsername(uname)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        FitnessUser user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (user.getUsername() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already set");
        }
        user.setUsername(uname);
        userRepository.save(user);
    }

    public AuthDtos.UserProfileResponse getProfile(UUID userId) {
        FitnessUser user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return toProfile(user);
    }

    public FitnessUser getByEmail(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public FitnessUser getByPhone(String phone) {
        return userRepository.findByPhoneNumber(phone.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String issueToken(FitnessUser user) {
        // Use email if available, else phone, else googleId as subject
        String subject = user.getEmail() != null ? user.getEmail()
            : user.getPhoneNumber() != null ? user.getPhoneNumber()
            : user.getGoogleId();
        return jwtService.generateToken(subject, Map.of(
            "uid", user.getId().toString(),
            "displayName", user.getDisplayName()
        ));
    }

    private AuthDtos.AuthResponse toAuthResponse(FitnessUser user, boolean isNewUser) {
        return new AuthDtos.AuthResponse(
            user.getId(),
            issueToken(user),
            user.getDisplayName(),
            user.getPreferredCategory(),
            isNewUser
        );
    }

    private AuthDtos.UserProfileResponse toProfile(FitnessUser user) {
        return new AuthDtos.UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getUsername(),
            user.getPhoneNumber(),
            user.getHeightCm() == null ? 0 : user.getHeightCm(),
            user.getWeightKg() == null ? 0 : user.getWeightKg(),
            user.getFitnessGoal(),
            user.getExperienceLevel(),
            user.getPreferredCategory(),
            user.getTrainingDaysPerWeek() == null ? 0 : user.getTrainingDaysPerWeek(),
            user.getSessionDurationMinutes() == null ? 0 : user.getSessionDurationMinutes(),
            user.getNotes(),
            user.getProfileImageDataUrl(),
            user.getCoverImageDataUrl(),
            user.getWeeklyWorkoutCount() == null ? 0 : user.getWeeklyWorkoutCount(),
            user.getWeeklyRunKm() == null ? 0 : user.getWeeklyRunKm(),
            user.getWeeklyCaloriesBurned() == null ? 0 : user.getWeeklyCaloriesBurned(),
            followRepository.countByFollowingId(user.getId()),
            followRepository.countByFollowerId(user.getId())
        );
    }

    private String maskPhone(String phone) {
        if (phone.length() <= 4) return phone;
        return phone.substring(0, phone.length() - 4).replaceAll("\\d", "*") + phone.substring(phone.length() - 4);
    }
}
