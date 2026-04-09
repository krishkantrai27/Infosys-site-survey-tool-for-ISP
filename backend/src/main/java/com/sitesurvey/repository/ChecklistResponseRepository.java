package com.sitesurvey.repository;

import com.sitesurvey.model.ChecklistResponse;
import com.sitesurvey.model.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistResponseRepository extends JpaRepository<ChecklistResponse, Long> {
    List<ChecklistResponse> findByTargetTypeAndTargetId(String targetType, Long targetId);

    List<ChecklistResponse> findBySubmittedBy(Long userId);

    List<ChecklistResponse> findAllByOrderByCreatedAtDesc();

    List<ChecklistResponse> findBySubmittedByOrderByCreatedAtDesc(Long userId);

    @Query("SELECT DISTINCT cr.targetId FROM ChecklistResponse cr WHERE cr.targetType = :targetType AND cr.status = :status")
    List<Long> findDistinctTargetIdsByTargetTypeAndStatus(@Param("targetType") String targetType, @Param("status") SubmissionStatus status);

    long countByTemplateIdAndStatus(Long templateId, SubmissionStatus status);

    long countByTemplateId(Long templateId);
}
