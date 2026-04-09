package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.org.OrganizationRequest;
import com.sitesurvey.dto.org.OrganizationResponse;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@Tag(name = "OrganizationController", description = "Operations for OrganizationController")
public class OrganizationController {

    private final OrganizationService organizationService;

    @Operation(summary = "Execute GET operation in OrganizationController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrganizationResponse>>> getAll(
            @org.springframework.lang.Nullable Authentication authentication,
            @RequestParam(value = "all", required = false, defaultValue = "false") boolean all) {

        // If not authenticated (e.g., registration page), return all active orgs
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.ok(ApiResponse.ok(organizationService.getAllUnfiltered()));
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (all && isAdmin) {
            return ResponseEntity.ok(ApiResponse.ok(organizationService.getAllUnfiltered()));
        }
        return ResponseEntity.ok(ApiResponse.ok(organizationService.getAll(userDetails)));
    }

    @Operation(summary = "Execute GET operation in OrganizationController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(organizationService.getById(id)));
    }

    @Operation(summary = "Execute POST operation in OrganizationController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationResponse>> create(@Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Organization created", organizationService.create(request)));
    }

    @Operation(summary = "Execute PUT operation in OrganizationController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationResponse>> update(@PathVariable Long id,
            @Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Organization updated", organizationService.update(id, request)));
    }

    @Operation(summary = "Execute DELETE operation in OrganizationController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        organizationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Organization deleted"));
    }
}