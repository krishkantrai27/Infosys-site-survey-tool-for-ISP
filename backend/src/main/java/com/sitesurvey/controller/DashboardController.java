package com.sitesurvey.controller;

import io.swagger.v3.oas.annotations.Operation;

import io.swagger.v3.oas.annotations.tags.Tag;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.report.DashboardDTO;
import com.sitesurvey.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "DashboardController", description = "Operations for DashboardController")
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Execute GET operation in DashboardController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/survey-completion")
    public ResponseEntity<ApiResponse<List<DashboardDTO.SurveyCompletion>>> getSurveyCompletion() {
        return ResponseEntity.ok(ApiResponse.ok("Survey completion data", dashboardService.getSurveyCompletion()));
    }

    @Operation(summary = "Execute GET operation in DashboardController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/checklist-status")
    public ResponseEntity<ApiResponse<List<DashboardDTO.ChecklistStatus>>> getChecklistStatus() {
        return ResponseEntity.ok(ApiResponse.ok("Checklist status data", dashboardService.getChecklistStatus()));
    }

    @Operation(summary = "Execute GET operation in DashboardController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/equipment-count")
    public ResponseEntity<ApiResponse<List<DashboardDTO.EquipmentCount>>> getEquipmentCount() {
        return ResponseEntity.ok(ApiResponse.ok("Equipment count data", dashboardService.getEquipmentCount()));
    }

    @Operation(summary = "Execute GET operation in DashboardController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/rf-scan-coverage")
    public ResponseEntity<ApiResponse<List<DashboardDTO.RfScanCoverage>>> getRfScanCoverage() {
        return ResponseEntity.ok(ApiResponse.ok("RF scan coverage data", dashboardService.getRfScanCoverage()));
    }

    @Operation(summary = "Execute GET operation in DashboardController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/properties-overview")
    public ResponseEntity<ApiResponse<List<DashboardDTO.PropertyOverview>>> getPropertiesOverview() {
        return ResponseEntity.ok(ApiResponse.ok("Properties overview data", dashboardService.getPropertiesOverview()));
    }
}