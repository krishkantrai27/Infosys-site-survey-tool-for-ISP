package com.sitesurvey.controller;

import com.sitesurvey.dto.CablePathDTO;
import com.sitesurvey.service.CablePathService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.multipart.MultipartFile;
import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.AttachmentDTO;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.AttachmentService;
import java.io.IOException;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "CablePathController", description = "Operations for CablePathController")
public class CablePathController {

    private final CablePathService cablePathService;
    private final AttachmentService attachmentService;

    @Operation(summary = "Execute POST operation in CablePathController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/cable-paths")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<CablePathDTO> createCablePath(@RequestBody CablePathDTO dto) {
        return new ResponseEntity<>(cablePathService.createCablePath(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Execute GET operation in CablePathController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/cable-paths")
    public ResponseEntity<List<CablePathDTO>> getAllCablePaths() {
        return ResponseEntity.ok(cablePathService.getAllCablePaths());
    }

    @Operation(summary = "Execute GET operation in CablePathController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/properties/{id}/cable-paths")
    public ResponseEntity<List<CablePathDTO>> getCablePathsByProperty(@PathVariable Long id) {
        return ResponseEntity.ok(cablePathService.getCablePathsByProperty(id));
    }

    @Operation(summary = "Execute PUT operation in CablePathController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/cable-paths/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<CablePathDTO> updateCablePath(@PathVariable Long id, @RequestBody CablePathDTO dto) {
        return ResponseEntity.ok(cablePathService.updateCablePath(id, dto));
    }

    @Operation(summary = "Execute DELETE operation in CablePathController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/cable-paths/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCablePath(@PathVariable Long id) {
        cablePathService.deleteCablePath(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Attachment Endpoints ──────────────────────────────────────────

    @Operation(summary = "Execute POST operation in CablePathController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/cable-paths/{id}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<AttachmentDTO>> uploadAttachment(
            @PathVariable Long id,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "metadata", required = false) String metadata,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        AttachmentDTO created = attachmentService.uploadAndAttach(
                "cable_path", id, tags, metadata, file, userDetails.getId()
        );
        return ResponseEntity.ok(ApiResponse.ok("File uploaded and attached successfully", created));
    }

    @Operation(summary = "Execute GET operation in CablePathController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/cable-paths/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(attachmentService.listByOwner("cable_path", id)));
    }
}