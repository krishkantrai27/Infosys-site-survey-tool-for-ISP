package com.sitesurvey.dto;

import com.sitesurvey.model.CableMedium;
import com.sitesurvey.model.GeometryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CablePathDTO {
    private Long id;
    private Long propertyId;
    private Long fromSpaceId;
    private Long toSpaceId;
    private CableMedium medium;
    private BigDecimal lengthM;
    private Integer slackLoops;
    private GeometryType geometryType;
    private String geometryWkt;
    private String notes;
    private List<SplicePointDTO> splicePoints;
}
