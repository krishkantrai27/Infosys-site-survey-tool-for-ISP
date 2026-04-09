package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.building.BuildingRequest;
import com.sitesurvey.dto.building.BuildingResponse;
import com.sitesurvey.dto.floor.FloorRequest;
import com.sitesurvey.dto.floor.FloorResponse;
import com.sitesurvey.service.BuildingService;
import com.sitesurvey.service.FloorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.multipart.MultipartFile;
import com.sitesurvey.dto.AttachmentDTO;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.AttachmentService;
import java.io.IOException;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
@Tag(name = "BuildingController", description = "Operations for BuildingController")
public class BuildingController {

    private final BuildingService buildingService;
    private final FloorService floorService;
    private final AttachmentService attachmentService;

    @Operation(summary = "Execute GET operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<ApiResponse<List<BuildingResponse>>> getByProperty(@PathVariable Long propertyId) {
        return ResponseEntity.ok(ApiResponse.ok(buildingService.getByProperty(propertyId)));
    }

    @Operation(summary = "Execute GET operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BuildingResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(buildingService.getById(id)));
    }

    @Operation(summary = "Execute POST operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BuildingResponse>> create(@Valid @RequestBody BuildingRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Building created", buildingService.create(request)));
    }

    @Operation(summary = "Execute PUT operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BuildingResponse>> update(@PathVariable Long id,
            @Valid @RequestBody BuildingRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Building updated", buildingService.update(id, request)));
    }

    @Operation(summary = "Execute DELETE operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        buildingService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Building deleted"));
    }

    // Nested: Building → Floors
    @Operation(summary = "Execute GET operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/floors")
    public ResponseEntity<ApiResponse<List<FloorResponse>>> getFloors(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(floorService.getByBuilding(id)));
    }

    @Operation(summary = "Execute POST operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/floors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FloorResponse>> addFloor(@PathVariable Long id,
            @Valid @RequestBody FloorRequest request) {
        request.setBuildingId(id);
        return ResponseEntity.ok(ApiResponse.ok("Floor created", floorService.create(request)));
    }

    // ─── Attachment Endpoints ──────────────────────────────────────────

    @Operation(summary = "Execute POST operation in BuildingController")
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
                "building", id, tags, metadata, file, userDetails.getId()
        );
        return ResponseEntity.ok(ApiResponse.ok("File uploaded and attached successfully", created));
    }

    @Operation(summary = "Execute GET operation in BuildingController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(attachmentService.listByOwner("building", id)));
    }
}