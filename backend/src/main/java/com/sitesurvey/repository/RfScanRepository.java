package com.sitesurvey.repository;

import com.sitesurvey.model.RfScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RfScanRepository extends JpaRepository<RfScan, Long> {
    List<RfScan> findByPropertyId(Long propertyId);
    List<RfScan> findByPropertyIdAndFloorId(Long propertyId, Long floorId);

    @Query("SELECT COUNT(r) FROM RfScan r WHERE r.property.id = :propertyId")
    long countByPropertyId(@Param("propertyId") Long propertyId);

    @Query("SELECT DISTINCT r.floor.id FROM RfScan r WHERE r.property.id = :propertyId")
    List<Long> findDistinctFloorIdsByPropertyId(@Param("propertyId") Long propertyId);
}
