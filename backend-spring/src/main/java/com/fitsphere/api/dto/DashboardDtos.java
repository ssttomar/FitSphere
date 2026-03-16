package com.fitsphere.api.dto;

import java.util.List;

public class DashboardDtos {

    public record StatCard(String label, String value) {
    }

    public record DashboardResponse(
        String userId,
        String fitnessGoal,
        List<StatCard> weeklyStats,
        List<String> achievements
    ) {
    }
}
