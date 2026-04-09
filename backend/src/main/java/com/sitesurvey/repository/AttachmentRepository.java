package com.sitesurvey.repository;

import com.sitesurvey.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByOwnerTypeAndOwnerId(String ownerType, Long ownerId);

    List<Attachment> findByFileId(Long fileId);
}
