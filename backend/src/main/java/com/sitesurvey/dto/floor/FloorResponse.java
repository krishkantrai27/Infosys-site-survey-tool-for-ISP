package com.sitesurvey.dto.floor;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloorResponse {
    private Long id;
    private String levelLabel;
    private BigDecimal elevationM;
    private BigDecimal scaleRatio;
    private String anchorPoints;
    private int spaceCount;
    private Long buildingId;
    private String buildingName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Floor plan info
    private Long planFileId;
    private String planFileName;
    private String planFileType;
    private Long planFileSize;
    private String planUploadedBy;
    private LocalDateTime planUploadedAt;
}
