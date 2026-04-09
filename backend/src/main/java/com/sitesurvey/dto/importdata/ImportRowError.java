package com.sitesurvey.dto.importdata;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportRowError {
    private int rowNumber;
    private String field;
    private String message;
}
