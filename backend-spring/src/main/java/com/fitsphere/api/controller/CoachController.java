package com.fitsphere.api.controller;

import com.fitsphere.api.dto.CoachDtos;
import com.fitsphere.api.service.CoachService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coach")
public class CoachController {

    private final CoachService coachService;

    public CoachController(CoachService coachService) {
        this.coachService = coachService;
    }

    @PostMapping("/weekly-plan")
    public ResponseEntity<CoachDtos.WeeklyPlanResponse> weeklyPlan(
        @AuthenticationPrincipal String email,
        @Valid @RequestBody(required = false) CoachDtos.WeeklyPlanRequest request
    ) {
        return ResponseEntity.ok(coachService.buildWeeklyPlan(email, request));
    }
}
