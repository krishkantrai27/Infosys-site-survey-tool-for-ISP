package com.sitesurvey.dto.checklist;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistTemplateRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String scope;

    @NotBlank
    private String schemaJson;
    
    private Long organizationId;
}
