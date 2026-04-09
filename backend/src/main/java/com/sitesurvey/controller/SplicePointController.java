package com.sitesurvey.controller;

import com.sitesurvey.dto.SplicePointDTO;
import com.sitesurvey.service.SplicePointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;


import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "SplicePointController", description = "Operations for SplicePointController")
public class SplicePointController {

    private final SplicePointService splicePointService;

    @Operation(summary = "Execute POST operation in SplicePointController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/cable-paths/{id}/splice-points")
    @PreAuthorize("hasAnyRole('ADMIN', 'ENGINEER')")
    public ResponseEntity<SplicePointDTO> addSplicePoint(@PathVariable Long id, @RequestBody SplicePointDTO dto) {
        return new ResponseEntity<>(splicePointService.addSplicePoint(id, dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Execute GET operation in SplicePointController")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/cable-paths/{id}/splice-points")
    public ResponseEntity<List<SplicePointDTO>> getSplicePointsByCablePath(@PathVariable Long id) {
        return ResponseEntity.ok(splicePointService.getSplicePointsByCablePath(id));
    }
}