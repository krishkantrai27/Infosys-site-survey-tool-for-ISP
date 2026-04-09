package com.sitesurvey.service;

import com.sitesurvey.dto.AttachmentDTO;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Attachment;
import com.sitesurvey.model.FloorPlan;
import com.sitesurvey.repository.AttachmentRepository;
import com.sitesurvey.repository.FloorPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final FloorPlanRepository floorPlanRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public AttachmentDTO attach(AttachmentDTO dto) {
        FloorPlan file = floorPlanRepository.findById(dto.getFileId())
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", dto.getFileId()));

        Attachment attachment = Attachment.builder()
                .ownerType(dto.getOwnerType())
                .ownerId(dto.getOwnerId())
                .file(file)
                .tags(dto.getTags())
                .metadata(dto.getMetadata())
                .build();

        attachment = attachmentRepository.save(attachment);
        return mapToDTO(attachment);
    }

    public List<AttachmentDTO> listByOwner(String ownerType, Long ownerId) {
        return attachmentRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public AttachmentDTO getById(Long id) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", id));
        return mapToDTO(attachment);
    }

    @Transactional
    public void delete(Long id) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", id));
        // Only delete the attachment link, not the actual file (which might be used elsewhere)
        attachmentRepository.delete(attachment);
    }

    @Transactional
    public AttachmentDTO uploadAndAttach(String ownerType, Long ownerId, String tags, String metadata, MultipartFile file, Long userId) throws IOException {
        // 1. Upload the file
        FloorPlan savedFile = fileStorageService.uploadFile(file, ownerType, ownerId, userId);

        // 2. Create the attachment link
        Attachment attachment = Attachment.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .file(savedFile)
                .tags(tags)
                .metadata(metadata)
                .build();

        attachment = attachmentRepository.save(attachment);
        return mapToDTO(attachment);
    }

    private AttachmentDTO mapToDTO(Attachment attachment) {
        FloorPlan file = attachment.getFile();
        String downloadUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/floor-plan/")
                .path(file.getId().toString())
                .path("/download")
                .toUriString();

        return AttachmentDTO.builder()
                .id(attachment.getId())
                .ownerType(attachment.getOwnerType())
                .ownerId(attachment.getOwnerId())
                .fileId(file.getId())
                .tags(attachment.getTags())
                .metadata(attachment.getMetadata())
                .fileName(file.getFileName())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .downloadUrl(downloadUrl)
                .createdAt(attachment.getCreatedAt())
                .updatedAt(attachment.getUpdatedAt())
                .build();
    }
}
