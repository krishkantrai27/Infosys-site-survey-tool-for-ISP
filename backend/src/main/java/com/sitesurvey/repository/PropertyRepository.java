package com.sitesurvey.repository;

import com.sitesurvey.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    List<Property> findByOrganizationId(Long organizationId);

    List<Property> findByCreatedById(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Property p WHERE p.organization.id = :orgId AND (p.assignedEngineer IS NULL OR p.assignedEngineer.id = :engineerId)")
    List<Property> findForEngineer(@org.springframework.data.repository.query.Param("orgId") Long orgId, @org.springframework.data.repository.query.Param("engineerId") Long engineerId);
}
