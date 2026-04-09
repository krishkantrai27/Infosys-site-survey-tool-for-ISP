package com.sitesurvey.service;

import com.sitesurvey.dto.building.BuildingRequest;
import com.sitesurvey.dto.building.BuildingResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Building;
import com.sitesurvey.model.Floor;
import com.sitesurvey.model.GeometryType;
import com.sitesurvey.model.Property;
import com.sitesurvey.repository.BuildingRepository;
import com.sitesurvey.repository.FloorRepository;
import com.sitesurvey.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final PropertyRepository propertyRepository;
    private final FloorRepository floorRepository;
    private final FloorService floorService;

    public List<BuildingResponse> getByProperty(Long propertyId) {
        return buildingRepository.findByPropertyId(propertyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BuildingResponse getById(Long id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building", "id", id));
        return toResponse(building);
    }

    @Transactional
    public BuildingResponse create(BuildingRequest request) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", request.getPropertyId()));
        Building building = Building.builder()
                .name(request.getName())
                .code(request.getCode())
                .footprintType(
                        request.getFootprintType() != null ? GeometryType.valueOf(request.getFootprintType()) : null)
                .footprintWkt(request.getFootprintWkt())
                .floorsCount(request.getFloorsCount())
                .property(property)
                .build();
        Building saved = buildingRepository.save(building);

        // Auto-create Floor entities
        autoCreateFloors(saved, request.getFloorsCount());

        return toResponse(saved);
    }

    @Transactional
    public BuildingResponse update(Long id, BuildingRequest request) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building", "id", id));
        building.setName(request.getName());
        building.setCode(request.getCode());
        building.setFootprintType(
                request.getFootprintType() != null ? GeometryType.valueOf(request.getFootprintType()) : null);
        building.setFootprintWkt(request.getFootprintWkt());
        building.setFloorsCount(request.getFloorsCount());
        Building saved = buildingRepository.save(building);

        // Auto-create missing Floor entities
        autoCreateFloors(saved, request.getFloorsCount());

        return toResponse(saved);
    }

    /**
     * Auto-creates Floor entities (e.g., "Floor 1", "Floor 2", ...) if they don't
     * already exist.
     * Only adds missing floors — does not delete existing ones.
     */
    private void autoCreateFloors(Building building, Integer floorsCount) {
        if (floorsCount == null || floorsCount <= 0)
            return;

        List<Floor> existingFloors = floorRepository.findByBuildingId(building.getId());
        int existingCount = existingFloors.size();

        // Create only the missing floors
        for (int i = existingCount + 1; i <= floorsCount; i++) {
            Floor floor = Floor.builder()
                    .name("Floor " + i)
                    .building(building)
                    .build();
            floorRepository.save(floor);
        }
    }

    @Transactional
    public void delete(Long id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Building", "id", id));
                
        cleanupExternalDependencies(building);
        
        buildingRepository.deleteById(id);
    }

    @Transactional
    public void cleanupExternalDependencies(Building building) {
        for (Floor floor : building.getFloors()) {
            floorService.cleanupExternalDependencies(floor);
        }
    }

    private BuildingResponse toResponse(Building b) {
        return BuildingResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .code(b.getCode())
                .footprintType(b.getFootprintType() != null ? b.getFootprintType().name() : null)
                .footprintWkt(b.getFootprintWkt())
                .floorsCount(b.getFloorsCount())
                .floorCount(b.getFloors() != null ? b.getFloors().size() : 0)
                .propertyId(b.getProperty().getId())
                .propertyName(b.getProperty().getName())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
