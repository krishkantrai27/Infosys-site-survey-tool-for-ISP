package com.sitesurvey.controller;

import com.sitesurvey.dto.EquipmentDTO;
import com.sitesurvey.service.EquipmentService;
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
@Tag(name = "EquipmentController", description = "Operations for EquipmentController")
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final AttachmentService attachmentService;

    @Operation(summary = "Execute POST operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/spaces/{id}/equipment")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<EquipmentDTO> addEquipment(@PathVariable Long id, @RequestBody EquipmentDTO dto) {
        return new ResponseEntity<>(equipmentService.addEquipment(id, dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Execute GET operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/equipment")
    public ResponseEntity<List<EquipmentDTO>> getAllEquipment() {
        return ResponseEntity.ok(equipmentService.getAllEquipment());
    }

    @Operation(summary = "Execute GET operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/spaces/{id}/equipment")
    public ResponseEntity<List<EquipmentDTO>> getEquipmentInSpace(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentInSpace(id));
    }

    @Operation(summary = "Execute GET operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/equipment/{id}")
    public ResponseEntity<EquipmentDTO> getEquipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    @Operation(summary = "Execute PUT operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/equipment/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<EquipmentDTO> updateEquipment(@PathVariable Long id, @RequestBody EquipmentDTO dto) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, dto));
    }

    @Operation(summary = "Execute DELETE operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Execute POST operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/equipment/{id}/attachments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<ApiResponse<AttachmentDTO>> uploadAttachment(
            @PathVariable Long id,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "metadata", required = false) String metadata,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        AttachmentDTO created = attachmentService.uploadAndAttach(
                "equipment", id, tags, metadata, file, userDetails.getId()
        );
        return ResponseEntity.ok(ApiResponse.ok("File uploaded and attached successfully", created));
    }

    @Operation(summary = "Execute GET operation in EquipmentController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/equipment/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentDTO>>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(attachmentService.listByOwner("equipment", id)));
    }
}