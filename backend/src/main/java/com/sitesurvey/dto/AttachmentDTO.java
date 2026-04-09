package com.sitesurvey.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentDTO {

    private Long id;
    private String ownerType;
    private Long ownerId;
    private Long fileId;
    private String tags;
    private String metadata;

    // Nested file info (populated in responses)
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String downloadUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
