package com.sitesurvey.service;

import com.sitesurvey.dto.org.OrganizationRequest;
import com.sitesurvey.dto.org.OrganizationResponse;
import com.sitesurvey.dto.property.PropertyResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Organization;
import com.sitesurvey.repository.OrganizationRepository;
import com.sitesurvey.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    
    // Use @Lazy if there are circular injection issues, though typically it's fine here
    @Lazy
    private final PropertyService propertyService;

    /**
     * ADMIN — sees all active organizations
     * ENGINEER / CUSTOMER — sees only the organization they are assigned to
     */
    public List<OrganizationResponse> getAll(UserDetailsImpl userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // Admin sees all active organizations
            return organizationRepository.findAll().stream()
                    .filter(org -> !Boolean.FALSE.equals(org.getIsActive()))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        // Engineer/Customer — sees only their assigned organization
        Long userOrgId = userDetails.getOrganizationId();
        if (userOrgId == null) {
            return List.of();
        }
        return organizationRepository.findById(userOrgId)
                .filter(org -> !Boolean.FALSE.equals(org.getIsActive()))
                .map(this::toResponse)
                .stream().collect(Collectors.toList());
    }

    /**
     * Unfiltered getAll for internal use (e.g., admin user management dropdowns).
     */
    public List<OrganizationResponse> getAllUnfiltered() {
        return organizationRepository.findAll().stream()
                .filter(org -> !Boolean.FALSE.equals(org.getIsActive()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public OrganizationResponse getById(Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", id));
        return toResponse(org);
    }

    public OrganizationResponse create(OrganizationRequest request) {
        Organization org = Organization.builder()
                .name(request.getName())
                .address(request.getAddress())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .build();
        return toResponse(organizationRepository.save(org));
    }

    public OrganizationResponse update(Long id, OrganizationRequest request) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", id));
        org.setName(request.getName());
        org.setAddress(request.getAddress());
        org.setContactEmail(request.getContactEmail());
        org.setContactPhone(request.getContactPhone());
        return toResponse(organizationRepository.save(org));
    }

    @Transactional
    public void delete(Long id) {
        if (!organizationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Organization", "id", id);
        }
        
        // 1. Manually cascade delete to all properties belonging to this organization
        // This triggers the full cleanup engine (Properties -> Buildings -> Floors -> Spaces)
        List<PropertyResponse> properties = propertyService.getByOrganization(id);
        for (PropertyResponse prop : properties) {
            propertyService.delete(prop.getId());
        }
        
        // 2. Hard delete the organization (memberships cascade automatically via JPA)
        organizationRepository.deleteById(id);
    }

    private OrganizationResponse toResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .address(org.getAddress())
                .contactEmail(org.getContactEmail())
                .contactPhone(org.getContactPhone())
                .isActive(org.getIsActive())
                .memberCount(org.getMemberships() != null ? org.getMemberships().size() : 0)
                .createdAt(org.getCreatedAt())
                .updatedAt(org.getUpdatedAt())
                .build();
    }
}
