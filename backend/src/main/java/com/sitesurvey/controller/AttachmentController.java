package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.AttachmentDTO;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.AttachmentService;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@Tag(name = "AttachmentController", description = "Operations for AttachmentController")
public class AttachmentController {

    private final AttachmentService attachmentService;

    @Operation(summary = "Execute POST operation in AttachmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<AttachmentDTO>> attachFile(@RequestBody AttachmentDTO attachmentDTO) {
        AttachmentDTO created = attachmentService.attach(attachmentDTO);
        return ResponseEntity.ok(ApiResponse.ok("File attached successfully", created));
    }

    @Operation(summary = "Execute GET operation in AttachmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> listAttachments(
            @RequestParam String ownerType,
            @RequestParam Long ownerId) {
        List<AttachmentDTO> attachments = attachmentService.listByOwner(ownerType, ownerId);
        return ResponseEntity.ok(ApiResponse.ok(attachments));
    }

    @Operation(summary = "Execute GET operation in AttachmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AttachmentDTO>> getAttachment(@PathVariable Long id) {
        AttachmentDTO attachment = attachmentService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(attachment));
    }

    @Operation(summary = "Execute DELETE operation in AttachmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<String>> detachFile(@PathVariable Long id) {
        attachmentService.delete(id);
        // Note: detaching a file leaves the actual file intact in the DB/disk
        return ResponseEntity.ok(ApiResponse.ok("Attachment removed successfully"));
    }

    @Operation(summary = "Execute POST operation in AttachmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<AttachmentDTO>> uploadAndAttach(
            @RequestParam("ownerType") String ownerType,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "metadata", required = false) String metadata,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        AttachmentDTO created = attachmentService.uploadAndAttach(
                ownerType, ownerId, tags, metadata, file, userDetails.getId()
        );
        return ResponseEntity.ok(ApiResponse.ok("File uploaded and attached successfully", created));
    }
}