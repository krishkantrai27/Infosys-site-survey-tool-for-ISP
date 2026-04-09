package com.sitesurvey.dto.property;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyResponse {
    private Long id;
    private String name;
    private String type;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String boundaryType;
    private String boundaryWkt;
    private BigDecimal centroidLat;
    private BigDecimal centroidLon;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Long organizationId;
    private String organizationName;
    private String createdByUsername;
    private Integer buildingCount;
    private Long assignedEngineerId;
    private String assignedEngineerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
