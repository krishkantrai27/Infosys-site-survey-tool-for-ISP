package com.sitesurvey.service;

import com.sitesurvey.dto.membership.MembershipRequest;
import com.sitesurvey.dto.membership.MembershipResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.ERole;
import com.sitesurvey.model.Membership;
import com.sitesurvey.model.Organization;
import com.sitesurvey.model.User;
import com.sitesurvey.repository.MembershipRepository;
import com.sitesurvey.repository.OrganizationRepository;
import com.sitesurvey.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Transactional
    public MembershipResponse addMember(Long orgId, MembershipRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        if (membershipRepository.existsByOrganizationIdAndUserId(orgId, request.getUserId())) {
            throw new IllegalArgumentException("User is already a member of this organization");
        }

        ERole eRole = ERole.valueOf("ROLE_" + request.getRole().toUpperCase());

        Membership membership = Membership.builder()
                .organization(org)
                .user(user)
                .role(eRole)
                .build();

        return toResponse(membershipRepository.save(membership));
    }

    public List<MembershipResponse> getMembers(Long orgId) {
        if (!organizationRepository.existsById(orgId)) {
            throw new ResourceNotFoundException("Organization", "id", orgId);
        }
        return membershipRepository.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MembershipResponse changeMemberRole(Long orgId, Long userId, String roleName) {
        Membership membership = membershipRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership", "orgId/userId", orgId + "/" + userId));

        ERole eRole = ERole.valueOf("ROLE_" + roleName.toUpperCase());
        membership.setRole(eRole);

        return toResponse(membershipRepository.save(membership));
    }

    @Transactional
    public void removeMember(Long orgId, Long userId) {
        Membership membership = membershipRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership", "orgId/userId", orgId + "/" + userId));
        membershipRepository.delete(membership);
    }

    public List<MembershipResponse> getUserMemberships(Long userId) {
        return membershipRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private MembershipResponse toResponse(Membership m) {
        return MembershipResponse.builder()
                .id(m.getId())
                .userId(m.getUser().getId())
                .username(m.getUser().getUsername())
                .email(m.getUser().getEmail())
                .fullName(m.getUser().getFullName())
                .role(m.getRole().name().replace("ROLE_", ""))
                .organizationId(m.getOrganization().getId())
                .organizationName(m.getOrganization().getName())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
