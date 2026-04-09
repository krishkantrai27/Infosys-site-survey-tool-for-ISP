package com.sitesurvey.dto.importdata;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportPreviewResponse {
    private String sessionToken;
    private List<Map<String, Object>> valid;
    private List<ImportRowError> errors;
    private int totalRows;
    private int validCount;
    private int errorCount;
}
