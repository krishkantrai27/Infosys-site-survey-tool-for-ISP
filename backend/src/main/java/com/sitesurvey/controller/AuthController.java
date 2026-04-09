package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.auth.*;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user authentication and sub-systems")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login an existing user")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest request) {
        JwtResponse jwt = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", jwt));
    }

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody SignupRequest request) {
        String result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result));
    }

    @Operation(summary = "Refresh expired JWT token")
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", response));
    }

    @Operation(summary = "Logout user")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        authService.logout(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully"));
    }
}
