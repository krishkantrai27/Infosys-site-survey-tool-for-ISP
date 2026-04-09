package com.sitesurvey.dto.space;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import com.sitesurvey.model.SpaceType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SpaceRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private SpaceType type;

    private String notes;

    @NotNull
    private Long floorId;
}
