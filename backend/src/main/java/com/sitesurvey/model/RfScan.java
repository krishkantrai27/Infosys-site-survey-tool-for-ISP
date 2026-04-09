package com.sitesurvey.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "rf_scans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RfScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RfTool tool;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raw_file_id")
    private FloorPlan rawFile;

    @Column(name = "parsed_json", columnDefinition = "json")
    private String parsedJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "heatmap_file_id")
    private FloorPlan heatmapFile;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
