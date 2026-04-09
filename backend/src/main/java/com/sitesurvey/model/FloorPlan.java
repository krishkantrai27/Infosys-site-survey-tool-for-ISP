package com.sitesurvey.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_type")
    private String ownerType;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "filename", nullable = false)
    private String fileName;

    @Column(name = "content_type")
    private String fileType;

    @Column(name = "storage_key", nullable = false)
    private String filePath;

    @Column(name = "size_bytes")
    private Long fileSize;

    @Column(name = "checksum_sha256")
    private String checksumSha256;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id")
    private Floor floor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}
