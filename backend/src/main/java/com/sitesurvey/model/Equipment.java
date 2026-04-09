package com.sitesurvey.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentType type;

    private String model;

    private String vendor;

    @Column(name = "power_watts", precision = 10, scale = 2)
    private BigDecimal powerWatts;

    @Column(name = "heat_load_btuh")
    private Integer heatLoadBtuh;

    private String mounting;

    @Enumerated(EnumType.STRING)
    @Column(name = "geometry_type")
    private GeometryType geometryType;

    @Column(name = "geometry_wkt", columnDefinition = "TEXT")
    private String geometryWkt;

    @Column(name = "serial_number")
    private String serialNumber;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
