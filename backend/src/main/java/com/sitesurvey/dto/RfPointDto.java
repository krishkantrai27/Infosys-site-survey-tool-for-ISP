package com.sitesurvey.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RfPointDto {
    private Double lat;
    private Double lon;

    @JsonProperty("signal_dbm")
    private Double signalDbm;

    private String ssid;
    private String mac;
}
