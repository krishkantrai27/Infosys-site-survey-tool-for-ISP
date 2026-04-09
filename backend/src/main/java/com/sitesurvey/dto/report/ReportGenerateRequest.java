package com.sitesurvey.dto.report;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportGenerateRequest {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    private boolean includeFloorPlans = true;
    private boolean includeChecklists = true;
    private boolean includeEquipment = true;
    private boolean includeRf = true;
}
