package com.fitsphere.api.service;

import com.fitsphere.api.dto.AuthDtos;
import com.fitsphere.api.model.FitnessUser;
import com.fitsphere.api.repository.FitnessUserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final FitnessUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(FitnessUserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        FitnessUser user = new FitnessUser();
        user.setEmail(request.email().trim().toLowerCase());
        user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPreferredCategory("Gym");
        user.setFitnessGoal("Strength");
        user.setExperienceLevel("Beginner");
        user.setTrainingDaysPerWeek(4);
        user.setSessionDurationMinutes(60);

        FitnessUser saved = userRepository.save(user);
        String token = issueToken(saved);
        return new AuthDtos.AuthResponse(saved.getId(), token, saved.getDisplayName(), saved.getPreferredCategory());
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        FitnessUser user = userRepository.findByEmail(request.email().trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = issueToken(user);
        return new AuthDtos.AuthResponse(user.getId(), token, user.getDisplayName(), user.getPreferredCategory());
    }

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

        FitnessUser saved = userRepository.save(user);
        return toProfile(saved);
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

    private String issueToken(FitnessUser user) {
        return jwtService.generateToken(user.getEmail(), Map.of(
            "uid", user.getId().toString(),
            "displayName", user.getDisplayName()
        ));
    }

    private AuthDtos.UserProfileResponse toProfile(FitnessUser user) {
        return new AuthDtos.UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getHeightCm() == null ? 0 : user.getHeightCm(),
            user.getWeightKg() == null ? 0 : user.getWeightKg(),
            user.getFitnessGoal(),
            user.getExperienceLevel(),
            user.getPreferredCategory(),
            user.getTrainingDaysPerWeek() == null ? 0 : user.getTrainingDaysPerWeek(),
            user.getSessionDurationMinutes() == null ? 0 : user.getSessionDurationMinutes(),
            user.getNotes(),
            user.getWeeklyWorkoutCount() == null ? 0 : user.getWeeklyWorkoutCount(),
            user.getWeeklyRunKm() == null ? 0 : user.getWeeklyRunKm(),
            user.getWeeklyCaloriesBurned() == null ? 0 : user.getWeeklyCaloriesBurned()
        );
    }
}
