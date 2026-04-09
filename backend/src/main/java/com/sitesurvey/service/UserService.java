package com.sitesurvey.service;

import com.sitesurvey.dto.user.CreateUserRequest;
import com.sitesurvey.dto.user.UserResponse;
import com.sitesurvey.dto.user.UserUpdateRequest;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.ERole;
import com.sitesurvey.model.Organization;
import com.sitesurvey.model.Role;
import com.sitesurvey.model.User;
import com.sitesurvey.repository.OrganizationRepository;
import com.sitesurvey.repository.RoleRepository;
import com.sitesurvey.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return toResponse(user);
    }

    public UserResponse updateProfile(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (request.getFullName() != null)
            user.setFullName(request.getFullName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getEmail() != null)
            user.setEmail(request.getEmail());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse assignOrganization(Long userId, Long organizationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));
        user.setOrganization(org);
        return toResponse(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<UserResponse> getAllUsersPaginated(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::toResponse);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .build();

        // Set role
        Set<Role> roles = new HashSet<>();
        if (request.getRole() != null && !request.getRole().isBlank()) {
            ERole eRole = ERole.valueOf("ROLE_" + request.getRole().toUpperCase());
            Role role = roleRepository.findByName(eRole)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));
            roles.add(role);
        } else {
            Role customerRole = roleRepository.findByName(ERole.ROLE_CUSTOMER)
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            roles.add(customerRole);
        }
        user.setRoles(roles);

        // Set organization
        if (request.getOrganizationId() != null) {
            Organization org = organizationRepository.findById(request.getOrganizationId())
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
            user.setOrganization(org);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse changeUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Set<Role> roles = new HashSet<>();
        ERole eRole = ERole.valueOf("ROLE_" + roleName.toUpperCase());
        Role role = roleRepository.findByName(eRole)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        roles.add(role);
        user.setRoles(roles);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Set<Role> roles = new HashSet<>();
        roleNames.forEach(roleName -> {
            ERole eRole = ERole.valueOf("ROLE_" + roleName.toUpperCase());
            Role role = roleRepository.findByName(eRole)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            roles.add(role);
        });
        user.setRoles(roles);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse toggleUserActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setIsActive(!user.getIsActive());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        userRepository.delete(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .organizationName(user.getOrganization() != null ? user.getOrganization().getName() : null)
                .roles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
