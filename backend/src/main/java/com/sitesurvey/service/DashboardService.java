package com.sitesurvey.service;

import com.sitesurvey.dto.report.DashboardDTO;
import com.sitesurvey.model.*;
import com.sitesurvey.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final SpaceRepository spaceRepository;
    private final EquipmentRepository equipmentRepository;
    private final CablePathRepository cablePathRepository;
    private final RfScanRepository rfScanRepository;
    private final ChecklistResponseRepository checklistResponseRepository;
    private final ChecklistTemplateRepository checklistTemplateRepository;

    /**
     * Survey completion: % of spaces with at least one submitted checklist response, per property
     */
    public List<DashboardDTO.SurveyCompletion> getSurveyCompletion() {
        List<Property> properties = propertyRepository.findAll();
        List<DashboardDTO.SurveyCompletion> result = new ArrayList<>();

        // Get all space IDs that have been surveyed (SUBMITTED status)
        List<Long> surveyedSpaceIds = checklistResponseRepository
                .findDistinctTargetIdsByTargetTypeAndStatus("space", SubmissionStatus.SUBMITTED);

        for (Property property : properties) {
            List<Space> spaces = spaceRepository.findByPropertyId(property.getId());
            long totalSpaces = spaces.size();
            long surveyedSpaces = spaces.stream()
                    .filter(s -> surveyedSpaceIds.contains(s.getId()))
                    .count();
            double completionPercent = totalSpaces > 0 ? (surveyedSpaces * 100.0 / totalSpaces) : 0;

            result.add(DashboardDTO.SurveyCompletion.builder()
                    .propertyId(property.getId())
                    .propertyName(property.getName())
                    .totalSpaces(totalSpaces)
                    .surveyedSpaces(surveyedSpaces)
                    .completionPercent(Math.round(completionPercent * 10.0) / 10.0)
                    .build());
        }
        return result;
    }

    /**
     * Checklist status: count of open (DRAFT) vs submitted responses, grouped by template
     */
    public List<DashboardDTO.ChecklistStatus> getChecklistStatus() {
        List<ChecklistTemplate> templates = checklistTemplateRepository.findAll();
        List<DashboardDTO.ChecklistStatus> result = new ArrayList<>();

        for (ChecklistTemplate template : templates) {
            long draftCount = checklistResponseRepository.countByTemplateIdAndStatus(template.getId(), SubmissionStatus.DRAFT);
            long submittedCount = checklistResponseRepository.countByTemplateIdAndStatus(template.getId(), SubmissionStatus.SUBMITTED);
            long totalCount = checklistResponseRepository.countByTemplateId(template.getId());

            if (totalCount > 0) {
                result.add(DashboardDTO.ChecklistStatus.builder()
                        .templateId(template.getId())
                        .templateName(template.getName())
                        .draftCount(draftCount)
                        .submittedCount(submittedCount)
                        .totalCount(totalCount)
                        .build());
            }
        }
        return result;
    }

    /**
     * Equipment count per building with space breakdown
     */
    public List<DashboardDTO.EquipmentCount> getEquipmentCount() {
        List<Building> buildings = buildingRepository.findAll();
        List<DashboardDTO.EquipmentCount> result = new ArrayList<>();

        for (Building building : buildings) {
            long count = equipmentRepository.countByBuildingId(building.getId());
            List<Floor> floors = floorRepository.findByBuildingId(building.getId());
            List<DashboardDTO.SpaceEquipment> spaceEquipments = new ArrayList<>();

            for (Floor floor : floors) {
                List<Space> spaces = spaceRepository.findByFloorId(floor.getId());
                for (Space space : spaces) {
                    long spaceCount = equipmentRepository.findBySpaceId(space.getId()).size();
                    if (spaceCount > 0) {
                        spaceEquipments.add(DashboardDTO.SpaceEquipment.builder()
                                .spaceId(space.getId())
                                .spaceName(space.getName())
                                .count(spaceCount)
                                .build());
                    }
                }
            }

            if (count > 0 || !spaceEquipments.isEmpty()) {
                result.add(DashboardDTO.EquipmentCount.builder()
                        .buildingId(building.getId())
                        .buildingName(building.getName())
                        .equipmentCount(count)
                        .spaces(spaceEquipments)
                        .build());
            }
        }
        return result;
    }

    /**
     * RF scan coverage: floors with vs without RF scans per property
     */
    public List<DashboardDTO.RfScanCoverage> getRfScanCoverage() {
        List<Property> properties = propertyRepository.findAll();
        List<DashboardDTO.RfScanCoverage> result = new ArrayList<>();

        for (Property property : properties) {
            long totalFloors = floorRepository.countByPropertyId(property.getId());
            List<Long> scannedFloorIds = rfScanRepository.findDistinctFloorIdsByPropertyId(property.getId());
            long scannedFloors = scannedFloorIds.size();
            double coveragePercent = totalFloors > 0 ? (scannedFloors * 100.0 / totalFloors) : 0;

            result.add(DashboardDTO.RfScanCoverage.builder()
                    .propertyId(property.getId())
                    .propertyName(property.getName())
                    .totalFloors(totalFloors)
                    .scannedFloors(scannedFloors)
                    .coveragePercent(Math.round(coveragePercent * 10.0) / 10.0)
                    .build());
        }
        return result;
    }

    /**
     * Properties overview: summary card per property with counts
     */
    public List<DashboardDTO.PropertyOverview> getPropertiesOverview() {
        List<Property> properties = propertyRepository.findAll();
        List<Long> surveyedSpaceIds = checklistResponseRepository
                .findDistinctTargetIdsByTargetTypeAndStatus("space", SubmissionStatus.SUBMITTED);

        return properties.stream().map(property -> {
            Long pid = property.getId();
            List<Space> spaces = spaceRepository.findByPropertyId(pid);
            long totalSpaces = spaces.size();
            long surveyedSpaces = spaces.stream()
                    .filter(s -> surveyedSpaceIds.contains(s.getId()))
                    .count();
            double surveyPercent = totalSpaces > 0 ? (surveyedSpaces * 100.0 / totalSpaces) : 0;

            return DashboardDTO.PropertyOverview.builder()
                    .propertyId(pid)
                    .propertyName(property.getName())
                    .propertyType(property.getType() != null ? property.getType().name() : "N/A")
                    .address(property.getAddress())
                    .buildingCount(buildingRepository.countByPropertyId(pid))
                    .floorCount(floorRepository.countByPropertyId(pid))
                    .spaceCount(totalSpaces)
                    .equipmentCount(equipmentRepository.countByPropertyId(pid))
                    .cablePathCount(cablePathRepository.countByPropertyId(pid))
                    .rfScanCount(rfScanRepository.countByPropertyId(pid))
                    .checklistResponseCount(surveyedSpaces)
                    .surveyCompletionPercent(Math.round(surveyPercent * 10.0) / 10.0)
                    .build();
        }).collect(Collectors.toList());
    }
}
