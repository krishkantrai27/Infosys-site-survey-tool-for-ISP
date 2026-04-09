package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.building.BuildingResponse;
import com.sitesurvey.dto.importdata.ImportConfirmRequest;
import com.sitesurvey.dto.importdata.ImportPreviewResponse;
import com.sitesurvey.dto.space.SpaceResponse;
import com.sitesurvey.service.BulkImportService;
import com.opencsv.exceptions.CsvException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@Tag(name = "ImportController", description = "Operations for ImportController")
public class ImportController {

    private final BulkImportService bulkImportService;

    // ───────── SPACES ─────────

    @Operation(summary = "Execute POST operation in ImportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/spaces/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<ImportPreviewResponse>> previewSpaces(
            @RequestParam("file") MultipartFile file,
            @RequestParam("floorId") Long floorId) throws IOException, CsvException {

        ImportPreviewResponse preview = bulkImportService.previewSpaces(file, floorId);
        return ResponseEntity.ok(ApiResponse.ok("Preview generated", preview));
    }

    @Operation(summary = "Execute POST operation in ImportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/spaces/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<List<SpaceResponse>>> confirmSpaces(
            @Valid @RequestBody ImportConfirmRequest request) {

        List<SpaceResponse> imported = bulkImportService.confirmSpaces(request.getSessionToken());
        return ResponseEntity.ok(ApiResponse.ok(imported.size() + " spaces imported", imported));
    }

    @Operation(summary = "Execute POST operation in ImportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/spaces/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<String>> cancelSpaces(
            @Valid @RequestBody ImportConfirmRequest request) {

        bulkImportService.cancelImport(request.getSessionToken());
        return ResponseEntity.ok(ApiResponse.ok("Import cancelled"));
    }

    // ───────── BUILDINGS ─────────

    @Operation(summary = "Execute POST operation in ImportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/buildings/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<ImportPreviewResponse>> previewBuildings(
            @RequestParam("file") MultipartFile file,
            @RequestParam("propertyId") Long propertyId) throws IOException, CsvException {

        ImportPreviewResponse preview = bulkImportService.previewBuildings(file, propertyId);
        return ResponseEntity.ok(ApiResponse.ok("Preview generated", preview));
    }

    @Operation(summary = "Execute POST operation in ImportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/buildings/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<List<BuildingResponse>>> confirmBuildings(
            @Valid @RequestBody ImportConfirmRequest request) {

        List<BuildingResponse> imported = bulkImportService.confirmBuildings(request.getSessionToken());
        return ResponseEntity.ok(ApiResponse.ok(imported.size() + " buildings imported", imported));
    }

    @Operation(summary = "Execute POST operation in ImportController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/buildings/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<String>> cancelBuildings(
            @Valid @RequestBody ImportConfirmRequest request) {

        bulkImportService.cancelImport(request.getSessionToken());
        return ResponseEntity.ok(ApiResponse.ok("Import cancelled"));
    }
}