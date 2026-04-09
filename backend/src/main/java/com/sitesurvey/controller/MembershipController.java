package com.sitesurvey.controller;

import com.sitesurvey.dto.ApiResponse;
import com.sitesurvey.dto.membership.MembershipRequest;
import com.sitesurvey.dto.membership.MembershipResponse;
import com.sitesurvey.dto.user.ChangeRoleRequest;
import com.sitesurvey.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


import java.util.List;

@RestController
@RequestMapping("/api/organizations/{orgId}/members")
@RequiredArgsConstructor
@Tag(name = "MembershipController", description = "Operations for MembershipController")
public class MembershipController {

    private final MembershipService membershipService;

    @Operation(summary = "Execute POST operation in MembershipController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MembershipResponse>> addMember(
            @PathVariable Long orgId,
            @Valid @RequestBody MembershipRequest request) {
        MembershipResponse member = membershipService.addMember(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Member added to organization", member));
    }

    @Operation(summary = "Execute GET operation in MembershipController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping
    public ResponseEntity<ApiResponse<List<MembershipResponse>>> getMembers(@PathVariable Long orgId) {
        List<MembershipResponse> members = membershipService.getMembers(orgId);
        return ResponseEntity.ok(ApiResponse.ok("Members retrieved", members));
    }

    @Operation(summary = "Execute PUT operation in MembershipController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MembershipResponse>> changeMemberRole(
            @PathVariable Long orgId,
            @PathVariable Long userId,
            @Valid @RequestBody ChangeRoleRequest request) {
        MembershipResponse member = membershipService.changeMemberRole(orgId, userId, request.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Member role updated", member));
    }

    @Operation(summary = "Execute DELETE operation in MembershipController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Long orgId,
            @PathVariable Long userId) {
        membershipService.removeMember(orgId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Member removed from organization"));
    }
}