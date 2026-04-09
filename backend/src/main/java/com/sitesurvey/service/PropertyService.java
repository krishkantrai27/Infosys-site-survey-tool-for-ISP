package com.sitesurvey.service;

import com.sitesurvey.dto.property.PropertyRequest;
import com.sitesurvey.dto.property.PropertyResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.*;
import com.sitesurvey.repository.OrganizationRepository;
import com.sitesurvey.repository.PropertyRepository;
import com.sitesurvey.repository.UserRepository;
import com.sitesurvey.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final BuildingService buildingService;

    public List<PropertyResponse> getAll(UserDetailsImpl userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isEngineer = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ENGINEER"));

        // ADMIN — sees ALL properties across all organizations
        if (isAdmin) {
            return propertyRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
        }

        // ENGINEER — sees properties assigned to them (or unassigned) in their org
        if (isEngineer) {
            Long userOrgId = userDetails.getOrganizationId();
            if (userOrgId == null) {
                return List.of();
            }
            return propertyRepository.findForEngineer(userOrgId, userDetails.getId()).stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }

        // CUSTOMER — sees all properties in their assigned org
        Long userOrgId = userDetails.getOrganizationId();
        if (userOrgId == null) {
            return List.of();
        }
        return propertyRepository.findByOrganizationId(userOrgId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<PropertyResponse> getByOrganization(Long orgId) {
        return propertyRepository.findByOrganizationId(orgId).stream().map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PropertyResponse getById(Long id, UserDetailsImpl userDetails) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", id));

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isEngineer = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ENGINEER"));

        if (isAdmin) {
            // Admin sees ALL properties across all orgs — no restriction
        } else if (isEngineer) {
            // Engineer sees properties in their org only
            Long userOrgId = userDetails.getOrganizationId();
            if (userOrgId == null || !property.getOrganization().getId().equals(userOrgId)) {
                throw new ResourceNotFoundException("Property", "id", id);
            }
        } else {
            // Customer sees properties in their org (read-only)
            Long userOrgId = userDetails.getOrganizationId();
            if (userOrgId == null || !property.getOrganization().getId().equals(userOrgId)) {
                throw new ResourceNotFoundException("Property", "id", id);
            }
        }
        return toResponse(property);
    }

    public PropertyResponse create(PropertyRequest request, Long userId) {
        Organization org = organizationRepository.findById(request.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.getOrganizationId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        User assignedEngineer = null;
        if (request.getAssignedEngineerId() != null) {
            assignedEngineer = userRepository.findById(request.getAssignedEngineerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedEngineerId()));
        }

        Property property = Property.builder()
                .name(request.getName())
                .type(EPropertyType.valueOf(request.getType()))
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .boundaryType(
                        request.getBoundaryType() != null ? GeometryType.valueOf(request.getBoundaryType()) : null)
                .boundaryWkt(request.getBoundaryWkt())
                .centroidLat(request.getCentroidLat())
                .centroidLon(request.getCentroidLon())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .organization(org)
                .createdBy(user)
                .assignedEngineer(assignedEngineer)
                .build();
        return toResponse(propertyRepository.save(property));
    }

    public PropertyResponse update(Long id, PropertyRequest request) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", id));

        User assignedEngineer = null;
        if (request.getAssignedEngineerId() != null) {
            assignedEngineer = userRepository.findById(request.getAssignedEngineerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedEngineerId()));
        }

        property.setName(request.getName());
        property.setType(EPropertyType.valueOf(request.getType()));
        property.setAddress(request.getAddress());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setPostalCode(request.getPostalCode());
        property.setCountry(request.getCountry());
        property.setBoundaryType(
                request.getBoundaryType() != null ? GeometryType.valueOf(request.getBoundaryType()) : null);
        property.setBoundaryWkt(request.getBoundaryWkt());
        property.setCentroidLat(request.getCentroidLat());
        property.setCentroidLon(request.getCentroidLon());
        property.setLatitude(request.getLatitude());
        property.setLongitude(request.getLongitude());
        property.setAssignedEngineer(assignedEngineer);
        return toResponse(propertyRepository.save(property));
    }

    @Transactional
    public void delete(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", id));
                
        // Clean up dependencies on child entities before deleting the property
        for (Building building : property.getBuildings()) {
            buildingService.cleanupExternalDependencies(building);
        }

        propertyRepository.deleteById(id);
    }

    private PropertyResponse toResponse(Property p) {
        return PropertyResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .type(p.getType().name())
                .address(p.getAddress())
                .city(p.getCity())
                .state(p.getState())
                .postalCode(p.getPostalCode())
                .country(p.getCountry())
                .boundaryType(p.getBoundaryType() != null ? p.getBoundaryType().name() : null)
                .boundaryWkt(p.getBoundaryWkt())
                .centroidLat(p.getCentroidLat())
                .centroidLon(p.getCentroidLon())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .organizationId(p.getOrganization().getId())
                .organizationName(p.getOrganization().getName())
                .createdByUsername(p.getCreatedBy() != null ? p.getCreatedBy().getUsername() : null)
                .assignedEngineerId(p.getAssignedEngineer() != null ? p.getAssignedEngineer().getId() : null)
                .assignedEngineerName(p.getAssignedEngineer() != null ? p.getAssignedEngineer().getUsername() : null)
                .buildingCount(p.getBuildings() != null ? p.getBuildings().size() : 0)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
