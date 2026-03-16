package com.fitsphere.api.controller;

import com.fitsphere.api.dto.DashboardDtos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping("/{userId}")
    public ResponseEntity<DashboardDtos.DashboardResponse> getDashboard(@PathVariable String userId) {
        var stats = List.of(
            new DashboardDtos.StatCard("Workouts", "6 this week"),
            new DashboardDtos.StatCard("Calories", "4,620 burned"),
            new DashboardDtos.StatCard("Volume", "34,900 kg")
        );

        var achievements = List.of("First Workout", "30 Day Training Streak", "Bench Press 100kg");
        return ResponseEntity.ok(new DashboardDtos.DashboardResponse(userId, "Strength", stats, achievements));
    }
}
