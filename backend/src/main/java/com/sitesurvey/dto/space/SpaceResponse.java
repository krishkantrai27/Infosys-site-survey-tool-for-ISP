package com.sitesurvey.dto.space;

import lombok.*;
import com.sitesurvey.model.GeometryType;
import com.sitesurvey.model.SpaceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceResponse {
    private Long id;
    private String name;
    private SpaceType type;
    private String notes;
    private String geometryWkt;
    private GeometryType geometryType;
    private BigDecimal areaSqM;
    private Long floorId;
    private String floorName;
    private Long buildingId;
    private String buildingName;
    private Long propertyId;
    private String propertyName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
