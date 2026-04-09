package com.sitesurvey.dto;

import com.sitesurvey.model.RfTool;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfScanUploadRequest {

    @NotNull(message = "Property ID is required")
    private Long propertyId;

    @NotNull(message = "Floor ID is required")
    private Long floorId;

    @NotNull(message = "Tool enumeration is required")
    private RfTool tool;
}
