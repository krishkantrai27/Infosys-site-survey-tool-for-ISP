package com.sitesurvey.dto.report;

import com.sitesurvey.model.ReportStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponse {
    private Long id;
    private Long propertyId;
    private String propertyName;
    private String requestedByUsername;
    private ReportStatus status;
    private Long pdfFileId;
    private String parameters;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
