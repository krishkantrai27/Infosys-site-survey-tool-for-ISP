package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.space.GeometryUpdateRequest;
import com.sitesurvey.dto.space.SpaceRequest;
import com.sitesurvey.dto.space.SpaceResponse;
import com.sitesurvey.service.BulkImportService;
import com.sitesurvey.service.SpaceService;
import com.opencsv.exceptions.CsvException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.sitesurvey.dto.AttachmentDTO;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.AttachmentService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
@Tag(name = "SpaceController", description = "Operations for SpaceController")
public class SpaceController {

    private final SpaceService spaceService;
    private final BulkImportService bulkImportService;
    private final AttachmentService attachmentService;

    @Operation(summary = "Execute GET operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<SpaceResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(spaceService.getAll()));
    }

    @Operation(summary = "Execute GET operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/floor/{floorId}")
    public ResponseEntity<ApiResponse<List<SpaceResponse>>> getByFloor(@PathVariable Long floorId) {
        return ResponseEntity.ok(ApiResponse.ok(spaceService.getByFloor(floorId)));
    }

    @Operation(summary = "Execute GET operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SpaceResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(spaceService.getById(id)));
    }

    @Operation(summary = "Execute POST operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<SpaceResponse>> create(@Valid @RequestBody SpaceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Space created", spaceService.create(request)));
    }

    @Operation(summary = "Execute PUT operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<SpaceResponse>> update(@PathVariable Long id,
            @Valid @RequestBody SpaceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Space updated", spaceService.update(id, request)));
    }

    @Operation(summary = "Execute DELETE operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        spaceService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Space deleted"));
    }

    // ─── Geometry Endpoints ───────────────────────────────────────────

    @Operation(summary = "Execute PUT operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/geometry")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<SpaceResponse>> updateGeometry(
            @PathVariable Long id,
            @Valid @RequestBody GeometryUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Geometry saved", spaceService.updateGeometry(id, request)));
    }

    @Operation(summary = "Execute GET operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/floor/{floorId}/geometry")
    public ResponseEntity<ApiResponse<List<SpaceResponse>>> getSpacesGeometry(@PathVariable Long floorId) {
        return ResponseEntity.ok(ApiResponse.ok(spaceService.getSpacesWithGeometryByFloor(floorId)));
    }

    // ─── Import Endpoints ─────────────────────────────────────────────

    @Operation(summary = "Execute POST operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/import/csv/{floorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SpaceResponse>>> importCsv(@PathVariable Long floorId,
            @RequestParam("file") MultipartFile file) throws IOException, CsvException {
        return ResponseEntity
                .ok(ApiResponse.ok("Spaces imported from CSV", bulkImportService.importSpacesFromCsv(file, floorId)));
    }

    @Operation(summary = "Execute POST operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/import/xlsx/{floorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SpaceResponse>>> importXlsx(@PathVariable Long floorId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity
                .ok(ApiResponse.ok("Spaces imported from XLSX", bulkImportService.importSpacesFromXlsx(file, floorId)));
    }

    // ─── Attachment Endpoints ──────────────────────────────────────────

    @Operation(summary = "Execute POST operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<AttachmentDTO>> uploadAttachment(
            @PathVariable Long id,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "metadata", required = false) String metadata,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        AttachmentDTO created = attachmentService.uploadAndAttach(
                "space", id, tags, metadata, file, userDetails.getId()
        );
        return ResponseEntity.ok(ApiResponse.ok("File uploaded and attached successfully", created));
    }

    @Operation(summary = "Execute GET operation in SpaceController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(attachmentService.listByOwner("space", id)));
    }
}