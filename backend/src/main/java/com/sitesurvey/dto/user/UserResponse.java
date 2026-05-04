package com.sitesurvey.dto.user;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String profilePicture;
    private Boolean isActive;
    private Long organizationId;
    private String organizationName;
    private List<String> roles;
    private LocalDateTime createdAt;
}
