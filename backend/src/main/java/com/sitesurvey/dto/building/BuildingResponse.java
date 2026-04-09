package com.sitesurvey.dto.building;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingResponse {
    private Long id;
    private String name;
    private String code;
    private String footprintType;
    private String footprintWkt;
    private Integer floorsCount;
    private int floorCount;
    private Long propertyId;
    private String propertyName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Alias so frontend can read as totalFloors */
    @JsonProperty("totalFloors")
    public Integer getTotalFloors() {
        return floorsCount;
    }
}
