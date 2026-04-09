package com.sitesurvey.dto.membership;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipResponse {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Long organizationId;
    private String organizationName;
    private LocalDateTime createdAt;
}
