package com.sitesurvey.service;

import com.sitesurvey.dto.building.BuildingRequest;
import com.sitesurvey.dto.building.BuildingResponse;
import com.sitesurvey.dto.importdata.ImportPreviewResponse;
import com.sitesurvey.dto.importdata.ImportRowError;
import com.sitesurvey.dto.space.SpaceRequest;
import com.sitesurvey.dto.space.SpaceResponse;
import com.sitesurvey.model.SpaceType;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class BulkImportService {

    private final SpaceService spaceService;
    private final BuildingService buildingService;

    // In-memory session store for preview → confirm flow
    private static class ImportSession {
        String type; // "spaces" or "buildings"
        Long parentId; // floorId or propertyId
        List<Map<String, Object>> validRows;
        Instant createdAt;

        ImportSession(String type, Long parentId, List<Map<String, Object>> validRows) {
            this.type = type;
            this.parentId = parentId;
            this.validRows = validRows;
            this.createdAt = Instant.now();
        }
    }

    private final ConcurrentHashMap<String, ImportSession> sessions = new ConcurrentHashMap<>();
    private static final long SESSION_TTL_MINUTES = 30;

    // ───────── SPACES PREVIEW ─────────

    public ImportPreviewResponse previewSpaces(MultipartFile file, Long floorId) throws IOException, CsvException {
        List<String[]> allRows = readFileRows(file);
        if (allRows.isEmpty()) {
            return ImportPreviewResponse.builder().totalRows(0).validCount(0).errorCount(0).build();
        }

        String[] header = allRows.get(0);
        List<String[]> dataRows = allRows.subList(1, allRows.size());
        Map<String, Integer> colMap = getColumnMap(header);

        List<Map<String, Object>> validRows = new ArrayList<>();
        List<ImportRowError> errors = new ArrayList<>();

        for (int i = 0; i < dataRows.size(); i++) {
            String[] row = dataRows.get(i);
            int rowNum = i + 2;

            String name = getValue(row, colMap, "name", "spacename");
            String type = getValue(row, colMap, "type", "spacetype");
            String areaSqMStr = getValue(row, colMap, "areasqm", "area");
            String notes = getValue(row, colMap, "notes", "description");

            boolean hasError = false;

            if (name.isEmpty()) {
                errors.add(
                        ImportRowError.builder().rowNumber(rowNum).field("name").message("Name is required").build());
                hasError = true;
            }

            if (!type.isEmpty()) {
                try {
                    SpaceType.valueOf(type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    errors.add(ImportRowError.builder().rowNumber(rowNum).field("type")
                            .message("Invalid type '" + type + "'. Valid: " + Arrays.toString(SpaceType.values()))
                            .build());
                    hasError = true;
                }
            }

            if (!hasError) {
                Map<String, Object> validRow = new LinkedHashMap<>();
                validRow.put("rowNumber", rowNum);
                validRow.put("name", name);
                validRow.put("type", type.isEmpty() ? null : type.toUpperCase());
                validRow.put("notes", notes.isEmpty() ? null : notes);
                validRows.add(validRow);
            }
        }

        String sessionToken = UUID.randomUUID().toString();
        sessions.put(sessionToken, new ImportSession("spaces", floorId, validRows));

        return ImportPreviewResponse.builder()
                .sessionToken(sessionToken)
                .valid(validRows)
                .errors(errors)
                .totalRows(dataRows.size())
                .validCount(validRows.size())
                .errorCount((int) errors.stream().map(ImportRowError::getRowNumber).distinct().count())
                .build();
    }

    // ───────── BUILDINGS PREVIEW ─────────

    public ImportPreviewResponse previewBuildings(MultipartFile file, Long propertyId)
            throws IOException, CsvException {
        List<String[]> allRows = readFileRows(file);
        if (allRows.isEmpty()) {
            return ImportPreviewResponse.builder().totalRows(0).validCount(0).errorCount(0).build();
        }

        String[] header = allRows.get(0);
        List<String[]> dataRows = allRows.subList(1, allRows.size());
        Map<String, Integer> colMap = getColumnMap(header);

        List<Map<String, Object>> validRows = new ArrayList<>();
        List<ImportRowError> errors = new ArrayList<>();

        for (int i = 0; i < dataRows.size(); i++) {
            String[] row = dataRows.get(i);
            int rowNum = i + 2;

            String name = getValue(row, colMap, "name", "buildingname");
            String code = getValue(row, colMap, "code", "buildingcode");
            String floorsCountStr = getValue(row, colMap, "floorscount", "totalfloors");
            String footprintType = getValue(row, colMap, "footprinttype");
            String footprintWkt = getValue(row, colMap, "footprintwkt");

            boolean hasError = false;

            if (name.isEmpty()) {
                errors.add(
                        ImportRowError.builder().rowNumber(rowNum).field("name").message("Name is required").build());
                hasError = true;
            }

            Integer floorsCount = null;
            if (!floorsCountStr.isEmpty()) {
                try {
                    floorsCount = Integer.parseInt(floorsCountStr);
                    if (floorsCount < 0) {
                        errors.add(ImportRowError.builder().rowNumber(rowNum).field("floorsCount")
                                .message("Floors count must be positive").build());
                        hasError = true;
                    }
                } catch (NumberFormatException e) {
                    errors.add(ImportRowError.builder().rowNumber(rowNum).field("floorsCount")
                            .message("Invalid number: '" + floorsCountStr + "'").build());
                    hasError = true;
                }
            }

            if (!hasError) {
                Map<String, Object> validRow = new LinkedHashMap<>();
                validRow.put("rowNumber", rowNum);
                validRow.put("name", name);
                validRow.put("code", code.isEmpty() ? null : code);
                validRow.put("floorsCount", floorsCount);
                validRow.put("footprintType", footprintType.isEmpty() ? null : footprintType);
                validRow.put("footprintWkt", footprintWkt.isEmpty() ? null : footprintWkt);
                validRows.add(validRow);
            }
        }

        String sessionToken = UUID.randomUUID().toString();
        sessions.put(sessionToken, new ImportSession("buildings", propertyId, validRows));

        return ImportPreviewResponse.builder()
                .sessionToken(sessionToken)
                .valid(validRows)
                .errors(errors)
                .totalRows(dataRows.size())
                .validCount(validRows.size())
                .errorCount((int) errors.stream().map(ImportRowError::getRowNumber).distinct().count())
                .build();
    }

    // ───────── CONFIRM ─────────

    public List<SpaceResponse> confirmSpaces(String sessionToken) {
        ImportSession session = sessions.remove(sessionToken);
        if (session == null)
            throw new IllegalArgumentException("Invalid or expired session token");
        if (!"spaces".equals(session.type))
            throw new IllegalArgumentException("Session is not a spaces import");

        List<SpaceResponse> results = new ArrayList<>();
        for (Map<String, Object> row : session.validRows) {
            SpaceRequest request = new SpaceRequest();
            request.setName((String) row.get("name"));
            String typeStr = (String) row.get("type");
            request.setType(typeStr != null ? SpaceType.valueOf(typeStr.toUpperCase()) : null);
            request.setNotes((String) row.get("notes"));
            request.setFloorId(session.parentId);
            results.add(spaceService.create(request));
        }
        return results;
    }

    public List<BuildingResponse> confirmBuildings(String sessionToken) {
        ImportSession session = sessions.remove(sessionToken);
        if (session == null)
            throw new IllegalArgumentException("Invalid or expired session token");
        if (!"buildings".equals(session.type))
            throw new IllegalArgumentException("Session is not a buildings import");

        List<BuildingResponse> results = new ArrayList<>();
        for (Map<String, Object> row : session.validRows) {
            BuildingRequest request = new BuildingRequest();
            request.setName((String) row.get("name"));
            request.setCode((String) row.get("code"));
            request.setFloorsCount(row.get("floorsCount") != null ? (Integer) row.get("floorsCount") : null);
            request.setFootprintType((String) row.get("footprintType"));
            request.setFootprintWkt((String) row.get("footprintWkt"));
            request.setPropertyId(session.parentId);
            results.add(buildingService.create(request));
        }
        return results;
    }

    // ───────── CANCEL ─────────

    public void cancelImport(String sessionToken) {
        sessions.remove(sessionToken);
    }

    // ───────── LEGACY DIRECT IMPORT (kept for backward compat) ─────────

    public List<SpaceResponse> importSpacesFromCsv(MultipartFile file, Long floorId) throws IOException, CsvException {
        List<SpaceResponse> imported = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> rows = reader.readAll();
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);
                if (row.length >= 2) {
                    SpaceRequest request = new SpaceRequest();
                    request.setName(row[0].trim());
                    String typeStr = row.length > 1 ? row[1].trim() : null;
                    request.setType(typeStr != null ? SpaceType.valueOf(typeStr.toUpperCase()) : null);
                    request.setNotes(row.length > 3 ? row[3].trim() : null);
                    request.setFloorId(floorId);
                    imported.add(spaceService.create(request));
                }
            }
        }
        return imported;
    }

    public List<SpaceResponse> importSpacesFromXlsx(MultipartFile file, Long floorId) throws IOException {
        List<SpaceResponse> imported = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;
                SpaceRequest request = new SpaceRequest();
                request.setName(getCellValue(row.getCell(0)));
                String typeStr = getCellValue(row.getCell(1));
                request.setType(typeStr != null && !typeStr.isEmpty() ? SpaceType.valueOf(typeStr.toUpperCase()) : null);
                request.setNotes(getCellValue(row.getCell(3)));
                request.setFloorId(floorId);
                imported.add(spaceService.create(request));
            }
        }
        return imported;
    }

    // ───────── HELPERS ─────────

    private List<String[]> readFileRows(MultipartFile file) throws IOException, CsvException {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".xlsx")) {
            return readXlsxRows(file);
        } else {
            return readCsvAllRows(file);
        }
    }

    private List<String[]> readCsvAllRows(MultipartFile file) throws IOException, CsvException {
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            return reader.readAll();
        }
    }

    private Map<String, Integer> getColumnMap(String[] header) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            String h = header[i].toLowerCase().trim().replace(" ", "").replace("_", "");
            map.put(h, i);
        }
        return map;
    }

    private String getValue(String[] row, Map<String, Integer> colMap, String... keys) {
        for (String key : keys) {
            String normalizedKey = key.toLowerCase().replace("_", "").replace(" ", "");
            Integer index = colMap.get(normalizedKey);
            if (index != null && index < row.length) {
                return row[index].trim();
            }
        }
        return "";
    }

    private List<String[]> readCsvRows(MultipartFile file) throws IOException, CsvException {
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> allRows = reader.readAll();
            // Skip header row
            return allRows.size() > 1 ? allRows.subList(1, allRows.size()) : new ArrayList<>();
        }
    }

    private List<String[]> readXlsxRows(MultipartFile file) throws IOException {
        List<String[]> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getRow(0) == null)
                return rows;
            int colCount = sheet.getRow(0).getLastCellNum();
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    rows.add(new String[colCount]);
                    continue;
                }
                String[] values = new String[colCount];
                for (int j = 0; j < colCount; j++) {
                    values[j] = getCellValue(row.getCell(j));
                    if (values[j] == null)
                        values[j] = "";
                }
                rows.add(values);
            }
        }
        return rows;
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    // Clean up expired sessions every 10 minutes
    @Scheduled(fixedRate = 600_000)
    public void cleanupExpiredSessions() {
        Instant cutoff = Instant.now().minusSeconds(SESSION_TTL_MINUTES * 60);
        sessions.entrySet().removeIf(entry -> entry.getValue().createdAt.isBefore(cutoff));
    }
}
