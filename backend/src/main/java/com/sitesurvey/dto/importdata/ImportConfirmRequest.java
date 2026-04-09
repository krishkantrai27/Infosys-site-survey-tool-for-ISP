package com.sitesurvey.dto.importdata;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImportConfirmRequest {
    @NotBlank
    private String sessionToken;
}
