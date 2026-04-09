package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.RfScanResponse;
import com.sitesurvey.model.RfTool;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.FileStorageService;
import com.sitesurvey.service.RfScanService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/rf-scans")
@RequiredArgsConstructor
@Tag(name = "RfScanController", description = "Operations for RfScanController")
public class RfScanController {

    private final RfScanService rfScanService;
    private final FileStorageService fileStorageService;

    @Operation(summary = "Execute POST operation in RfScanController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN','ENGINEER')")
    public ResponseEntity<ApiResponse<RfScanResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("propertyId") Long propertyId,
            @RequestParam("floorId") Long floorId,
            @RequestParam("tool") RfTool tool,
            Authentication authentication) throws IOException {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        var scan = rfScanService.uploadRfScan(file, propertyId, floorId, tool, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("RF Scan uploaded successfully", rfScanService.getScanById(scan.getId())));
    }

    @Operation(summary = "Execute POST operation in RfScanController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/process")
    @PreAuthorize("hasAnyRole('ADMIN','ENGINEER')")
    public ResponseEntity<ApiResponse<RfScanResponse>> process(@PathVariable Long id) throws IOException {
        rfScanService.processRfScan(id);
        return ResponseEntity.ok(ApiResponse.ok("RF Scan processed successfully", rfScanService.getScanById(id)));
    }

    @Operation(summary = "Execute POST operation in RfScanController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/heatmap")
    @PreAuthorize("hasAnyRole('ADMIN','ENGINEER')")
    public ResponseEntity<ApiResponse<RfScanResponse>> generateHeatmap(
            @PathVariable Long id, 
            Authentication authentication) throws IOException {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        rfScanService.generateHeatmap(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Heatmap generated successfully", rfScanService.getScanById(id)));
    }

    @Operation(summary = "Execute GET operation in RfScanController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<RfScanResponse>>> listScans(
            @RequestParam("propertyId") Long propertyId,
            @RequestParam(value = "floorId", required = false) Long floorId) {
        return ResponseEntity.ok(ApiResponse.ok(rfScanService.getScansByPropertyAndFloor(propertyId, floorId)));
    }

    @Operation(summary = "Execute GET operation in RfScanController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RfScanResponse>> getScanDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(rfScanService.getScanById(id)));
    }

    @Operation(summary = "Execute GET operation in RfScanController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/heatmap")
    public ResponseEntity<Resource> getHeatmapImage(@PathVariable Long id) throws IOException {
        RfScanResponse scan = rfScanService.getScanById(id);
        if (scan.getHeatmapFileId() == null) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = fileStorageService.loadFile(scan.getHeatmapFileId());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @Operation(summary = "Execute DELETE operation in RfScanController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteScan(@PathVariable Long id) {
        rfScanService.deleteScan(id);
        return ResponseEntity.ok(ApiResponse.ok("RF Scan deleted successfully", null));
    }
}