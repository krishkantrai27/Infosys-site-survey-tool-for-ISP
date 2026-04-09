package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.building.BuildingRequest;
import com.sitesurvey.dto.building.BuildingResponse;
import com.sitesurvey.dto.property.PropertyRequest;
import com.sitesurvey.dto.property.PropertyResponse;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.BuildingService;
import com.sitesurvey.service.PropertyService;
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
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@Tag(name = "PropertyController", description = "Operations for PropertyController")
public class PropertyController {

    private final PropertyService propertyService;
    private final BuildingService buildingService;

    @Operation(summary = "Execute GET operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PropertyResponse>>> getAll(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getAll(userDetails)));
    }

    @Operation(summary = "Execute GET operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/organization/{orgId}")
    public ResponseEntity<ApiResponse<List<PropertyResponse>>> getByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getByOrganization(orgId)));
    }

    @Operation(summary = "Execute GET operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyResponse>> getById(@PathVariable Long id, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.ok(propertyService.getById(id, userDetails)));
    }

    @Operation(summary = "Execute POST operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> create(@Valid @RequestBody PropertyRequest request,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity
                .ok(ApiResponse.ok("Property created", propertyService.create(request, userDetails.getId())));
    }

    @Operation(summary = "Execute PUT operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PropertyResponse>> update(@PathVariable Long id,
            @Valid @RequestBody PropertyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Property updated", propertyService.update(id, request)));
    }

    @Operation(summary = "Execute DELETE operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        propertyService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Property deleted"));
    }

    // Nested: Property → Buildings
    @Operation(summary = "Execute GET operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/buildings")
    public ResponseEntity<ApiResponse<List<BuildingResponse>>> getBuildings(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(buildingService.getByProperty(id)));
    }

    @Operation(summary = "Execute POST operation in PropertyController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/buildings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BuildingResponse>> addBuilding(@PathVariable Long id,
            @Valid @RequestBody BuildingRequest request) {
        request.setPropertyId(id);
        return ResponseEntity.ok(ApiResponse.ok("Building created", buildingService.create(request)));
    }
}