package com.sitesurvey.dto.report;

import lombok.Builder;
import lombok.Data;

import java.util.List;

public class DashboardDTO {

    @Data
    @Builder
    public static class SurveyCompletion {
        private Long propertyId;
        private String propertyName;
        private long totalSpaces;
        private long surveyedSpaces;
        private double completionPercent;
    }

    @Data
    @Builder
    public static class ChecklistStatus {
        private Long templateId;
        private String templateName;
        private long draftCount;
        private long submittedCount;
        private long totalCount;
    }

    @Data
    @Builder
    public static class EquipmentCount {
        private Long buildingId;
        private String buildingName;
        private long equipmentCount;
        private List<SpaceEquipment> spaces;
    }

    @Data
    @Builder
    public static class SpaceEquipment {
        private Long spaceId;
        private String spaceName;
        private long count;
    }

    @Data
    @Builder
    public static class RfScanCoverage {
        private Long propertyId;
        private String propertyName;
        private long totalFloors;
        private long scannedFloors;
        private double coveragePercent;
    }

    @Data
    @Builder
    public static class PropertyOverview {
        private Long propertyId;
        private String propertyName;
        private String propertyType;
        private String address;
        private long buildingCount;
        private long floorCount;
        private long spaceCount;
        private long equipmentCount;
        private long cablePathCount;
        private long rfScanCount;
        private long checklistResponseCount;
        private double surveyCompletionPercent;
    }
}
