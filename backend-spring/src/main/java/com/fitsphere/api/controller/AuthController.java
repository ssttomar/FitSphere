package com.fitsphere.api.controller;

import com.fitsphere.api.dto.AuthDtos;
import com.fitsphere.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ── Legacy email/password register ────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.AuthResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // ── Login (phone / username / email) ─────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // ── Phone OTP ─────────────────────────────────────────────────────────────

    @PostMapping("/send-phone-otp")
    public ResponseEntity<AuthDtos.OtpSendResponse> sendPhoneOtp(
            @Valid @RequestBody AuthDtos.SendPhoneOtpRequest request) {
        return ResponseEntity.ok(authService.sendPhoneOtp(request.phone()));
    }

    @PostMapping("/verify-phone-otp")
    public ResponseEntity<AuthDtos.BasicResponse> verifyPhoneOtp(
            @Valid @RequestBody AuthDtos.VerifyPhoneOtpRequest request) {
        authService.verifyPhoneOtp(request.phone(), request.otp());
        return ResponseEntity.ok(new AuthDtos.BasicResponse("Phone verified successfully"));
    }

    // ── Email OTP ─────────────────────────────────────────────────────────────

    @PostMapping("/send-email-otp")
    public ResponseEntity<AuthDtos.OtpSendResponse> sendEmailOtp(
            @Valid @RequestBody AuthDtos.SendEmailOtpRequest request) {
        return ResponseEntity.ok(authService.sendEmailOtp(request.email()));
    }

    // ── Username availability ─────────────────────────────────────────────────

    @GetMapping("/check-username")
    public ResponseEntity<AuthDtos.CheckUsernameResponse> checkUsername(@RequestParam String username) {
        return ResponseEntity.ok(new AuthDtos.CheckUsernameResponse(authService.isUsernameAvailable(username)));
    }

    // ── Phone-first registration ───────────────────────────────────────────────

    @PostMapping("/register-phone")
    public ResponseEntity<AuthDtos.AuthResponse> registerPhone(
            @Valid @RequestBody AuthDtos.PhoneRegisterRequest request) {
        return ResponseEntity.ok(authService.registerPhone(request));
    }

    // ── Google OAuth ──────────────────────────────────────────────────────────

    @PostMapping("/google")
    public ResponseEntity<AuthDtos.AuthResponse> googleAuth(
            @Valid @RequestBody AuthDtos.GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.googleAuth(request.idToken()));
    }

    // ── Password reset ────────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthDtos.ForgotPasswordResponse> forgotPassword(
            @Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthDtos.BasicResponse> resetPassword(
            @Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    // ── Profile management ────────────────────────────────────────────────────

    @PostMapping("/onboarding")
    public ResponseEntity<AuthDtos.UserProfileResponse> completeOnboarding(
            @AuthenticationPrincipal String subject,
            @Valid @RequestBody AuthDtos.OnboardingRequest request) {
        UUID userId = resolveUserId(subject);
        return ResponseEntity.ok(authService.updateOnboarding(userId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UserProfileResponse> me(@AuthenticationPrincipal String subject) {
        UUID userId = resolveUserId(subject);
        return ResponseEntity.ok(authService.getProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<AuthDtos.UserProfileResponse> updateProfile(
            @AuthenticationPrincipal String subject,
            @Valid @RequestBody AuthDtos.UpdateProfileRequest request) {
        UUID userId = resolveUserId(subject);
        return ResponseEntity.ok(authService.updateProfile(userId, request));
    }

    // ── Helper: resolve userId from JWT subject (email, phone, or googleId) ──

    private UUID resolveUserId(String subject) {
        // Try email first, then phone, then treat as googleId fallback
        var byEmail = tryFindByEmail(subject);
        if (byEmail != null) return byEmail;
        var byPhone = tryFindByPhone(subject);
        if (byPhone != null) return byPhone;
        // Fallback to email lookup (legacy path)
        return authService.getByEmail(subject).getId();
    }

    private UUID tryFindByEmail(String subject) {
        if (subject != null && subject.contains("@")) {
            try { return authService.getByEmail(subject).getId(); } catch (Exception ignored) {}
        }
        return null;
    }

    private UUID tryFindByPhone(String subject) {
        if (subject != null && subject.startsWith("+")) {
            try { return authService.getByPhone(subject).getId(); } catch (Exception ignored) {}
        }
        return null;
    }
}
