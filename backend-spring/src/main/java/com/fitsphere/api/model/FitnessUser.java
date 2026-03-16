package com.fitsphere.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class FitnessUser {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Double heightCm;

    private Double weightKg;

    private String fitnessGoal;

    private String experienceLevel;

    private String preferredCategory;

    private Integer trainingDaysPerWeek;

    private Integer sessionDurationMinutes;

    private String notes;

    private Integer weeklyWorkoutCount = 0;

    private Integer weeklyRunKm = 0;

    private Integer weeklyCaloriesBurned = 0;

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Double heightCm) {
        this.heightCm = heightCm;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public String getFitnessGoal() {
        return fitnessGoal;
    }

    public void setFitnessGoal(String fitnessGoal) {
        this.fitnessGoal = fitnessGoal;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public String getPreferredCategory() {
        return preferredCategory;
    }

    public void setPreferredCategory(String preferredCategory) {
        this.preferredCategory = preferredCategory;
    }

    public Integer getTrainingDaysPerWeek() {
        return trainingDaysPerWeek;
    }

    public void setTrainingDaysPerWeek(Integer trainingDaysPerWeek) {
        this.trainingDaysPerWeek = trainingDaysPerWeek;
    }

    public Integer getSessionDurationMinutes() {
        return sessionDurationMinutes;
    }

    public void setSessionDurationMinutes(Integer sessionDurationMinutes) {
        this.sessionDurationMinutes = sessionDurationMinutes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getWeeklyWorkoutCount() {
        return weeklyWorkoutCount;
    }

    public void setWeeklyWorkoutCount(Integer weeklyWorkoutCount) {
        this.weeklyWorkoutCount = weeklyWorkoutCount;
    }

    public Integer getWeeklyRunKm() {
        return weeklyRunKm;
    }

    public void setWeeklyRunKm(Integer weeklyRunKm) {
        this.weeklyRunKm = weeklyRunKm;
    }

    public Integer getWeeklyCaloriesBurned() {
        return weeklyCaloriesBurned;
    }

    public void setWeeklyCaloriesBurned(Integer weeklyCaloriesBurned) {
        this.weeklyCaloriesBurned = weeklyCaloriesBurned;
    }
}
