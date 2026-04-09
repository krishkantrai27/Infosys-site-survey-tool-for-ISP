package com.sitesurvey.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.sitesurvey.dto.report.ReportGenerateRequest;
import com.sitesurvey.dto.report.ReportResponse;
import com.sitesurvey.model.*;
import com.sitesurvey.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final SpaceRepository spaceRepository;
    private final EquipmentRepository equipmentRepository;
    private final CablePathRepository cablePathRepository;
    private final RfScanRepository rfScanRepository;
    private final ChecklistResponseRepository checklistResponseRepository;
    private final ChecklistTemplateRepository checklistTemplateRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    // ── Colors ──
    private static final Color PRIMARY = new Color(79, 70, 229);
    private static final Color HEADER_BG = new Color(238, 242, 255);
    private static final Color ACCENT = new Color(16, 185, 129);
    private static final Color TEXT_MUTED = new Color(100, 116, 139);
    private static final Color TABLE_HEADER_BG = new Color(241, 245, 249);

    // ── Fonts ──
    private static final Font COVER_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, PRIMARY);
    private static final Font COVER_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 14, TEXT_MUTED);
    private static final Font SECTION_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, PRIMARY);
    private static final Font SUBSECTION_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Font.NORMAL);
    private static final Font TABLE_HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE);
    private static final Font TABLE_CELL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 11);
    private static final Font BODY_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
    private static final Font SMALL_MUTED = FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_MUTED);

    /**
     * Create a report record and queue async generation.
     */
    public Report requestReport(ReportGenerateRequest request, Long userId) {
        propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found: " + request.getPropertyId()));

        String paramsJson;
        try {
            paramsJson = objectMapper.writeValueAsString(request);
        } catch (Exception e) {
            paramsJson = "{}";
        }

        Report report = Report.builder()
                .propertyId(request.getPropertyId())
                .requestedBy(userId)
                .parameters(paramsJson)
                .status(ReportStatus.PENDING)
                .build();
        report = reportRepository.save(report);

        // Fire-and-forget async generation
        generateReportAsync(report.getId(), request, userId);
        return report;
    }

    @Async("reportExecutor")
    public void generateReportAsync(Long reportId, ReportGenerateRequest request, Long userId) {
        Report report = reportRepository.findById(reportId).orElse(null);
        if (report == null) return;

        report.setStatus(ReportStatus.GENERATING);
        reportRepository.save(report);

        try {
            byte[] pdfBytes = generatePdf(request, userId);

            // Save PDF via FileStorageService
            FloorPlan savedFile = fileStorageService.uploadFileFromBytes(
                    pdfBytes,
                    "SiteSurveyReport_Property_" + request.getPropertyId() + ".pdf",
                    "application/pdf",
                    "report",
                    reportId,
                    userId
            );

            report.setPdfFileId(savedFile.getId());
            report.setStatus(ReportStatus.DONE);
            reportRepository.save(report);
            log.info("Report {} generated successfully, file ID: {}", reportId, savedFile.getId());

        } catch (Exception e) {
            log.error("Report {} generation failed", reportId, e);
            report.setStatus(ReportStatus.FAILED);
            report.setErrorMessage(e.getMessage());
            reportRepository.save(report);
        }
    }

    /**
     * Generate the full property-scoped PDF.
     */
    private byte[] generatePdf(ReportGenerateRequest request, Long userId) throws DocumentException, IOException {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));
        String requesterName = userRepository.findById(userId)
                .map(User::getUsername).orElse("Unknown");
        String orgName = property.getOrganization() != null ? property.getOrganization().getName() : "N/A";

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter.getInstance(doc, out);
        doc.open();

        // ── 1. Cover Page ──
        addCoverPage(doc, property, orgName, requesterName);

        // ── 2. Site Overview ──
        doc.newPage();
        addSiteOverview(doc, property, orgName);

        // ── 3. Floor Plans ──
        if (request.isIncludeFloorPlans()) {
            addFloorPlans(doc, property.getId());
        }

        // ── 4. Space Inventory ──
        addSpaceInventory(doc, property.getId());

        // ── 5. Equipment List ──
        if (request.isIncludeEquipment()) {
            addEquipmentList(doc, property.getId());
        }

        // ── 6. Cable Paths ──
        addCablePaths(doc, property.getId());

        // ── 7. Checklist Summary ──
        if (request.isIncludeChecklists()) {
            addChecklistSummary(doc, property.getId());
        }

        // ── 8. RF Coverage ──
        if (request.isIncludeRf()) {
            addRfCoverage(doc, property.getId());
        }

        doc.close();
        return out.toByteArray();
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PDF SECTION BUILDERS
    // ═══════════════════════════════════════════════════════════════════

    private void addCoverPage(Document doc, Property property, String orgName, String requesterName)
            throws DocumentException {
        doc.add(spacer(120));

        Paragraph title = new Paragraph("Site Survey Report", COVER_TITLE);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);

        doc.add(spacer(10));

        Paragraph propName = new Paragraph(property.getName(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20));
        propName.setAlignment(Element.ALIGN_CENTER);
        doc.add(propName);

        doc.add(spacer(30));

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(60);
        infoTable.setHorizontalAlignment(Element.ALIGN_CENTER);
        infoTable.setWidths(new float[]{1f, 2f});

        addInfoRow(infoTable, "Organization", orgName);
        addInfoRow(infoTable, "Property Type", property.getType() != null ? property.getType().name() : "N/A");
        addInfoRow(infoTable, "Generated On", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        addInfoRow(infoTable, "Requested By", requesterName);

        doc.add(infoTable);

        doc.add(spacer(40));

        Paragraph confidential = new Paragraph("CONFIDENTIAL — For internal use only", SMALL_MUTED);
        confidential.setAlignment(Element.ALIGN_CENTER);
        doc.add(confidential);
    }

    private void addSiteOverview(Document doc, Property property, String orgName) throws DocumentException {
        doc.add(sectionTitle("1. Site Overview"));
        doc.add(spacer(10));

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 2.5f});

        addInfoRow(table, "Property Name", property.getName());
        addInfoRow(table, "Organization", orgName);
        addInfoRow(table, "Type", property.getType() != null ? property.getType().name() : "N/A");
        addInfoRow(table, "Address", property.getAddress() != null ? property.getAddress() : "Not specified");
        addInfoRow(table, "City", property.getCity() != null ? property.getCity() : "—");
        addInfoRow(table, "State", property.getState() != null ? property.getState() : "—");
        addInfoRow(table, "Postal Code", property.getPostalCode() != null ? property.getPostalCode() : "—");
        addInfoRow(table, "Country", property.getCountry() != null ? property.getCountry() : "—");

        doc.add(table);

        // Building list
        List<Building> buildings = buildingRepository.findByPropertyId(property.getId());
        doc.add(spacer(15));
        doc.add(new Paragraph("Buildings (" + buildings.size() + ")", SUBSECTION_TITLE));
        doc.add(spacer(5));

        if (buildings.isEmpty()) {
            doc.add(new Paragraph("No buildings registered.", BODY_FONT));
        } else {
            PdfPTable bldTable = createStyledTable(new String[]{"#", "Name", "Code", "Floors"}, new float[]{0.5f, 2f, 1f, 1f});
            int idx = 1;
            for (Building b : buildings) {
                bldTable.addCell(styledCell(String.valueOf(idx++)));
                bldTable.addCell(styledCell(b.getName()));
                bldTable.addCell(styledCell(b.getCode() != null ? b.getCode() : "—"));
                bldTable.addCell(styledCell(b.getFloorsCount() != null ? b.getFloorsCount().toString() : "—"));
            }
            doc.add(bldTable);
        }
    }

    private void addFloorPlans(Document doc, Long propertyId) throws DocumentException, IOException {
        List<Floor> floors = floorRepository.findByPropertyIdWithFloorPlan(propertyId);
        List<Floor> floorsWithPlans = floors.stream()
                .filter(f -> f.getFloorPlan() != null)
                .collect(Collectors.toList());

        if (floorsWithPlans.isEmpty()) return;

        doc.newPage();
        doc.add(sectionTitle("2. Floor Plans"));
        doc.add(spacer(10));

        for (Floor floor : floorsWithPlans) {
            FloorPlan plan = floor.getFloorPlan();
            doc.add(new Paragraph(floor.getName() + (floor.getBuilding() != null ?
                    " — " + floor.getBuilding().getName() : ""), SUBSECTION_TITLE));
            doc.add(spacer(5));

            try {
                Path imagePath = Paths.get(plan.getFilePath());
                if (Files.exists(imagePath)) {
                    byte[] imageBytes = Files.readAllBytes(imagePath);
                    Image img = Image.getInstance(imageBytes);
                    img.scaleToFit(doc.getPageSize().getWidth() - 80, 400);
                    img.setAlignment(Element.ALIGN_CENTER);
                    doc.add(img);
                } else {
                    doc.add(new Paragraph("Floor plan image not found on disk.", SMALL_MUTED));
                }
            } catch (Exception e) {
                doc.add(new Paragraph("Unable to load floor plan image: " + e.getMessage(), SMALL_MUTED));
            }
            doc.add(spacer(15));
        }
    }

    private void addSpaceInventory(Document doc, Long propertyId) throws DocumentException {
        List<Building> buildings = buildingRepository.findByPropertyId(propertyId);
        doc.newPage();
        doc.add(sectionTitle("3. Space Inventory"));
        doc.add(spacer(10));

        for (Building building : buildings) {
            List<Floor> floors = floorRepository.findByBuildingId(building.getId());
            for (Floor floor : floors) {
                List<Space> spaces = spaceRepository.findByFloorId(floor.getId());
                if (spaces.isEmpty()) continue;

                doc.add(new Paragraph(building.getName() + " — " + floor.getName(), SUBSECTION_TITLE));
                doc.add(spacer(5));

                PdfPTable table = createStyledTable(
                        new String[]{"#", "Space Name", "Type", "Area (m²)"},
                        new float[]{0.5f, 2f, 1.5f, 1f}
                );

                int idx = 1;
                for (Space space : spaces) {
                    table.addCell(styledCell(String.valueOf(idx++)));
                    table.addCell(styledCell(space.getName()));
                    table.addCell(styledCell(space.getType() != null ? space.getType().name() : "N/A"));
                    table.addCell(styledCell(space.getAreaSqM() != null ? space.getAreaSqM().toPlainString() : "—"));
                }
                doc.add(table);
                doc.add(spacer(10));
            }
        }
    }

    private void addEquipmentList(Document doc, Long propertyId) throws DocumentException {
        List<Equipment> equipment = equipmentRepository.findByPropertyId(propertyId);
        doc.newPage();
        doc.add(sectionTitle("4. Equipment List"));
        doc.add(spacer(10));

        if (equipment.isEmpty()) {
            doc.add(new Paragraph("No equipment registered for this property.", BODY_FONT));
            return;
        }

        // Group by space
        Map<Long, List<Equipment>> bySpace = equipment.stream()
                .collect(Collectors.groupingBy(e -> e.getSpace().getId()));

        for (var entry : bySpace.entrySet()) {
            Space space = entry.getValue().get(0).getSpace();
            doc.add(new Paragraph("Space: " + space.getName(), SUBSECTION_TITLE));
            doc.add(spacer(5));

            PdfPTable table = createStyledTable(
                    new String[]{"Type", "Model", "Vendor", "Serial #", "Power (W)"},
                    new float[]{1.2f, 1.5f, 1.2f, 1.5f, 0.8f}
            );

            for (Equipment eq : entry.getValue()) {
                table.addCell(styledCell(eq.getType() != null ? eq.getType().name() : "N/A"));
                table.addCell(styledCell(eq.getModel() != null ? eq.getModel() : "—"));
                table.addCell(styledCell(eq.getVendor() != null ? eq.getVendor() : "—"));
                table.addCell(styledCell(eq.getSerialNumber() != null ? eq.getSerialNumber() : "—"));
                table.addCell(styledCell(eq.getPowerWatts() != null ? eq.getPowerWatts().toPlainString() : "—"));
            }
            doc.add(table);
            doc.add(spacer(10));
        }
    }

    private void addCablePaths(Document doc, Long propertyId) throws DocumentException {
        List<CablePath> cables = cablePathRepository.findByPropertyId(propertyId);
        doc.newPage();
        doc.add(sectionTitle("5. Cable Paths"));
        doc.add(spacer(10));

        if (cables.isEmpty()) {
            doc.add(new Paragraph("No cable paths registered for this property.", BODY_FONT));
            return;
        }

        PdfPTable table = createStyledTable(
                new String[]{"#", "From", "To", "Medium", "Length (m)", "Slack Loops"},
                new float[]{0.4f, 1.5f, 1.5f, 1f, 0.8f, 0.8f}
        );

        int idx = 1;
        for (CablePath cable : cables) {
            table.addCell(styledCell(String.valueOf(idx++)));
            table.addCell(styledCell(cable.getFromSpace() != null ? cable.getFromSpace().getName() : "—"));
            table.addCell(styledCell(cable.getToSpace() != null ? cable.getToSpace().getName() : "—"));
            table.addCell(styledCell(cable.getMedium() != null ? cable.getMedium().name() : "—"));
            table.addCell(styledCell(cable.getLengthM() != null ? cable.getLengthM().toPlainString() : "—"));
            table.addCell(styledCell(cable.getSlackLoops() != null ? cable.getSlackLoops().toString() : "—"));
        }
        doc.add(table);
    }

    private void addChecklistSummary(Document doc, Long propertyId) throws DocumentException {
        List<Space> spaces = spaceRepository.findByPropertyId(propertyId);
        doc.newPage();
        doc.add(sectionTitle("6. Checklist Summary"));
        doc.add(spacer(10));

        boolean hasAny = false;
        for (Space space : spaces) {
            List<ChecklistResponse> responses = checklistResponseRepository
                    .findByTargetTypeAndTargetId("space", space.getId());
            if (responses.isEmpty()) continue;
            hasAny = true;

            long submitted = responses.stream().filter(r -> r.getStatus() == SubmissionStatus.SUBMITTED).count();
            long total = responses.size();
            double pct = total > 0 ? (submitted * 100.0 / total) : 0;

            doc.add(new Paragraph("Space: " + space.getName() +
                    " — " + submitted + "/" + total + " submitted (" + Math.round(pct) + "%)", SUBSECTION_TITLE));
            doc.add(spacer(5));

            PdfPTable table = createStyledTable(
                    new String[]{"Template", "Status", "Submitted By", "Date"},
                    new float[]{2f, 1f, 1.5f, 1.5f}
            );

            for (ChecklistResponse cr : responses) {
                String templateName = checklistTemplateRepository.findById(cr.getTemplateId())
                        .map(ChecklistTemplate::getName).orElse("Unknown");
                String submitter = userRepository.findById(cr.getSubmittedBy())
                        .map(User::getUsername).orElse("Unknown");
                String date = cr.getSubmittedAt() != null
                        ? cr.getSubmittedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        : "Draft";

                table.addCell(styledCell(templateName));
                table.addCell(styledCell(cr.getStatus().name()));
                table.addCell(styledCell(submitter));
                table.addCell(styledCell(date));
            }
            doc.add(table);
            doc.add(spacer(10));
        }

        if (!hasAny) {
            doc.add(new Paragraph("No checklist responses found for any spaces in this property.", BODY_FONT));
        }
    }

    private void addRfCoverage(Document doc, Long propertyId) throws DocumentException, IOException {
        List<RfScan> scans = rfScanRepository.findByPropertyId(propertyId);
        doc.newPage();
        doc.add(sectionTitle("7. RF Coverage"));
        doc.add(spacer(10));

        if (scans.isEmpty()) {
            doc.add(new Paragraph("No RF scans recorded for this property.", BODY_FONT));
            return;
        }

        // Summary table
        PdfPTable summaryTable = createStyledTable(
                new String[]{"#", "Floor", "Tool", "Date", "Has Heatmap"},
                new float[]{0.4f, 1.5f, 1f, 1.5f, 1f}
        );

        int idx = 1;
        for (RfScan scan : scans) {
            summaryTable.addCell(styledCell(String.valueOf(idx++)));
            summaryTable.addCell(styledCell(scan.getFloor() != null ? scan.getFloor().getName() : "—"));
            summaryTable.addCell(styledCell(scan.getTool() != null ? scan.getTool().name() : "—"));
            summaryTable.addCell(styledCell(scan.getCreatedAt() != null
                    ? scan.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                    : "—"));
            summaryTable.addCell(styledCell(scan.getHeatmapFile() != null ? "Yes" : "No"));
        }
        doc.add(summaryTable);
        doc.add(spacer(15));

        // Embed heatmap images
        for (RfScan scan : scans) {
            if (scan.getHeatmapFile() != null) {
                doc.add(new Paragraph("Heatmap — " +
                        (scan.getFloor() != null ? scan.getFloor().getName() : "Unknown Floor"), SUBSECTION_TITLE));
                doc.add(spacer(5));

                try {
                    Path imagePath = Paths.get(scan.getHeatmapFile().getFilePath());
                    if (Files.exists(imagePath)) {
                        byte[] imageBytes = Files.readAllBytes(imagePath);
                        Image img = Image.getInstance(imageBytes);
                        img.scaleToFit(doc.getPageSize().getWidth() - 80, 350);
                        img.setAlignment(Element.ALIGN_CENTER);
                        doc.add(img);
                    } else {
                        doc.add(new Paragraph("Heatmap image not found.", SMALL_MUTED));
                    }
                } catch (Exception e) {
                    doc.add(new Paragraph("Unable to load heatmap: " + e.getMessage(), SMALL_MUTED));
                }
                doc.add(spacer(15));
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  REPORT CRUD
    // ═══════════════════════════════════════════════════════════════════

    public List<ReportResponse> listReports(Long propertyId) {
        List<Report> reports;
        if (propertyId != null) {
            reports = reportRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId);
        } else {
            reports = reportRepository.findAllByOrderByCreatedAtDesc();
        }
        return reports.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ReportResponse getReport(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found: " + id));
        return toResponse(report);
    }

    public void deleteReport(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found: " + id));

        // Delete associated PDF file
        if (report.getPdfFileId() != null) {
            try {
                fileStorageService.deleteFloorPlan(report.getPdfFileId());
            } catch (Exception e) {
                log.warn("Failed to delete PDF file for report {}: {}", id, e.getMessage());
            }
        }
        reportRepository.delete(report);
    }

    private ReportResponse toResponse(Report report) {
        String propertyName = propertyRepository.findById(report.getPropertyId())
                .map(Property::getName).orElse("Unknown");
        String requesterName = userRepository.findById(report.getRequestedBy())
                .map(User::getUsername).orElse("Unknown");

        return ReportResponse.builder()
                .id(report.getId())
                .propertyId(report.getPropertyId())
                .propertyName(propertyName)
                .requestedByUsername(requesterName)
                .status(report.getStatus())
                .pdfFileId(report.getPdfFileId())
                .parameters(report.getParameters())
                .errorMessage(report.getErrorMessage())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PDF TABLE HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private PdfPTable createStyledTable(String[] headers, float[] widths) throws DocumentException {
        PdfPTable table = new PdfPTable(headers.length);
        table.setWidthPercentage(100);
        table.setWidths(widths);
        table.setSpacingBefore(5);

        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, TABLE_HEADER_FONT));
            cell.setBackgroundColor(PRIMARY);
            cell.setPadding(8);
            cell.setBorderWidth(0);
            table.addCell(cell);
        }
        return table;
    }

    private PdfPCell styledCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_CELL_FONT));
        cell.setPadding(7);
        cell.setBorderWidth(0);
        cell.setBorderWidthBottom(0.5f);
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }

    private void addInfoRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, BODY_BOLD));
        labelCell.setPadding(8);
        labelCell.setBorderWidth(0);
        labelCell.setBackgroundColor(HEADER_BG);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, BODY_FONT));
        valueCell.setPadding(8);
        valueCell.setBorderWidth(0);
        table.addCell(valueCell);
    }

    private Paragraph sectionTitle(String text) {
        Paragraph p = new Paragraph(text, SECTION_TITLE);
        p.setSpacingBefore(10);
        p.setSpacingAfter(5);
        return p;
    }

    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingBefore(height);
        return p;
    }
}
