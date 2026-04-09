package com.sitesurvey.dto.membership;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MembershipRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Role is required")
    private String role;
}
