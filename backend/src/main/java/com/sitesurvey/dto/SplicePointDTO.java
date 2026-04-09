package com.sitesurvey.dto;

import com.sitesurvey.model.GeometryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SplicePointDTO {
    private Long id;
    private Long cablePathId;
    private GeometryType geometryType;
    private String geometryWkt;
    private String enclosureId;
    private String notes;
}
