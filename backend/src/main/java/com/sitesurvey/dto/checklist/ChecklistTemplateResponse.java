package com.sitesurvey.dto.checklist;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistTemplateResponse {
    private Long id;
    private Long organizationId;
    private String name;
    private String scope;
    private Integer version;
    private String schemaJson;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
