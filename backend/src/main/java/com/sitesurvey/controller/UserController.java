package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.user.UserResponse;
import com.sitesurvey.dto.user.UserUpdateRequest;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "UserController", description = "Operations for UserController")
public class UserController {

    private final UserService userService;

    @Operation(summary = "Execute GET operation in UserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(userDetails.getId())));
    }

    @Operation(summary = "Execute PUT operation in UserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(Authentication authentication,
            @RequestBody UserUpdateRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity
                .ok(ApiResponse.ok("Profile updated", userService.updateProfile(userDetails.getId(), request)));
    }
}