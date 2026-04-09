package com.sitesurvey.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "splice_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SplicePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cable_path_id", nullable = false)
    private CablePath cablePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "geometry_type")
    private GeometryType geometryType;

    @Column(name = "geometry_wkt", columnDefinition = "TEXT")
    private String geometryWkt;

    @Column(name = "enclosure_id")
    private String enclosureId;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
