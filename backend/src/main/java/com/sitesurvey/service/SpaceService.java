package com.sitesurvey.service;

import com.sitesurvey.dto.space.GeometryUpdateRequest;
import com.sitesurvey.dto.space.SpaceRequest;
import com.sitesurvey.dto.space.SpaceResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Floor;
import com.sitesurvey.model.Space;
import com.sitesurvey.model.SpaceType;
import com.sitesurvey.repository.FloorRepository;
import com.sitesurvey.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final FloorRepository floorRepository;
    private final com.sitesurvey.repository.EquipmentRepository equipmentRepository;
    private final com.sitesurvey.repository.CablePathRepository cablePathRepository;

    // Basic WKT validation patterns
    private static final Pattern WKT_POINT = Pattern.compile(
            "^POINT\\s*\\(\\s*-?\\d+(\\.\\d+)?\\s+-?\\d+(\\.\\d+)?\\s*\\)$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern WKT_POLYGON = Pattern.compile(
            "^POLYGON\\s*\\(\\(.*\\)\\)$",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern WKT_MULTIPOLYGON = Pattern.compile(
            "^MULTIPOLYGON\\s*\\(\\(\\(.*\\)\\)\\)$",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    public List<SpaceResponse> getAll() {
        return spaceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SpaceResponse> getByFloor(Long floorId) {
        return spaceRepository.findByFloorId(floorId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SpaceResponse getById(Long id) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Space", "id", id));
        return toResponse(space);
    }

    public SpaceResponse create(SpaceRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", request.getFloorId()));
        Space space = Space.builder()
                .name(request.getName())
                .type(request.getType())
                .notes(request.getNotes())
                .floor(floor)
                .build();
        return toResponse(spaceRepository.save(space));
    }

    public SpaceResponse update(Long id, SpaceRequest request) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Space", "id", id));
        space.setName(request.getName());
        space.setType(request.getType());
        space.setNotes(request.getNotes());
        return toResponse(spaceRepository.save(space));
    }

    @Transactional
    public SpaceResponse updateGeometry(Long id, GeometryUpdateRequest request) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Space", "id", id));

        // Validate WKT string
        String wkt = request.getGeometryWkt().trim();
        if (!isValidWkt(wkt)) {
            throw new IllegalArgumentException("Invalid WKT geometry string: " + wkt);
        }

        space.setGeometryWkt(wkt);
        space.setGeometryType(request.getGeometryType());
        space.setAreaSqM(request.getAreaSqM());
        return toResponse(spaceRepository.save(space));
    }

    public List<SpaceResponse> getSpacesWithGeometryByFloor(Long floorId) {
        return spaceRepository.findByFloorId(floorId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long id) {
        if (!spaceRepository.existsById(id))
            throw new ResourceNotFoundException("Space", "id", id);
            
        cleanupExternalDependencies(id);

        // Delete Space (core entity)
        spaceRepository.deleteById(id);
    }

    @Transactional
    public void cleanupExternalDependencies(Long id) {
        // Delete all equipment associated with this space
        equipmentRepository.deleteAll(equipmentRepository.findBySpaceId(id));

        // Delete all cable paths originating or terminating in this space
        cablePathRepository.deleteAll(cablePathRepository.findByFromSpaceIdOrToSpaceId(id, id));
    }

    private boolean isValidWkt(String wkt) {
        if (wkt == null || wkt.isBlank()) return false;
        return WKT_POINT.matcher(wkt).matches()
                || WKT_POLYGON.matcher(wkt).matches()
                || WKT_MULTIPOLYGON.matcher(wkt).matches();
    }

    private SpaceResponse toResponse(Space s) {
        Long buildingId = null;
        String buildingName = null;
        Long propertyId = null;
        String propertyName = null;

        if (s.getFloor() != null && s.getFloor().getBuilding() != null) {
            buildingId = s.getFloor().getBuilding().getId();
            buildingName = s.getFloor().getBuilding().getName();
            if (s.getFloor().getBuilding().getProperty() != null) {
                propertyId = s.getFloor().getBuilding().getProperty().getId();
                propertyName = s.getFloor().getBuilding().getProperty().getName();
            }
        }

        return SpaceResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .type(s.getType())
                .notes(s.getNotes())
                .geometryWkt(s.getGeometryWkt())
                .geometryType(s.getGeometryType())
                .areaSqM(s.getAreaSqM())
                .floorId(s.getFloor() != null ? s.getFloor().getId() : null)
                .floorName(s.getFloor() != null ? s.getFloor().getName() : null)
                .buildingId(buildingId)
                .buildingName(buildingName)
                .propertyId(propertyId)
                .propertyName(propertyName)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
