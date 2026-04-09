package com.sitesurvey.dto.building;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuildingRequest {
    @NotBlank
    private String name;
    private String code;
    private String footprintType;
    private String footprintWkt;

    @JsonProperty("floorsCount")
    @JsonAlias("totalFloors")
    private Integer floorsCount;

    @NotNull
    private Long propertyId;
}
