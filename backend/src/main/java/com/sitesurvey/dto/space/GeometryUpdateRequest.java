package com.sitesurvey.dto.space;

import com.sitesurvey.model.GeometryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GeometryUpdateRequest {

    @NotNull(message = "Geometry type is required")
    private GeometryType geometryType;

    @NotBlank(message = "Geometry WKT is required")
    private String geometryWkt;

    private BigDecimal areaSqM;
}
