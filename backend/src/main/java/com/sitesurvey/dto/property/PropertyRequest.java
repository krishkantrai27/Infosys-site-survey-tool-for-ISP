package com.sitesurvey.dto.property;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PropertyRequest {
    @NotBlank
    private String name;
    @NotNull
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
    @NotNull(message = "Longitude is required")
    private BigDecimal longitude;
    
    // Optional: Engineer explicitly assigned to this property
    private Long assignedEngineerId;
    @NotNull
    private Long organizationId;
}
