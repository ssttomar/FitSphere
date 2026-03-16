package com.fitsphere.api.controller;

import com.fitsphere.api.model.FitnessUser;
import com.fitsphere.api.repository.FitnessUserRepository;
import com.fitsphere.api.dto.TrackingDtos;
import com.fitsphere.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final AuthService authService;
    private final FitnessUserRepository userRepository;

    public TrackingController(AuthService authService, FitnessUserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/workout")
    public ResponseEntity<TrackingDtos.WorkoutLogResponse> logWorkout(
        @AuthenticationPrincipal String email,
        @Valid @RequestBody TrackingDtos.WorkoutLogRequest request
    ) {
        double totalVolume = request.exercises()
            .stream()
            .flatMap(exercise -> exercise.sets().stream())
            .mapToDouble(set -> set.reps() * set.weightKg())
            .sum();

        int totalSets = request.exercises()
            .stream()
            .mapToInt(exercise -> exercise.sets().size())
            .sum();

        FitnessUser user = authService.getByEmail(email);
        int current = user.getWeeklyWorkoutCount() == null ? 0 : user.getWeeklyWorkoutCount();
        user.setWeeklyWorkoutCount(current + 1);
        userRepository.save(user);

        return ResponseEntity.ok(new TrackingDtos.WorkoutLogResponse(request.workoutName(), totalVolume, totalSets));
    }

    @PostMapping("/running")
    public ResponseEntity<TrackingDtos.RunningLogResponse> logRun(
        @AuthenticationPrincipal String email,
        @Valid @RequestBody TrackingDtos.RunningLogRequest request
    ) {
        double pace = request.distanceKm() > 0 ? request.durationSeconds() / request.distanceKm() : 0;
        String summary = "Distance %.2f km in %d minutes".formatted(request.distanceKm(), request.durationSeconds() / 60);

        FitnessUser user = authService.getByEmail(email);
        int runKm = user.getWeeklyRunKm() == null ? 0 : user.getWeeklyRunKm();
        int calories = user.getWeeklyCaloriesBurned() == null ? 0 : user.getWeeklyCaloriesBurned();
        user.setWeeklyRunKm(runKm + (int) Math.round(request.distanceKm()));
        user.setWeeklyCaloriesBurned(calories + request.calories());
        userRepository.save(user);

        return ResponseEntity.ok(new TrackingDtos.RunningLogResponse(pace, summary));
    }

    @PostMapping("/calisthenics")
    public ResponseEntity<TrackingDtos.CalisthenicsLogRequest> logCalisthenics(
        @AuthenticationPrincipal String email,
        @Valid @RequestBody TrackingDtos.CalisthenicsLogRequest request
    ) {
        FitnessUser user = authService.getByEmail(email);
        int current = user.getWeeklyWorkoutCount() == null ? 0 : user.getWeeklyWorkoutCount();
        user.setWeeklyWorkoutCount(current + 1);
        userRepository.save(user);

        return ResponseEntity.ok(request);
    }
}
