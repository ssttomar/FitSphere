package com.fitsphere.api.service;

import com.fitsphere.api.dto.AuthDtos;
import com.fitsphere.api.dto.CoachDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CoachService {

    private final AuthService authService;
    private final RestClient restClient;

    public CoachService(AuthService authService, @Value("${app.ai.base-url:http://localhost:8000}") String aiBaseUrl) {
        this.authService = authService;
        this.restClient = RestClient.builder().baseUrl(aiBaseUrl).build();
    }

    public CoachDtos.WeeklyPlanResponse buildWeeklyPlan(String userEmail, CoachDtos.WeeklyPlanRequest request) {
        AuthDtos.UserProfileResponse profile = authService.getProfile(authService.getByEmail(userEmail).getId());
        CoachDtos.ProgressSnapshot progressSnapshot = request == null || request.progress() == null
            ? new CoachDtos.ProgressSnapshot(
                profile.weeklyWorkoutCount(),
                profile.weeklyRunKm(),
                profile.weeklyCaloriesBurned(),
                4
            )
            : request.progress();

        Map<String, Object> payload = new HashMap<>();
        payload.put("profile", profile);
        payload.put("progress", progressSnapshot);

        try {
            CoachDtos.WeeklyPlanResponse aiResponse = restClient.post()
                .uri("/recommend-weekly-plan")
                .body(payload)
                .retrieve()
                .body(CoachDtos.WeeklyPlanResponse.class);

            if (aiResponse != null && aiResponse.week() != null && !aiResponse.week().isEmpty()) {
                return aiResponse;
            }
        } catch (Exception ignored) {
            // Fall through to deterministic planner when AI service is unavailable.
        }

        return fallbackPlan(profile, progressSnapshot);
    }

    private CoachDtos.WeeklyPlanResponse fallbackPlan(AuthDtos.UserProfileResponse profile, CoachDtos.ProgressSnapshot progress) {
        int days = profile.trainingDaysPerWeek() > 0 ? profile.trainingDaysPerWeek() : 4;
        int sessionMinutes = profile.sessionDurationMinutes() > 0 ? profile.sessionDurationMinutes() : 60;
        int fatigue = progress == null ? 4 : progress.fatigueLevel();

        String intensity = fatigue >= 8 ? "Low" : fatigue >= 6 ? "Moderate" : "High";

        List<String> dayNames = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");
        List<CoachDtos.DayPlan> week = new ArrayList<>();

        for (int i = 0; i < days && i < dayNames.size(); i++) {
            String focus = switch ((profile.preferredCategory() == null ? "Gym" : profile.preferredCategory()).toLowerCase()) {
                case "running" -> i % 2 == 0 ? "Tempo / Intervals" : "Easy Aerobic + Mobility";
                case "calisthenics" -> i % 2 == 0 ? "Pull-Push Skill Strength" : "Core + Handstand Control";
                default -> i % 2 == 0 ? "Upper Body Strength" : "Lower Body Strength";
            };

            List<String> blocks = List.of(
                "Warm-up 10 min",
                "Main set " + Math.max(25, sessionMinutes - 20) + " min",
                "Accessory and mobility 10 min"
            );

            week.add(new CoachDtos.DayPlan(dayNames.get(i), focus, sessionMinutes, intensity, blocks));
        }

        String rationale = "Plan tuned for %s goal, %s category, %d sessions/week and fatigue score %d."
            .formatted(profile.fitnessGoal(), profile.preferredCategory(), days, fatigue);

        return new CoachDtos.WeeklyPlanResponse(profile.fitnessGoal(), profile.preferredCategory(), rationale, week);
    }
}
