package com.sitesurvey.dto;

import com.sitesurvey.model.EquipmentType;
import com.sitesurvey.model.GeometryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDTO {
    private Long id;
    private Long spaceId;
    private EquipmentType type;
    private String model;
    private String vendor;
    private BigDecimal powerWatts;
    private Integer heatLoadBtuh;
    private String mounting;
    private GeometryType geometryType;
    private String geometryWkt;
    private String serialNumber;
}
