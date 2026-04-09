package com.sitesurvey.repository;

import com.sitesurvey.model.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findBySpaceId(Long spaceId);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.space.floor.building.property.id = :propertyId")
    long countByPropertyId(@Param("propertyId") Long propertyId);

    @Query("SELECT e FROM Equipment e WHERE e.space.floor.building.property.id = :propertyId")
    List<Equipment> findByPropertyId(@Param("propertyId") Long propertyId);

    @Query("SELECT COUNT(e) FROM Equipment e WHERE e.space.floor.building.id = :buildingId")
    long countByBuildingId(@Param("buildingId") Long buildingId);
}
