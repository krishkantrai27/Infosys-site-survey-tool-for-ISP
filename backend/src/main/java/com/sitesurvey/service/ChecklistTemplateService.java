package com.sitesurvey.service;

import com.sitesurvey.dto.checklist.ChecklistTemplateRequest;
import com.sitesurvey.dto.checklist.ChecklistTemplateResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.ChecklistTemplate;
import com.sitesurvey.repository.ChecklistTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChecklistTemplateService {

    private final ChecklistTemplateRepository templateRepository;

    public ChecklistTemplateResponse create(ChecklistTemplateRequest request, Long organizationId) {
        Long targetOrgId = request.getOrganizationId() != null ? request.getOrganizationId() : organizationId;
        ChecklistTemplate template = ChecklistTemplate.builder()
                .organizationId(targetOrgId)
                .name(request.getName())
                .scope(request.getScope().toUpperCase())
                .version(1)
                .schemaJson(request.getSchemaJson())
                .isActive(true)
                .build();
        return toResponse(templateRepository.save(template));
    }

    public List<ChecklistTemplateResponse> getActiveTemplates(Long organizationId) {
        return templateRepository.findByOrganizationIdAndIsActiveTrue(organizationId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ChecklistTemplateResponse getById(Long id) {
        ChecklistTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistTemplate", "id", id));
        return toResponse(template);
    }

    @Transactional
    public ChecklistTemplateResponse update(Long id, ChecklistTemplateRequest request) {
        ChecklistTemplate existing = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistTemplate", "id", id));

        // Deactivate the old version
        existing.setIsActive(false);
        templateRepository.save(existing);

        // Create a new version
        Long targetOrgId = request.getOrganizationId() != null ? request.getOrganizationId() : existing.getOrganizationId();
        ChecklistTemplate newVersion = ChecklistTemplate.builder()
                .organizationId(targetOrgId)
                .name(request.getName())
                .scope(request.getScope().toUpperCase())
                .version(existing.getVersion() + 1)
                .schemaJson(request.getSchemaJson())
                .isActive(true)
                .build();
        return toResponse(templateRepository.save(newVersion));
    }

    public void deactivate(Long id) {
        ChecklistTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistTemplate", "id", id));
        template.setIsActive(false);
        templateRepository.save(template);
    }

    private ChecklistTemplateResponse toResponse(ChecklistTemplate t) {
        return ChecklistTemplateResponse.builder()
                .id(t.getId())
                .organizationId(t.getOrganizationId())
                .name(t.getName())
                .scope(t.getScope())
                .version(t.getVersion())
                .schemaJson(t.getSchemaJson())
                .isActive(t.getIsActive())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
