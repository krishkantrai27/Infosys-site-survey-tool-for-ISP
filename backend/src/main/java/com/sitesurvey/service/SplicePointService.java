package com.sitesurvey.service;

import com.sitesurvey.dto.SplicePointDTO;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.CablePath;
import com.sitesurvey.model.SplicePoint;
import com.sitesurvey.repository.CablePathRepository;
import com.sitesurvey.repository.SplicePointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SplicePointService {

    private final SplicePointRepository splicePointRepository;
    private final CablePathRepository cablePathRepository;

    @Transactional
    public SplicePointDTO addSplicePoint(Long cablePathId, SplicePointDTO dto) {
        CablePath cablePath = cablePathRepository.findById(cablePathId)
                .orElseThrow(() -> new ResourceNotFoundException("Cable Path not found with id: " + cablePathId));

        SplicePoint splicePoint = SplicePoint.builder()
                .cablePath(cablePath)
                .geometryType(dto.getGeometryType())
                .geometryWkt(dto.getGeometryWkt())
                .enclosureId(dto.getEnclosureId())
                .notes(dto.getNotes())
                .build();

        SplicePoint saved = splicePointRepository.save(splicePoint);
        return toDTO(saved);
    }

    public List<SplicePointDTO> getSplicePointsByCablePath(Long cablePathId) {
        if (!cablePathRepository.existsById(cablePathId)) {
            throw new ResourceNotFoundException("Cable Path not found with id: " + cablePathId);
        }
        return splicePointRepository.findByCablePathId(cablePathId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private SplicePointDTO toDTO(SplicePoint splicePoint) {
        return SplicePointDTO.builder()
                .id(splicePoint.getId())
                .cablePathId(splicePoint.getCablePath().getId())
                .geometryType(splicePoint.getGeometryType())
                .geometryWkt(splicePoint.getGeometryWkt())
                .enclosureId(splicePoint.getEnclosureId())
                .notes(splicePoint.getNotes())
                .build();
    }
}
