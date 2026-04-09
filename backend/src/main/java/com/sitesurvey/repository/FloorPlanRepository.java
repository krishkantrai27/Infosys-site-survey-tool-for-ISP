package com.sitesurvey.repository;

import com.sitesurvey.model.FloorPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloorPlanRepository extends JpaRepository<FloorPlan, Long> {
    List<FloorPlan> findByFloorId(Long floorId);
}
