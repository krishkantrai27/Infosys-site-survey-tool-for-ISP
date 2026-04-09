package com.sitesurvey.dto.checklist;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PhotoAttachRequest {
    @NotEmpty
    private List<Long> fileIds;
}
