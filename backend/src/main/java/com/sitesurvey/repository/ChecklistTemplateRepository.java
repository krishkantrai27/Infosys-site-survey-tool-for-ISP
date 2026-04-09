package com.sitesurvey.repository;

import com.sitesurvey.model.ChecklistTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChecklistTemplateRepository extends JpaRepository<ChecklistTemplate, Long> {
    List<ChecklistTemplate> findByOrganizationIdAndIsActiveTrue(Long organizationId);

    Optional<ChecklistTemplate> findByOrganizationIdAndNameAndIsActiveTrue(Long organizationId, String name);
}
