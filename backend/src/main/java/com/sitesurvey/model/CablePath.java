package com.sitesurvey.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cable_paths")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CablePath {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_space_id", nullable = false)
    private Space fromSpace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_space_id", nullable = false)
    private Space toSpace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CableMedium medium;

    @Column(name = "length_m", precision = 10, scale = 2)
    private BigDecimal lengthM;

    @Column(name = "slack_loops")
    private Integer slackLoops;

    @Enumerated(EnumType.STRING)
    @Column(name = "geometry_type")
    private GeometryType geometryType;

    @Column(name = "geometry_wkt", columnDefinition = "TEXT")
    private String geometryWkt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "cablePath", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SplicePoint> splicePoints = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
