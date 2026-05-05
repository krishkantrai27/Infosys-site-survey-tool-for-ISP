package com.sitesurvey.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitesurvey.dto.checklist.ChecklistResponseRequest;
import com.sitesurvey.dto.checklist.ChecklistResponseResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.ChecklistResponse;
import com.sitesurvey.model.SubmissionStatus;
import com.sitesurvey.repository.ChecklistResponseRepository;
import com.sitesurvey.repository.ChecklistTemplateRepository;
import com.sitesurvey.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChecklistResponseService {

    private final ChecklistResponseRepository responseRepository;
    private final ChecklistTemplateRepository templateRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ChecklistResponseResponse saveOrSubmit(ChecklistResponseRequest request, Long userId, boolean submit) {
        // Validate template exists
        templateRepository.findById(request.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistTemplate", "id", request.getTemplateId()));

        ChecklistResponse response = ChecklistResponse.builder()
                .templateId(request.getTemplateId())
                .targetType(request.getTargetType().toUpperCase())
                .targetId(request.getTargetId())
                .answersJson(request.getAnswersJson())
                .submittedBy(userId)
                .submittedAt(submit ? LocalDateTime.now() : null)
                .status(submit ? SubmissionStatus.SUBMITTED : SubmissionStatus.DRAFT)
                .build();
        return toResponse(responseRepository.save(response));
    }

    public List<ChecklistResponseResponse> getByTarget(String targetType, Long targetId) {
        return responseRepository.findByTargetTypeAndTargetId(targetType.toUpperCase(), targetId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ChecklistResponseResponse> getAll() {
        return responseRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> SubmissionStatus.SUBMITTED.equals(r.getStatus()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ChecklistResponseResponse> getByUser(Long userId) {
        return responseRepository.findBySubmittedByOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ChecklistResponseResponse updateDraft(Long id, ChecklistResponseRequest request, Long userId) {
        ChecklistResponse response = responseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistResponse", "id", id));

        if (response.getSubmittedAt() != null) {
            throw new IllegalStateException("Cannot update a submitted response");
        }
        if (!response.getSubmittedBy().equals(userId)) {
            throw new IllegalStateException("You can only update your own draft responses");
        }

        response.setAnswersJson(request.getAnswersJson());
        response.setTargetType(request.getTargetType().toUpperCase());
        response.setTargetId(request.getTargetId());
        return toResponse(responseRepository.save(response));
    }

    public ChecklistResponseResponse submit(Long id, Long userId) {
        ChecklistResponse response = responseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistResponse", "id", id));

        if (response.getSubmittedAt() != null) {
            throw new IllegalStateException("Response is already submitted");
        }
        if (!response.getSubmittedBy().equals(userId)) {
            throw new IllegalStateException("You can only submit your own responses");
        }

        response.setSubmittedAt(LocalDateTime.now());
        response.setStatus(SubmissionStatus.SUBMITTED);
        return toResponse(responseRepository.save(response));
    }

    public ChecklistResponseResponse attachPhotos(Long id, List<Long> fileIds, Long userId) {
        ChecklistResponse response = responseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistResponse", "id", id));

        if (!response.getSubmittedBy().equals(userId)) {
            throw new IllegalStateException("You can only attach photos to your own responses");
        }

        try {
            // Merge with existing manifest
            List<Long> existingIds = new ArrayList<>();
            if (response.getPhotosManifest() != null && !response.getPhotosManifest().isBlank()) {
                existingIds = objectMapper.readValue(response.getPhotosManifest(), new TypeReference<List<Long>>() {});
            }
            existingIds.addAll(fileIds);
            response.setPhotosManifest(objectMapper.writeValueAsString(existingIds));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to process photos manifest JSON", e);
        }

        return toResponse(responseRepository.save(response));
    }

    public void delete(Long id) {
        if (!responseRepository.existsById(id)) {
            throw new ResourceNotFoundException("ChecklistResponse", "id", id);
        }
        responseRepository.deleteById(id);
    }

    private ChecklistResponseResponse toResponse(ChecklistResponse r) {
        String submitterName = "Unknown User";
        String orgName = "No Organization";
        
        if (r.getSubmittedBy() != null) {
            java.util.Optional<com.sitesurvey.model.User> optUser = userRepository.findById(r.getSubmittedBy());
            if (optUser.isPresent()) {
                com.sitesurvey.model.User u = optUser.get();
                String fullName = u.getFullName();
                submitterName = (fullName != null && !fullName.trim().isEmpty()) ? fullName : u.getUsername();
                if (u.getOrganization() != null) {
                    orgName = u.getOrganization().getName();
                }
            }
        }
        
        return ChecklistResponseResponse.builder()
                .id(r.getId())
                .templateId(r.getTemplateId())
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .answersJson(r.getAnswersJson())
                .photosManifest(r.getPhotosManifest())
                .submittedBy(r.getSubmittedBy())
                .submitterName(submitterName)
                .submitterOrganization(orgName)
                .submittedAt(r.getSubmittedAt())
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
