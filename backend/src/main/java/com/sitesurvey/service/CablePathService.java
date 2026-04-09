package com.sitesurvey.service;

import com.sitesurvey.dto.CablePathDTO;
import com.sitesurvey.dto.SplicePointDTO;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.CablePath;
import com.sitesurvey.model.Property;
import com.sitesurvey.model.Space;
import com.sitesurvey.repository.CablePathRepository;
import com.sitesurvey.repository.PropertyRepository;
import com.sitesurvey.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CablePathService {

    private final CablePathRepository cablePathRepository;
    private final PropertyRepository propertyRepository;
    private final SpaceRepository spaceRepository;

    @Transactional
    public CablePathDTO createCablePath(CablePathDTO dto) {
        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property not found with id: " + dto.getPropertyId()));
        Space fromSpace = spaceRepository.findById(dto.getFromSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("From Space not found with id: " + dto.getFromSpaceId()));
        Space toSpace = spaceRepository.findById(dto.getToSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("To Space not found with id: " + dto.getToSpaceId()));

        CablePath cablePath = CablePath.builder()
                .property(property)
                .fromSpace(fromSpace)
                .toSpace(toSpace)
                .medium(dto.getMedium())
                .lengthM(dto.getLengthM())
                .slackLoops(dto.getSlackLoops())
                .geometryType(dto.getGeometryType())
                .geometryWkt(dto.getGeometryWkt())
                .notes(dto.getNotes())
                .build();

        CablePath saved = cablePathRepository.save(cablePath);
        return toDTO(saved);
    }

    public List<CablePathDTO> getAllCablePaths() {
        return cablePathRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<CablePathDTO> getCablePathsByProperty(Long propertyId) {
        return cablePathRepository.findByPropertyId(propertyId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CablePathDTO updateCablePath(Long id, CablePathDTO dto) {
        CablePath cablePath = cablePathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cable Path not found with id: " + id));

        // Note: Changing property/spaces requires fetching them again, 
        // assuming standard update for now just updates base fields if property/spaces don't change
        cablePath.setMedium(dto.getMedium());
        cablePath.setLengthM(dto.getLengthM());
        cablePath.setSlackLoops(dto.getSlackLoops());
        cablePath.setGeometryType(dto.getGeometryType());
        cablePath.setGeometryWkt(dto.getGeometryWkt());
        cablePath.setNotes(dto.getNotes());

        if (dto.getFromSpaceId() != null && !dto.getFromSpaceId().equals(cablePath.getFromSpace().getId())) {
            Space fromSpace = spaceRepository.findById(dto.getFromSpaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("From Space not found"));
            cablePath.setFromSpace(fromSpace);
        }
        if (dto.getToSpaceId() != null && !dto.getToSpaceId().equals(cablePath.getToSpace().getId())) {
            Space toSpace = spaceRepository.findById(dto.getToSpaceId())
                    .orElseThrow(() -> new ResourceNotFoundException("To Space not found"));
            cablePath.setToSpace(toSpace);
        }

        CablePath updated = cablePathRepository.save(cablePath);
        return toDTO(updated);
    }

    @Transactional
    public void deleteCablePath(Long id) {
        if (!cablePathRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cable Path not found with id: " + id);
        }
        cablePathRepository.deleteById(id);
    }

    private CablePathDTO toDTO(CablePath cablePath) {
        List<SplicePointDTO> splicePoints = null;
        if (cablePath.getSplicePoints() != null) {
            splicePoints = cablePath.getSplicePoints().stream()
                    .map(sp -> SplicePointDTO.builder()
                            .id(sp.getId())
                            .cablePathId(sp.getCablePath().getId())
                            .geometryType(sp.getGeometryType())
                            .geometryWkt(sp.getGeometryWkt())
                            .enclosureId(sp.getEnclosureId())
                            .notes(sp.getNotes())
                            .build())
                    .collect(Collectors.toList());
        }

        return CablePathDTO.builder()
                .id(cablePath.getId())
                .propertyId(cablePath.getProperty().getId())
                .fromSpaceId(cablePath.getFromSpace().getId())
                .toSpaceId(cablePath.getToSpace().getId())
                .medium(cablePath.getMedium())
                .lengthM(cablePath.getLengthM())
                .slackLoops(cablePath.getSlackLoops())
                .geometryType(cablePath.getGeometryType())
                .geometryWkt(cablePath.getGeometryWkt())
                .notes(cablePath.getNotes())
                .splicePoints(splicePoints)
                .build();
    }
}
