package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.user.ChangeRoleRequest;
import com.sitesurvey.dto.user.CreateUserRequest;
import com.sitesurvey.dto.user.UserResponse;
import com.sitesurvey.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "AdminUserController", description = "Operations for AdminUserController")
public class AdminUserController {

    private final UserService userService;

    @Operation(summary = "Execute POST operation in AdminUserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User created successfully", user));
    }

    @Operation(summary = "Execute GET operation in AdminUserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        Page<UserResponse> users = userService.getAllUsersPaginated(pageable);
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved", users));
    }

    @Operation(summary = "Execute PUT operation in AdminUserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody ChangeRoleRequest request) {
        UserResponse user = userService.changeUserRole(id, request.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Role updated", user));
    }

    @Operation(summary = "Execute PUT operation in AdminUserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<UserResponse>> toggleActive(@PathVariable Long id) {
        UserResponse user = userService.toggleUserActive(id);
        return ResponseEntity.ok(ApiResponse.ok("User status toggled", user));
    }

    @Operation(summary = "Execute PUT operation in AdminUserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/organization/{orgId}")
    public ResponseEntity<ApiResponse<UserResponse>> assignOrganization(
            @PathVariable Long id, @PathVariable Long orgId) {
        UserResponse user = userService.assignOrganization(id, orgId);
        return ResponseEntity.ok(ApiResponse.ok("Organization assigned", user));
    }

    @Operation(summary = "Execute DELETE operation in AdminUserController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted"));
    }
}