package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.checklist.ChecklistTemplateRequest;
import com.sitesurvey.dto.checklist.ChecklistTemplateResponse;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.ChecklistTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


import java.util.List;

@RestController
@RequestMapping("/api/checklist-templates")
@RequiredArgsConstructor
@Tag(name = "ChecklistTemplateController", description = "Operations for ChecklistTemplateController")
public class ChecklistTemplateController {

    private final ChecklistTemplateService templateService;

    @Operation(summary = "Execute POST operation in ChecklistTemplateController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> create(
            @Valid @RequestBody ChecklistTemplateRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Template created",
                templateService.create(request, currentUser.getOrganizationId())));
    }

    @Operation(summary = "Execute GET operation in ChecklistTemplateController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChecklistTemplateResponse>>> getActiveTemplates(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(
                templateService.getActiveTemplates(currentUser.getOrganizationId())));
    }

    @Operation(summary = "Execute GET operation in ChecklistTemplateController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(templateService.getById(id)));
    }

    @Operation(summary = "Execute PUT operation in ChecklistTemplateController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ChecklistTemplateResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ChecklistTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Template updated (new version created)",
                templateService.update(id, request)));
    }

    @Operation(summary = "Execute DELETE operation in ChecklistTemplateController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deactivate(@PathVariable Long id) {
        templateService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok("Template deactivated"));
    }
}