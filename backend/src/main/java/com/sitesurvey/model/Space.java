package com.sitesurvey.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "spaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private SpaceType type;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "geometry_wkt", columnDefinition = "TEXT")
    private String geometryWkt;

    @Enumerated(EnumType.STRING)
    @Column(name = "geometry_type")
    private GeometryType geometryType;

    @Column(name = "area_sq_m", precision = 12, scale = 2)
    private BigDecimal areaSqM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
