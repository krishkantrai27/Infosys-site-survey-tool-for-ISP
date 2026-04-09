package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.floor.FloorRequest;
import com.sitesurvey.dto.floor.FloorResponse;
import com.sitesurvey.dto.space.SpaceRequest;
import com.sitesurvey.dto.space.SpaceResponse;
import com.sitesurvey.model.FloorPlan;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.FileStorageService;
import com.sitesurvey.service.FloorService;
import com.sitesurvey.service.SpaceService;
import com.sitesurvey.service.AttachmentService;
import com.sitesurvey.dto.AttachmentDTO;
import jakarta.validation.Valid;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/floors")
@RequiredArgsConstructor
@Tag(name = "FloorController", description = "Operations for FloorController")
public class FloorController {

    private final FloorService floorService;
    private final SpaceService spaceService;
    private final FileStorageService fileStorageService;
    private final AttachmentService attachmentService;

    @Operation(summary = "Execute GET operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/building/{buildingId}")
    public ResponseEntity<ApiResponse<List<FloorResponse>>> getByBuilding(@PathVariable Long buildingId) {
        return ResponseEntity.ok(ApiResponse.ok(floorService.getByBuilding(buildingId)));
    }

    @Operation(summary = "Execute GET operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FloorResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(floorService.getById(id)));
    }

    @Operation(summary = "Execute POST operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FloorResponse>> create(@Valid @RequestBody FloorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Floor created", floorService.create(request)));
    }

    @Operation(summary = "Execute PUT operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FloorResponse>> update(@PathVariable Long id,
            @Valid @RequestBody FloorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Floor updated", floorService.update(id, request)));
    }

    @Operation(summary = "Execute DELETE operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        floorService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Floor deleted"));
    }

    // Nested: Floor → Spaces
    @Operation(summary = "Execute GET operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/spaces")
    public ResponseEntity<ApiResponse<List<SpaceResponse>>> getSpaces(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(spaceService.getByFloor(id)));
    }

    @Operation(summary = "Execute POST operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/spaces")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SpaceResponse>> addSpace(@PathVariable Long id,
            @Valid @RequestBody SpaceRequest request) {
        request.setFloorId(id);
        return ResponseEntity.ok(ApiResponse.ok("Space created", spaceService.create(request)));
    }

    // Floor Plan Link endpoints
    @Operation(summary = "Execute PUT operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}/plan-file")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<String>> linkPlanFile(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        Long fileId = body.get("fileId");
        fileStorageService.linkPlanToFloor(id, fileId);
        return ResponseEntity.ok(ApiResponse.ok("Plan file linked to floor"));
    }

    @Operation(summary = "Execute POST operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/plan-file")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadPlanFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        FloorPlan plan = fileStorageService.uploadFloorPlan(file, id, userDetails.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("id", plan.getId());
        response.put("fileName", plan.getFileName());
        response.put("fileType", plan.getFileType());
        response.put("fileSize", plan.getFileSize());
        response.put("checksumSha256", plan.getChecksumSha256());
        return ResponseEntity.ok(ApiResponse.ok("Floor plan uploaded", response));
    }

    @Operation(summary = "Execute GET operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/plan-file")
    public ResponseEntity<Resource> getPlanFile(@PathVariable Long id) throws IOException {
        FloorPlan plan = fileStorageService.getFloorPlan(id);
        Resource resource = fileStorageService.loadFile(plan.getId());
        return ResponseEntity.ok()
                .contentType(MediaType
                        .parseMediaType(plan.getFileType() != null ? plan.getFileType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + plan.getFileName() + "\"")
                .body(resource);
    }

    // ─── Attachment Endpoints ──────────────────────────────────────────

    @Operation(summary = "Execute POST operation in FloorController")
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
                "floor", id, tags, metadata, file, userDetails.getId()
        );
        return ResponseEntity.ok(ApiResponse.ok("File uploaded and attached successfully", created));
    }

    @Operation(summary = "Execute GET operation in FloorController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(attachmentService.listByOwner("floor", id)));
    }
}