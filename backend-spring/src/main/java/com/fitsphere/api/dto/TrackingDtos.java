package com.fitsphere.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class TrackingDtos {

    public record WorkoutSet(
        @Min(1) int reps,
        @Min(0) double weightKg
    ) {
    }

    public record ExerciseEntry(
        @NotBlank String exerciseName,
        @NotEmpty List<WorkoutSet> sets
    ) {
    }

    public record WorkoutLogRequest(
        @NotBlank String workoutName,
        @NotEmpty List<ExerciseEntry> exercises,
        int restTimeSeconds
    ) {
    }

    public record WorkoutLogResponse(
        String workoutName,
        double totalVolume,
        int totalSets
    ) {
    }

    public record RunningLogRequest(
        @Min(0) double distanceKm,
        @Min(0) int durationSeconds,
        @Min(0) int calories
    ) {
    }

    public record RunningLogResponse(
        double paceSecondsPerKm,
        String summary
    ) {
    }

    public record CalisthenicsLogRequest(
        @Min(0) int pullups,
        @Min(0) int pushups,
        @Min(0) int dips,
        @Min(0) int muscleUps,
        @Min(0) int handstandSeconds
    ) {
    }
}
