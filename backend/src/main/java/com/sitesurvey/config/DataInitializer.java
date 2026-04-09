package com.sitesurvey.config;

import com.sitesurvey.model.ERole;
import com.sitesurvey.model.Membership;
import com.sitesurvey.model.Organization;
import com.sitesurvey.model.Role;
import com.sitesurvey.model.User;
import com.sitesurvey.repository.MembershipRepository;
import com.sitesurvey.repository.OrganizationRepository;
import com.sitesurvey.repository.RoleRepository;
import com.sitesurvey.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

        private final RoleRepository roleRepository;
        private final OrganizationRepository organizationRepository;
        private final UserRepository userRepository;
        private final MembershipRepository membershipRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) {
                // Seed roles
                for (ERole eRole : ERole.values()) {
                        if (roleRepository.findByName(eRole).isEmpty()) {
                                roleRepository.save(new Role(null, eRole));
                                log.info("Seeded role: {}", eRole);
                        }
                }

                // Seed default organization
                if (organizationRepository.count() == 0) {
                        Organization org = Organization.builder()
                                        .name("Default ISP Organization")
                                        .address("123 Network Street")
                                        .contactEmail("admin@defaultisp.com")
                                        .contactPhone("+1-555-0100")
                                        .build();
                        organizationRepository.save(org);
                        log.info("Seeded default organization");
                }

                Organization org = organizationRepository.findAll().get(0);

                // Seed admin user
                if (!userRepository.existsByUsername("admin")) {
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                        .orElseThrow(() -> new RuntimeException("Admin role not found"));

                        User admin = User.builder()
                                        .username("admin")
                                        .email("admin@sitesurvey.com")
                                        .password(passwordEncoder.encode("admin123"))
                                        .fullName("System Administrator")
                                        .firstName("System")
                                        .lastName("Administrator")
                                        .isActive(true)
                                        .organization(org)
                                        .roles(Set.of(adminRole))
                                        .build();
                        userRepository.save(admin);
                        log.info("Seeded admin user (username: admin, password: admin123)");
                }

                // Seed engineer user
                if (!userRepository.existsByUsername("engineer")) {
                        Role engineerRole = roleRepository.findByName(ERole.ROLE_ENGINEER)
                                        .orElseThrow(() -> new RuntimeException("Engineer role not found"));

                        User engineer = User.builder()
                                        .username("engineer")
                                        .email("engineer@sitesurvey.com")
                                        .password(passwordEncoder.encode("engineer123"))
                                        .fullName("Test Engineer")
                                        .firstName("Test")
                                        .lastName("Engineer")
                                        .isActive(true)
                                        .organization(org)
                                        .roles(Set.of(engineerRole))
                                        .build();
                        userRepository.save(engineer);
                        log.info("Seeded engineer user (username: engineer, password: engineer123)");
                }

                // Seed customer user
                if (!userRepository.existsByUsername("customer")) {
                        Role customerRole = roleRepository.findByName(ERole.ROLE_CUSTOMER)
                                        .orElseThrow(() -> new RuntimeException("Customer role not found"));

                        User customer = User.builder()
                                        .username("customer")
                                        .email("customer@sitesurvey.com")
                                        .password(passwordEncoder.encode("customer123"))
                                        .fullName("Test Customer")
                                        .firstName("Test")
                                        .lastName("Customer")
                                        .isActive(true)
                                        .organization(org)
                                        .roles(Set.of(customerRole))
                                        .build();
                        userRepository.save(customer);
                        log.info("Seeded customer user (username: customer, password: customer123)");
                }

                // Seed memberships
                User adminUser = userRepository.findByUsername("admin").orElse(null);
                User engineerUser = userRepository.findByUsername("engineer").orElse(null);
                User customerUser = userRepository.findByUsername("customer").orElse(null);

                if (adminUser != null
                                && !membershipRepository.existsByOrganizationIdAndUserId(org.getId(),
                                                adminUser.getId())) {
                        membershipRepository.save(Membership.builder()
                                        .organization(org).user(adminUser).role(ERole.ROLE_ADMIN).build());
                        log.info("Seeded admin membership");
                }
                if (engineerUser != null
                                && !membershipRepository.existsByOrganizationIdAndUserId(org.getId(),
                                                engineerUser.getId())) {
                        membershipRepository.save(Membership.builder()
                                        .organization(org).user(engineerUser).role(ERole.ROLE_ENGINEER).build());
                        log.info("Seeded engineer membership");
                }
                if (customerUser != null
                                && !membershipRepository.existsByOrganizationIdAndUserId(org.getId(),
                                                customerUser.getId())) {
                        membershipRepository.save(Membership.builder()
                                        .organization(org).user(customerUser).role(ERole.ROLE_CUSTOMER).build());
                        log.info("Seeded customer membership");
                }

                // Fix: Ensure all existing seeded users are active
                userRepository.findByUsername("admin").ifPresent(u -> {
                        if (!Boolean.TRUE.equals(u.getIsActive())) {
                                u.setIsActive(true);
                                userRepository.save(u);
                                log.info("Fixed admin user: set isActive=true");
                        }
                });
                userRepository.findByUsername("engineer").ifPresent(u -> {
                        if (!Boolean.TRUE.equals(u.getIsActive())) {
                                u.setIsActive(true);
                                userRepository.save(u);
                                log.info("Fixed engineer user: set isActive=true");
                        }
                });
                userRepository.findByUsername("customer").ifPresent(u -> {
                        if (!Boolean.TRUE.equals(u.getIsActive())) {
                                u.setIsActive(true);
                                userRepository.save(u);
                                log.info("Fixed customer user: set isActive=true");
                        }
                });
        }
}
