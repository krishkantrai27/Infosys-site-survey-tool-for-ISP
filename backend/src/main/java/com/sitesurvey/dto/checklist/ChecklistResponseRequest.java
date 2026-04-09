package com.sitesurvey.dto.checklist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistResponseRequest {
    @NotNull
    private Long templateId;

    @NotBlank
    private String targetType;

    @NotNull
    private Long targetId;

    private String answersJson;
    
    private String status; // DRAFT or SUBMITTED
}
