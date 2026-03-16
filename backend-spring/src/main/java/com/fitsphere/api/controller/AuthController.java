package com.fitsphere.api.controller;

import com.fitsphere.api.dto.AuthDtos;
import com.fitsphere.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.AuthResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/onboarding")
    public ResponseEntity<AuthDtos.UserProfileResponse> completeOnboarding(
        @AuthenticationPrincipal String email,
        @Valid @RequestBody AuthDtos.OnboardingRequest request
    ) {
        UUID userId = authService.getByEmail(email).getId();
        return ResponseEntity.ok(authService.updateOnboarding(userId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UserProfileResponse> me(@AuthenticationPrincipal String email) {
        UUID userId = authService.getByEmail(email).getId();
        return ResponseEntity.ok(authService.getProfile(userId));
    }
}
