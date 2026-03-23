package com.fitsphere.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class AuthDtos {

    // ── Legacy email/password register (kept for backward compat) ─────────────
    public record RegisterRequest(
        @Email @NotBlank String email,
        @Size(min = 8, max = 72) String password,
        @NotBlank String displayName
    ) {}

    // ── New flexible login (phone / username / email + password) ──────────────
    public record LoginRequest(
        @NotBlank String identifier,   // phone, username, or email
        @NotBlank String password
    ) {}

    // ── Phone OTP ─────────────────────────────────────────────────────────────
    public record SendPhoneOtpRequest(
        @NotBlank @Pattern(regexp = "\\+\\d{7,15}", message = "Phone must be in E.164 format e.g. +919876543210")
        String phone
    ) {}

    public record VerifyPhoneOtpRequest(
        @NotBlank String phone,
        @NotBlank @Size(min = 6, max = 6) String otp
    ) {}

    // ── Email OTP (optional step during signup or standalone) ─────────────────
    public record SendEmailOtpRequest(
        @Email @NotBlank String email
    ) {}

    public record VerifyEmailOtpRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6, max = 6) String otp
    ) {}

    // ── Generic OTP send response ─────────────────────────────────────────────
    public record OtpSendResponse(
        String message,
        String devOtp   // non-null only when SMS/email service is not configured (dev mode)
    ) {}

    // ── Phone-first registration (after phone OTP verified) ───────────────────
    public record PhoneRegisterRequest(
        @NotBlank @Size(min = 3, max = 30)
        @Pattern(regexp = "[a-z0-9._]+", message = "Username may only contain lowercase letters, numbers, dots, underscores")
        String username,

        @NotBlank String displayName,

        @Size(min = 8, max = 72) String password,

        @NotBlank String phone,   // must have passed verify-phone-otp first

        String email,             // optional
        String emailOtp           // required if email provided
    ) {}

    // ── Username availability ─────────────────────────────────────────────────
    public record CheckUsernameResponse(boolean available) {}

    // ── Google OAuth ──────────────────────────────────────────────────────────
    public record GoogleAuthRequest(@NotBlank String idToken) {}

    // ── Shared responses ──────────────────────────────────────────────────────
    public record ForgotPasswordRequest(
        @Email @NotBlank String email
    ) {}

    public record ForgotPasswordResponse(
        String message,
        String resetToken
    ) {}

    public record ResetPasswordRequest(
        @NotBlank String token,
        @Size(min = 8, max = 72) String newPassword
    ) {}

    public record BasicResponse(String message) {}

    public record AuthResponse(
        UUID userId,
        String token,
        String displayName,
        String fitnessCategory,
        boolean isNewUser
    ) {}

    // ── Profile DTOs (unchanged) ──────────────────────────────────────────────
    public record OnboardingRequest(
        @Min(100) @Max(260) double heightCm,
        @Min(30) @Max(300) double weightKg,
        @NotBlank String fitnessGoal,
        @NotBlank String experienceLevel,
        @NotBlank String preferredCategory,
        @Min(1) @Max(7) int trainingDaysPerWeek,
        @Min(20) @Max(240) int sessionDurationMinutes,
        String notes
    ) {}

    public record UpdateProfileRequest(
        @NotBlank String displayName,
        @Min(100) @Max(260) double heightCm,
        @Min(30) @Max(300) double weightKg,
        @NotBlank String fitnessGoal,
        @NotBlank String experienceLevel,
        @NotBlank String preferredCategory,
        @Min(1) @Max(7) int trainingDaysPerWeek,
        @Min(20) @Max(240) int sessionDurationMinutes,
        String notes,
        String profileImageDataUrl,
        String coverImageDataUrl
    ) {}

    public record UserProfileResponse(
        UUID userId,
        String email,
        String displayName,
        String username,
        String phoneNumber,
        double heightCm,
        double weightKg,
        String fitnessGoal,
        String experienceLevel,
        String preferredCategory,
        int trainingDaysPerWeek,
        int sessionDurationMinutes,
        String notes,
        String profileImageDataUrl,
        String coverImageDataUrl,
        int weeklyWorkoutCount,
        int weeklyRunKm,
        int weeklyCaloriesBurned
    ) {}
}
