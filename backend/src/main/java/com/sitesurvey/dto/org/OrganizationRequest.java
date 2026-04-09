package com.sitesurvey.dto.org;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationRequest {
    @NotBlank(message = "Organization name is required")
    private String name;
    private String address;
    private String contactEmail;
    private String contactPhone;
}
