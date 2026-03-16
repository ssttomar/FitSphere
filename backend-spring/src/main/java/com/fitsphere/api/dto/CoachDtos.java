package com.fitsphere.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.List;

public class CoachDtos {

    public record ProgressSnapshot(
        @Min(0) int weeklyWorkoutCount,
        @Min(0) int weeklyRunKm,
        @Min(0) int weeklyCaloriesBurned,
        @Min(0) @Max(10) int fatigueLevel
    ) {
    }

    public record WeeklyPlanRequest(
        ProgressSnapshot progress
    ) {
    }

    public record DayPlan(
        String day,
        String focus,
        int durationMinutes,
        String intensity,
        List<String> blocks
    ) {
    }

    public record WeeklyPlanResponse(
        String goal,
        String preferredCategory,
        String rationale,
        List<DayPlan> week
    ) {
    }
}
