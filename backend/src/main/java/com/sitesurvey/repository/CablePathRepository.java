package com.sitesurvey.repository;

import com.sitesurvey.model.CablePath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CablePathRepository extends JpaRepository<CablePath, Long> {
    List<CablePath> findByPropertyId(Long propertyId);
    List<CablePath> findByFromSpaceIdOrToSpaceId(Long fromSpaceId, Long toSpaceId);
    long countByPropertyId(Long propertyId);
}
