package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.checklist.ChecklistResponseRequest;
import com.sitesurvey.dto.checklist.ChecklistResponseResponse;
import com.sitesurvey.dto.checklist.PhotoAttachRequest;
import com.sitesurvey.security.UserDetailsImpl;
import com.sitesurvey.service.ChecklistResponseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import com.sitesurvey.dto.AttachmentDTO;
import com.sitesurvey.service.AttachmentService;
import java.io.IOException;

import java.util.List;

@RestController
@RequestMapping("/api/checklist-responses")
@RequiredArgsConstructor
@Tag(name = "ChecklistResponseController", description = "Operations for ChecklistResponseController")
public class ChecklistResponseController {

    private final ChecklistResponseService responseService;
    private final AttachmentService attachmentService;

    @Operation(summary = "Execute POST operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<ChecklistResponseResponse>> saveOrSubmit(
            @Valid @RequestBody ChecklistResponseRequest request,
            @RequestParam(value = "submit", defaultValue = "false") boolean submit,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(
                submit ? "Response submitted" : "Draft saved",
                responseService.saveOrSubmit(request, currentUser.getId(), submit)));
    }

    @Operation(summary = "Execute GET operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChecklistResponseResponse>>> getByTarget(
            @RequestParam String targetType,
            @RequestParam Long targetId) {
        return ResponseEntity.ok(ApiResponse.ok(
                responseService.getByTarget(targetType, targetId)));
    }

    @Operation(summary = "Execute GET operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ChecklistResponseResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(responseService.getAll()));
    }

    @Operation(summary = "Execute GET operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ChecklistResponseResponse>>> getMy(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(responseService.getByUser(currentUser.getId())));
    }

    @Operation(summary = "Execute PUT operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<ChecklistResponseResponse>> updateDraft(
            @PathVariable Long id,
            @Valid @RequestBody ChecklistResponseRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Draft updated",
                responseService.updateDraft(id, request, currentUser.getId())));
    }

    @Operation(summary = "Execute POST operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<ChecklistResponseResponse>> submit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Response submitted",
                responseService.submit(id, currentUser.getId())));
    }

    @Operation(summary = "Execute POST operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/{id}/photos")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<ChecklistResponseResponse>> attachPhotos(
            @PathVariable Long id,
            @Valid @RequestBody PhotoAttachRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.ok("Photos attached",
                responseService.attachPhotos(id, request.getFileIds(), currentUser.getId())));
    }

    @Operation(summary = "Execute DELETE operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        responseService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Response deleted successfully"));
    }

    // ─── Attachment Endpoints ──────────────────────────────────────────

    @Operation(summary = "Execute POST operation in ChecklistResponseController")
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
                "checklist_response", id, tags, metadata, file, userDetails.getId()
        );
        return ResponseEntity.ok(ApiResponse.ok("File uploaded and attached successfully", created));
    }

    @Operation(summary = "Execute GET operation in ChecklistResponseController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(attachmentService.listByOwner("checklist_response", id)));
    }
}