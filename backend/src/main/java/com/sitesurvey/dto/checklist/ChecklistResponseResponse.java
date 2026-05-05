package com.sitesurvey.dto.checklist;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistResponseResponse {
    private Long id;
    private Long templateId;
    private String targetType;
    private Long targetId;
    private String answersJson;
    private String photosManifest;
    private Long submittedBy;
    private String submitterName;
    private String submitterOrganization;
    private LocalDateTime submittedAt;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
