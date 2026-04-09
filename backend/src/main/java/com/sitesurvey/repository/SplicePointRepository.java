package com.sitesurvey.repository;

import com.sitesurvey.model.SplicePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SplicePointRepository extends JpaRepository<SplicePoint, Long> {
    List<SplicePoint> findByCablePathId(Long cablePathId);
}
