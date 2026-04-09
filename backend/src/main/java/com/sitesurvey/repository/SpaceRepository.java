package com.sitesurvey.repository;

import com.sitesurvey.model.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpaceRepository extends JpaRepository<Space, Long> {
    List<Space> findByFloorId(Long floorId);

    @Query("SELECT COUNT(s) FROM Space s WHERE s.floor.building.property.id = :propertyId")
    long countByPropertyId(@Param("propertyId") Long propertyId);

    @Query("SELECT s FROM Space s WHERE s.floor.building.property.id = :propertyId")
    List<Space> findByPropertyId(@Param("propertyId") Long propertyId);
}
