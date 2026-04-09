package com.sitesurvey.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sitesurvey.model.RfTool;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RfScanResponse {
    private Long id;
    private Long propertyId;
    private Long floorId;
    private RfTool tool;
    private Long rawFileId;
    private List<RfPointDto> parsedJson;
    private Long heatmapFileId;
    private String notes;
    private LocalDateTime createdAt;
}
