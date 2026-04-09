package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.report.ReportGenerateRequest;
import com.sitesurvey.dto.report.ReportResponse;
import com.sitesurvey.model.Report;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.FileStorageService;
import com.sitesurvey.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "ReportController", description = "Operations for ReportController")
public class ReportController {

    private final ReportService reportService;
    private final FileStorageService fileStorageService;

    /**
     * POST /api/reports/generate
     * Create a report request and queue async generation.
     * Returns the report ID immediately.
     */
    @Operation(summary = "Execute POST operation in ReportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generate(
            @Valid @RequestBody ReportGenerateRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Report report = reportService.requestReport(request, userDetails.getId());

        return ResponseEntity.ok(ApiResponse.ok("Report generation queued", Map.of(
                "reportId", report.getId(),
                "status", report.getStatus().name()
        )));
    }

    /**
     * GET /api/reports?propertyId=
     * List reports, optionally filtered by property.
     */
    @Operation(summary = "Execute GET operation in ReportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportResponse>>> list(
            @RequestParam(required = false) Long propertyId) {
        return ResponseEntity.ok(ApiResponse.ok("Reports list", reportService.listReports(propertyId)));
    }

    /**
     * GET /api/reports/{id}
     * Get report status + metadata.
     */
    @Operation(summary = "Execute GET operation in ReportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Report details", reportService.getReport(id)));
    }

    /**
     * GET /api/reports/{id}/download
     * Stream the PDF file when status=DONE.
     */
    @Operation(summary = "Execute GET operation in ReportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Long id) {
        ReportResponse report = reportService.getReport(id);

        if (report.getPdfFileId() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Report PDF not yet available. Status: " + report.getStatus()));
        }

        try {
            Resource resource = fileStorageService.loadFile(report.getPdfFileId());
            String filename = "SiteSurveyReport_" + report.getPropertyName().replaceAll("\\s+", "_") + ".pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to load PDF: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/reports/{id}
     * Delete a report (Admin only).
     */
    @Operation(summary = "Execute DELETE operation in ReportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.ok(ApiResponse.ok("Report deleted", null));
    }
}