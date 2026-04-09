package com.sitesurvey.dto.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportRequest {

    @NotBlank(message = "Target type is required (e.g., 'space', 'floor')")
    private String targetType;

    @NotNull(message = "Target ID is required")
    private Long targetId;
}
