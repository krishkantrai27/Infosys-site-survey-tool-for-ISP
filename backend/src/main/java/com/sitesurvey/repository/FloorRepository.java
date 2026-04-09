package com.sitesurvey.repository;

import com.sitesurvey.model.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Long> {
    List<Floor> findByBuildingId(Long buildingId);

    @Query("SELECT f FROM Floor f LEFT JOIN FETCH f.floorPlan LEFT JOIN FETCH f.building WHERE f.id = :id")
    Optional<Floor> findByIdWithFloorPlan(@Param("id") Long id);

    @Query("SELECT f FROM Floor f LEFT JOIN FETCH f.floorPlan LEFT JOIN FETCH f.building WHERE f.building.id = :buildingId")
    List<Floor> findByBuildingIdWithFloorPlan(@Param("buildingId") Long buildingId);

    @Query("SELECT COUNT(f) FROM Floor f WHERE f.building.property.id = :propertyId")
    long countByPropertyId(@Param("propertyId") Long propertyId);

    @Query("SELECT f FROM Floor f LEFT JOIN FETCH f.floorPlan WHERE f.building.property.id = :propertyId")
    List<Floor> findByPropertyIdWithFloorPlan(@Param("propertyId") Long propertyId);
}
