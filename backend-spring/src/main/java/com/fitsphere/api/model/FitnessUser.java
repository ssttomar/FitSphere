package com.fitsphere.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class FitnessUser {

    @Id
    @GeneratedValue
    private UUID id;

    // Nullable: phone-only users may not have email
    @Column(unique = true)
    private String email;

    // Nullable: Google-only users start without password
    private String passwordHash;

    @Column(nullable = false)
    private String displayName;

    // Unique username (Instagram-style)
    @Column(unique = true)
    private String username;

    // Phone number (E.164 format e.g. +919876543210)
    @Column(unique = true)
    private String phoneNumber;

    // Google subject ID for OAuth users
    @Column(unique = true)
    private String googleId;

    private boolean phoneVerified = false;
    private boolean emailVerified = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Double heightCm;
    private Double weightKg;
    private Integer age;
    private String fitnessGoal;
    private String experienceLevel;
    private String preferredCategory;
    private Integer trainingDaysPerWeek;
    private Integer sessionDurationMinutes;
    private String notes;

    @Lob
    private String profileImageDataUrl;

    @Lob
    private String coverImageDataUrl;

    private String passwordResetToken;
    private Instant passwordResetExpiresAt;

    private Integer weeklyWorkoutCount = 0;
    private Integer weeklyRunKm = 0;
    private Integer weeklyCaloriesBurned = 0;

    // ── Getters / Setters ──────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public Instant getCreatedAt() { return createdAt; }
    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }
    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getFitnessGoal() { return fitnessGoal; }
    public void setFitnessGoal(String fitnessGoal) { this.fitnessGoal = fitnessGoal; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
    public String getPreferredCategory() { return preferredCategory; }
    public void setPreferredCategory(String preferredCategory) { this.preferredCategory = preferredCategory; }
    public Integer getTrainingDaysPerWeek() { return trainingDaysPerWeek; }
    public void setTrainingDaysPerWeek(Integer trainingDaysPerWeek) { this.trainingDaysPerWeek = trainingDaysPerWeek; }
    public Integer getSessionDurationMinutes() { return sessionDurationMinutes; }
    public void setSessionDurationMinutes(Integer sessionDurationMinutes) { this.sessionDurationMinutes = sessionDurationMinutes; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getProfileImageDataUrl() { return profileImageDataUrl; }
    public void setProfileImageDataUrl(String profileImageDataUrl) { this.profileImageDataUrl = profileImageDataUrl; }
    public String getCoverImageDataUrl() { return coverImageDataUrl; }
    public void setCoverImageDataUrl(String coverImageDataUrl) { this.coverImageDataUrl = coverImageDataUrl; }
    public String getPasswordResetToken() { return passwordResetToken; }
    public void setPasswordResetToken(String passwordResetToken) { this.passwordResetToken = passwordResetToken; }
    public Instant getPasswordResetExpiresAt() { return passwordResetExpiresAt; }
    public void setPasswordResetExpiresAt(Instant passwordResetExpiresAt) { this.passwordResetExpiresAt = passwordResetExpiresAt; }
    public Integer getWeeklyWorkoutCount() { return weeklyWorkoutCount; }
    public void setWeeklyWorkoutCount(Integer weeklyWorkoutCount) { this.weeklyWorkoutCount = weeklyWorkoutCount; }
    public Integer getWeeklyRunKm() { return weeklyRunKm; }
    public void setWeeklyRunKm(Integer weeklyRunKm) { this.weeklyRunKm = weeklyRunKm; }
    public Integer getWeeklyCaloriesBurned() { return weeklyCaloriesBurned; }
    public void setWeeklyCaloriesBurned(Integer weeklyCaloriesBurned) { this.weeklyCaloriesBurned = weeklyCaloriesBurned; }
}
