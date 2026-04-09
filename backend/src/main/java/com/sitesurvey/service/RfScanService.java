package com.sitesurvey.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sitesurvey.dto.RfPointDto;
import com.sitesurvey.dto.RfScanResponse;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Floor;
import com.sitesurvey.model.FloorPlan;
import com.sitesurvey.model.Property;
import com.sitesurvey.model.RfScan;
import com.sitesurvey.model.RfTool;
import com.sitesurvey.repository.FloorRepository;
import com.sitesurvey.repository.PropertyRepository;
import com.sitesurvey.repository.RfScanRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Point2D;
import java.awt.image.BufferedImage;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RfScanService {

    private final RfScanRepository rfScanRepository;
    private final PropertyRepository propertyRepository;
    private final FloorRepository floorRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    @Transactional
    public RfScan uploadRfScan(MultipartFile file, Long propertyId, Long floorId, RfTool tool, Long userId) throws IOException {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property", "id", propertyId));
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", floorId));

        FloorPlan rawFile = fileStorageService.uploadFile(file, "rf_scan", floorId, userId);

        RfScan rfScan = RfScan.builder()
                .property(property)
                .floor(floor)
                .tool(tool)
                .rawFile(rawFile)
                .build();

        return rfScanRepository.save(rfScan);
    }

    @Transactional
    public void processRfScan(Long rfScanId) throws IOException {
        RfScan rfScan = rfScanRepository.findById(rfScanId)
                .orElseThrow(() -> new ResourceNotFoundException("RfScan", "id", rfScanId));

        if (rfScan.getRawFile() == null) {
            throw new IllegalStateException("RF Scan has no linked raw file to process");
        }

        Resource resource = fileStorageService.loadFile(rfScan.getRawFile().getId());
        byte[] bytes = resource.getInputStream().readAllBytes();
        
        List<RfPointDto> points;
        switch (rfScan.getTool()) {
            case VISTUMBLER:
                points = parseVistumbler(bytes);
                break;
            case KISMET:
                points = parseKismet(bytes);
                break;
            case SPLAT:
                points = parseSplat(bytes);
                break;
            default:
                throw new IllegalStateException("Unsupported tool: " + rfScan.getTool());
        }

        if (points.isEmpty()) {
            throw new IllegalArgumentException("No valid RF points parsed from file");
        }

        String json = objectMapper.writeValueAsString(points);
        rfScan.setParsedJson(json);
        rfScanRepository.save(rfScan);
    }

    private List<RfPointDto> parseVistumbler(byte[] bytes) throws IOException {
        List<RfPointDto> points = new ArrayList<>();
        try (Reader reader = new InputStreamReader(new ByteArrayInputStream(bytes))) {
            CSVFormat format = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build();
            CSVParser parser = format.parse(reader);
            for (CSVRecord record : parser) {
                try {
                    String latStr = record.get("Latitude");
                    String lonStr = record.get("Longitude");
                    String signalStr = record.get("Signal");
                    String ssid = record.isMapped("SSID") ? record.get("SSID") : "";
                    String bssid = record.isMapped("BSSID") ? record.get("BSSID") : "";

                    if (latStr == null || lonStr == null || signalStr == null || latStr.isEmpty() || lonStr.isEmpty() || signalStr.isEmpty()) {
                        continue;
                    }

                    points.add(RfPointDto.builder()
                            .lat(Double.parseDouble(latStr))
                            .lon(Double.parseDouble(lonStr))
                            .signalDbm(Double.parseDouble(signalStr))
                            .ssid(ssid)
                            .mac(bssid)
                            .build());
                } catch (Exception e) {
                    // Ignore malformed rows
                }
            }
        }
        return points;
    }

    private List<RfPointDto> parseKismet(byte[] bytes) throws IOException {
        List<RfPointDto> points = new ArrayList<>();
        try (Reader reader = new InputStreamReader(new ByteArrayInputStream(bytes))) {
            CSVFormat format = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build();
            CSVParser parser = format.parse(reader);
            for (CSVRecord record : parser) {
                try {
                    String mac = record.isMapped("kismet.device.base.macaddr") ? record.get("kismet.device.base.macaddr") : "";
                    String signalStr = record.isMapped("kismet.device.base.signal.last_signal") ? record.get("kismet.device.base.signal.last_signal") : "";
                    String ssid = record.isMapped("kismet.device.base.commonname") ? record.get("kismet.device.base.commonname") : "";
                    String latStr = record.isMapped("lat") ? record.get("lat") : null;
                    String lonStr = record.isMapped("lon") ? record.get("lon") : null;

                    if (latStr == null || lonStr == null || signalStr == null || signalStr.isEmpty() || latStr.isEmpty() || lonStr.isEmpty()) continue;

                    points.add(RfPointDto.builder()
                            .lat(Double.parseDouble(latStr))
                            .lon(Double.parseDouble(lonStr))
                            .signalDbm(Double.parseDouble(signalStr))
                            .ssid(ssid)
                            .mac(mac)
                            .build());
                } catch (Exception e) {
                    // Ignore row
                }
            }
        }
        return points;
    }

    private List<RfPointDto> parseSplat(byte[] bytes) {
        List<RfPointDto> points = new ArrayList<>();
        String content = new String(bytes);
        String[] lines = content.split("\\r?\\n");
        for (String line : lines) {
            String[] parts = line.trim().split("\\s+");
            if (parts.length >= 3) {
                try {
                    double lat = Double.parseDouble(parts[0]);
                    double lon = Double.parseDouble(parts[1]);
                    double signal = Double.parseDouble(parts[2]);
                    points.add(RfPointDto.builder()
                            .lat(lat)
                            .lon(lon)
                            .signalDbm(signal)
                            .ssid("SPLAT")
                            .mac("")
                            .build());
                } catch (NumberFormatException e) {
                    // Ignore invalid rows
                }
            }
        }
        return points;
    }

    @Transactional
    public void generateHeatmap(Long rfScanId, Long userId) throws IOException {
        RfScan rfScan = rfScanRepository.findById(rfScanId)
                .orElseThrow(() -> new ResourceNotFoundException("RfScan", "id", rfScanId));

        if (rfScan.getParsedJson() == null || rfScan.getParsedJson().isEmpty()) {
            throw new IllegalStateException("Scan must be processed before generating heatmap");
        }

        List<RfPointDto> points = objectMapper.readValue(rfScan.getParsedJson(), new TypeReference<>() {});
        if (points.isEmpty()) throw new IllegalArgumentException("No points to generate heatmap");

        double minLat = points.stream().mapToDouble(RfPointDto::getLat).min().orElse(0);
        double maxLat = points.stream().mapToDouble(RfPointDto::getLat).max().orElse(0);
        double minLon = points.stream().mapToDouble(RfPointDto::getLon).min().orElse(0);
        double maxLon = points.stream().mapToDouble(RfPointDto::getLon).max().orElse(0);

        // Normalize bounds to add slight padding
        double latPad = (maxLat - minLat) * 0.05;
        double lonPad = (maxLon - minLon) * 0.05;
        minLat -= latPad; maxLat += latPad;
        minLon -= lonPad; maxLon += lonPad;
        
        if (maxLat == minLat) { minLat -= 0.001; maxLat += 0.001; }
        if (maxLon == minLon) { minLon -= 0.001; maxLon += 0.001; }

        int width = 800;
        int height = 600;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        
        double maxDist = Math.max(maxLat - minLat, maxLon - minLon) * 0.15;
        double bgWeight = 1.0 / (maxDist * maxDist);
        
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                double lon = minLon + ((maxLon - minLon) * ((double) x / width));
                double lat = maxLat - ((maxLat - minLat) * ((double) y / height));
                
                double num = bgWeight * -100.0;
                double den = bgWeight;
                boolean exactMatch = false;
                double exactSignal = 0;

                for (RfPointDto point : points) {
                    double dx = point.getLon() - lon;
                    double dy = point.getLat() - lat;
                    
                    // Slightly scale dy to maintain circular blobs despite lat/lon aspect ratio
                    double dSq = dx * dx + (dy * dy * 1.5);
                    
                    if (dSq < 1e-11) {
                        exactMatch = true;
                        exactSignal = point.getSignalDbm();
                        break;
                    }
                    
                    double weight = 1.0 / dSq;
                    num += weight * point.getSignalDbm();
                    den += weight;
                }
                
                double interpolatedSignal = exactMatch ? exactSignal : (den == 0 ? -100 : (num / den));
                Color pixelColor = getSignalColor(interpolatedSignal);
                
                image.setRGB(x, y, pixelColor.getRGB());
            }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        byte[] imageBytes = baos.toByteArray();

        FloorPlan heatmapFile = fileStorageService.uploadFileFromBytes(
                imageBytes, 
                "heatmap_" + rfScanId + ".png", 
                "image/png", 
                "rf_heatmap", 
                rfScan.getFloor().getId(), 
                userId
        );

        rfScan.setHeatmapFile(heatmapFile);
        rfScanRepository.save(rfScan);
    }

    private Color getSignalColor(double dbm) {
        if (dbm >= -30) return new Color(255, 0, 0, 160); // Red
        if (dbm <= -90) return new Color(0, 0, 255, 0);   // Transparent

        Color c1, c2;
        double minDbm, maxDbm;

        if (dbm >= -45) {
            c1 = new Color(255, 165, 0, 160); // Orange
            c2 = new Color(255, 0, 0, 160); // Red
            minDbm = -45; maxDbm = -30;
        } else if (dbm >= -60) {
            c1 = new Color(255, 255, 0, 160); // Yellow
            c2 = new Color(255, 165, 0, 160); // Orange
            minDbm = -60; maxDbm = -45;
        } else if (dbm >= -70) {
            c1 = new Color(0, 255, 0, 160); // Green
            c2 = new Color(255, 255, 0, 160); // Yellow
            minDbm = -70; maxDbm = -60;
        } else if (dbm >= -80) {
            c1 = new Color(0, 255, 255, 160); // Cyan
            c2 = new Color(0, 255, 0, 160); // Green
            minDbm = -80; maxDbm = -70;
        } else {
            c1 = new Color(0, 0, 255, 40); // Faint Blue
            c2 = new Color(0, 255, 255, 160); // Cyan
            minDbm = -90; maxDbm = -80;
        }

        float ratio = (float) ((dbm - minDbm) / (maxDbm - minDbm));
        int r = (int) (c1.getRed() + ratio * (c2.getRed() - c1.getRed()));
        int g = (int) (c1.getGreen() + ratio * (c2.getGreen() - c1.getGreen()));
        int b = (int) (c1.getBlue() + ratio * (c2.getBlue() - c1.getBlue()));
        int a = (int) (c1.getAlpha() + ratio * (c2.getAlpha() - c1.getAlpha()));

        return new Color(r, g, b, a);
    }

    public List<RfScanResponse> getScansByPropertyAndFloor(Long propertyId, Long floorId) {
        List<RfScan> scans;
        if (floorId != null) {
            scans = rfScanRepository.findByPropertyIdAndFloorId(propertyId, floorId);
        } else {
            scans = rfScanRepository.findByPropertyId(propertyId);
        }
        return scans.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public RfScanResponse getScanById(Long id) {
        RfScan scan = rfScanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RfScan", "id", id));
        return mapToResponse(scan);
    }

    private RfScanResponse mapToResponse(RfScan scan) {
        List<RfPointDto> points = null;
        if (scan.getParsedJson() != null && !scan.getParsedJson().isEmpty()) {
            try {
                points = objectMapper.readValue(scan.getParsedJson(), new TypeReference<>() {});
            } catch (JsonProcessingException e) {
                // Return null points if unparseable
            }
        }
        
        return RfScanResponse.builder()
                .id(scan.getId())
                .propertyId(scan.getProperty().getId())
                .floorId(scan.getFloor().getId())
                .tool(scan.getTool())
                .rawFileId(scan.getRawFile() != null ? scan.getRawFile().getId() : null)
                .parsedJson(points)
                .heatmapFileId(scan.getHeatmapFile() != null ? scan.getHeatmapFile().getId() : null)
                .notes(scan.getNotes())
                .createdAt(scan.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteScan(Long id) {
        RfScan rfScan = rfScanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RfScan", "id", id));
        rfScanRepository.delete(rfScan);
    }
}
