package com.sitesurvey.dto.floor;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FloorRequest {
    @NotBlank
    @JsonProperty("levelLabel")
    @JsonAlias("name")
    private String levelLabel;

    @JsonProperty("elevationM")
    @JsonAlias("floorNumber")
    private BigDecimal elevationM;

    private BigDecimal scaleRatio;
    private String anchorPoints;
    @NotNull
    private Long buildingId;
}
