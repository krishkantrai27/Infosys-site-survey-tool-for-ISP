CREATE TABLE rf_scans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id BIGINT NOT NULL,
    floor_id BIGINT NOT NULL,
    tool ENUM('VISTUMBLER','KISMET','SPLAT') NOT NULL,
    raw_file_id BIGINT,
    parsed_json JSON,
    heatmap_file_id BIGINT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (floor_id) REFERENCES floors(id),
    FOREIGN KEY (raw_file_id) REFERENCES files(id),
    FOREIGN KEY (heatmap_file_id) REFERENCES files(id)
);
