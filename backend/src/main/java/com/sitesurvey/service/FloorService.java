package com.sitesurvey.service;

import com.sitesurvey.dto.floor.FloorRequest;
import com.sitesurvey.dto.floor.FloorResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Building;
import com.sitesurvey.model.Floor;
import com.sitesurvey.model.FloorPlan;
import com.sitesurvey.model.Space;
import com.sitesurvey.repository.BuildingRepository;
import com.sitesurvey.repository.FloorPlanRepository;
import com.sitesurvey.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FloorService {

    private final FloorRepository floorRepository;
    private final BuildingRepository buildingRepository;
    private final FloorPlanRepository floorPlanRepository;
    private final SpaceService spaceService;

    @Transactional(readOnly = true)
    public List<FloorResponse> getByBuilding(Long buildingId) {
        return floorRepository.findByBuildingIdWithFloorPlan(buildingId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FloorResponse getById(Long id) {
        Floor floor = floorRepository.findByIdWithFloorPlan(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", id));
        return toResponse(floor);
    }

    @Transactional
    public FloorResponse create(FloorRequest request) {
        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("Building", "id", request.getBuildingId()));
        Floor floor = Floor.builder()
                .name(request.getLevelLabel())
                .floorNumber(request.getElevationM())
                .scaleRatio(request.getScaleRatio())
                .anchorPoints(request.getAnchorPoints())
                .building(building)
                .build();
        Floor saved = floorRepository.save(floor);

        // Update building floorsCount to actual number of floors
        int actualCount = floorRepository.findByBuildingId(building.getId()).size();
        building.setFloorsCount(actualCount);
        buildingRepository.save(building);

        return toResponse(saved);
    }

    public FloorResponse update(Long id, FloorRequest request) {
        Floor floor = floorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", id));
        floor.setName(request.getLevelLabel());
        floor.setFloorNumber(request.getElevationM());
        floor.setScaleRatio(request.getScaleRatio());
        floor.setAnchorPoints(request.getAnchorPoints());
        return toResponse(floorRepository.save(floor));
    }

    @Transactional
    public void delete(Long id) {
        Floor floor = floorRepository.findByIdWithFloorPlan(id)
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", id));
        Building building = floor.getBuilding();
        Long buildingId = building.getId();

        cleanupExternalDependencies(floor);

        // Delete the floor
        floorRepository.deleteById(id);
        floorRepository.flush();

        // Re-number remaining auto-generated floors ("Floor X" pattern)
        List<Floor> remaining = floorRepository.findByBuildingId(buildingId);
        int counter = 1;
        for (Floor f : remaining) {
            // Only renumber floors that follow the "Floor N" naming pattern
            if (f.getName() != null && f.getName().matches("^Floor \\d+$")) {
                f.setName("Floor " + counter);
                floorRepository.save(f);
            }
            counter++;
        }

        // Update building floorsCount to actual number of floors
        building.setFloorsCount(remaining.size());
        buildingRepository.save(building);
    }

    private FloorResponse toResponse(Floor f) {
        FloorResponse.FloorResponseBuilder builder = FloorResponse.builder()
                .id(f.getId())
                .levelLabel(f.getName())
                .elevationM(f.getFloorNumber())
                .scaleRatio(f.getScaleRatio())
                .anchorPoints(f.getAnchorPoints())
                .spaceCount(f.getSpaces() != null ? f.getSpaces().size() : 0)
                .buildingId(f.getBuilding().getId())
                .buildingName(f.getBuilding().getName())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt());

        // Include floor plan metadata if a plan is linked
        if (f.getFloorPlan() != null) {
            builder.planFileId(f.getFloorPlan().getId())
                    .planFileName(f.getFloorPlan().getFileName())
                    .planFileType(f.getFloorPlan().getFileType())
                    .planFileSize(f.getFloorPlan().getFileSize())
                    .planUploadedBy(f.getFloorPlan().getUploadedBy() != null
                            ? f.getFloorPlan().getUploadedBy().getUsername()
                            : null)
                    .planUploadedAt(f.getFloorPlan().getUploadedAt());
        }

        return builder.build();
    }

    @Transactional
    public void cleanupExternalDependencies(Floor floor) {
        // 1. Clean up external dependencies from all spaces in this floor
        for (Space space : floor.getSpaces()) {
            spaceService.cleanupExternalDependencies(space.getId());
        }

        // 2. Detach the plan_file_id FK on the floor so we can delete the file row
        if (floor.getFloorPlan() != null) {
            floor.setFloorPlan(null);
            floorRepository.saveAndFlush(floor);
        }

        // 3. Delete all FloorPlan (files) rows that reference this floor
        List<FloorPlan> plans = floorPlanRepository.findByFloorId(floor.getId());
        if (!plans.isEmpty()) {
            floorPlanRepository.deleteAll(plans);
            floorPlanRepository.flush();
        }
    }
}
