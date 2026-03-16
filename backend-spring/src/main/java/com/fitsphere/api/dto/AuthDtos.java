package com.fitsphere.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class AuthDtos {

    public record RegisterRequest(
        @Email @NotBlank String email,
        @Size(min = 8, max = 72) String password,
        @NotBlank String displayName
    ) {
    }

    public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
    ) {
    }

    public record AuthResponse(
        UUID userId,
        String token,
        String displayName,
        String fitnessCategory
    ) {
    }

    public record OnboardingRequest(
        @Min(100) @Max(260) double heightCm,
        @Min(30) @Max(300) double weightKg,
        @NotBlank String fitnessGoal,
        @NotBlank String experienceLevel,
        @NotBlank String preferredCategory,
        @Min(1) @Max(7) int trainingDaysPerWeek,
        @Min(20) @Max(240) int sessionDurationMinutes,
        String notes
    ) {
    }

    public record UserProfileResponse(
        UUID userId,
        String email,
        String displayName,
        double heightCm,
        double weightKg,
        String fitnessGoal,
        String experienceLevel,
        String preferredCategory,
        int trainingDaysPerWeek,
        int sessionDurationMinutes,
        String notes,
        int weeklyWorkoutCount,
        int weeklyRunKm,
        int weeklyCaloriesBurned
    ) {
    }
}
