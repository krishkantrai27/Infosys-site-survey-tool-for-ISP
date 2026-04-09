package com.sitesurvey.dto.org;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationResponse {
    private Long id;
    private String name;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private Boolean isActive;
    private int memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
