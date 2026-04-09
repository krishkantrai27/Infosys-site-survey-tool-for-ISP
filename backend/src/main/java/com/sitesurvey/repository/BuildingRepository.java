package com.sitesurvey.repository;

import com.sitesurvey.model.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {
    List<Building> findByPropertyId(Long propertyId);
    long countByPropertyId(Long propertyId);
}
