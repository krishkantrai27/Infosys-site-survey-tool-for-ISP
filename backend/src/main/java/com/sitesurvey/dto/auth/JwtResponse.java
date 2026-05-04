package com.sitesurvey.dto.auth;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private long expiresIn;
    private Long id;
    private String username;
    private String email;
    private List<String> roles;
    private String profilePicture;
}
