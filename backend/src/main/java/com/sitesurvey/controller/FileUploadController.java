package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.model.Floor;
import com.sitesurvey.model.FloorPlan;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.repository.FloorRepository;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "FileUploadController", description = "Operations for FileUploadController")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final FloorRepository floorRepository;

    /**
     * Generic file upload — multipart/form-data with ownerType + ownerId.
     * Validates MIME (png, jpeg, webp, pdf) and max 20 MB.
     */
    @Operation(summary = "Execute POST operation in FileUploadController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerType") String ownerType,
            @RequestParam("ownerId") Long ownerId,
            Authentication authentication) throws IOException {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        FloorPlan saved = fileStorageService.uploadFile(file, ownerType, ownerId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("File uploaded successfully", toMap(saved)));
    }

    /**
     * Floor plan specific upload — shortcut for ownerType=floor.
     */
    @Operation(summary = "Execute POST operation in FileUploadController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/upload-floorplan/{floorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFloorPlan(
            @PathVariable Long floorId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isEngineer = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ENGINEER"));

        if (isEngineer) {
            Floor floor = floorRepository.findById(floorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", floorId));
            Long floorOrgId = floor.getBuilding().getProperty().getOrganization().getId();
            Long userOrgId = userDetails.getOrganizationId();

            if (userOrgId == null || !userOrgId.equals(floorOrgId)) {
                throw new AccessDeniedException("Access Denied: You can only upload floor plans to properties within your assigned organization.");
            }
        }

        FloorPlan floorPlan = fileStorageService.uploadFloorPlan(file, floorId, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Floor plan uploaded successfully", toMap(floorPlan)));
    }

    @Operation(summary = "Execute GET operation in FileUploadController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/floor-plan/{id}/download")
    public ResponseEntity<Resource> downloadFloorPlan(@PathVariable Long id) throws IOException {
        FloorPlan plan = fileStorageService.getFloorPlanById(id);
        Resource resource = fileStorageService.loadFile(id);
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (plan.getFileType() != null) {
            try {
                mediaType = MediaType.parseMediaType(plan.getFileType());
            } catch (Exception ignored) {
            }
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + plan.getFileName() + "\"")
                .body(resource);
    }

    @Operation(summary = "Execute GET operation in FileUploadController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/floor-plans/floor/{floorId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFloorPlans(@PathVariable Long floorId) {
        List<FloorPlan> plans = fileStorageService.getFloorPlansByFloor(floorId);
        List<Map<String, Object>> result = plans.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "Execute DELETE operation in FileUploadController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/floor-plan/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteFloorPlan(@PathVariable Long id) throws IOException {
        fileStorageService.deleteFloorPlan(id);
        return ResponseEntity.ok(ApiResponse.ok("Floor plan deleted"));
    }

    private Map<String, Object> toMap(FloorPlan fp) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", fp.getId());
        map.put("ownerType", fp.getOwnerType());
        map.put("ownerId", fp.getOwnerId());
        map.put("fileName", fp.getFileName());
        map.put("fileType", fp.getFileType());
        map.put("fileSize", fp.getFileSize());
        map.put("checksumSha256", fp.getChecksumSha256());
        map.put("uploadedAt", fp.getUploadedAt());
        return map;
    }
}