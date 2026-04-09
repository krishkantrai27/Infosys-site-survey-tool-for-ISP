package com.sitesurvey.repository;

import com.sitesurvey.model.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {
    List<Membership> findByUserId(Long userId);

    List<Membership> findByOrganizationId(Long organizationId);

    Optional<Membership> findByOrganizationIdAndUserId(Long organizationId, Long userId);

    boolean existsByOrganizationIdAndUserId(Long organizationId, Long userId);

    void deleteByOrganizationIdAndUserId(Long organizationId, Long userId);
}
