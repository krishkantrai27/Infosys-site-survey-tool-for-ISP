package com.sitesurvey.repository;

import com.sitesurvey.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);
    List<Report> findByRequestedByOrderByCreatedAtDesc(Long requestedBy);
    List<Report> findAllByOrderByCreatedAtDesc();
}
