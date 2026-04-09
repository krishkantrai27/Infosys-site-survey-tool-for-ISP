package com.sitesurvey.service;

import com.sitesurvey.dto.EquipmentDTO;
import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Equipment;
import com.sitesurvey.model.Space;
import com.sitesurvey.repository.EquipmentRepository;
import com.sitesurvey.repository.SpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final SpaceRepository spaceRepository;

    @Transactional
    public EquipmentDTO addEquipment(Long spaceId, EquipmentDTO dto) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Space not found with id: " + spaceId));

        Equipment equipment = Equipment.builder()
                .space(space)
                .type(dto.getType())
                .model(dto.getModel())
                .vendor(dto.getVendor())
                .powerWatts(dto.getPowerWatts())
                .heatLoadBtuh(dto.getHeatLoadBtuh())
                .mounting(dto.getMounting())
                .geometryType(dto.getGeometryType())
                .geometryWkt(dto.getGeometryWkt())
                .serialNumber(dto.getSerialNumber())
                .build();

        Equipment saved = equipmentRepository.save(equipment);
        return toDTO(saved);
    }

    public List<EquipmentDTO> getAllEquipment() {
        return equipmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<EquipmentDTO> getEquipmentInSpace(Long spaceId) {
        return equipmentRepository.findBySpaceId(spaceId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EquipmentDTO getEquipmentById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        return toDTO(equipment);
    }

    @Transactional
    public EquipmentDTO updateEquipment(Long id, EquipmentDTO dto) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));

        equipment.setType(dto.getType());
        equipment.setModel(dto.getModel());
        equipment.setVendor(dto.getVendor());
        equipment.setPowerWatts(dto.getPowerWatts());
        equipment.setHeatLoadBtuh(dto.getHeatLoadBtuh());
        equipment.setMounting(dto.getMounting());
        equipment.setGeometryType(dto.getGeometryType());
        equipment.setGeometryWkt(dto.getGeometryWkt());
        equipment.setSerialNumber(dto.getSerialNumber());

        Equipment updated = equipmentRepository.save(equipment);
        return toDTO(updated);
    }

    @Transactional
    public void deleteEquipment(Long id) {
        if (!equipmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Equipment not found with id: " + id);
        }
        equipmentRepository.deleteById(id);
    }

    private EquipmentDTO toDTO(Equipment equipment) {
        return EquipmentDTO.builder()
                .id(equipment.getId())
                .spaceId(equipment.getSpace().getId())
                .type(equipment.getType())
                .model(equipment.getModel())
                .vendor(equipment.getVendor())
                .powerWatts(equipment.getPowerWatts())
                .heatLoadBtuh(equipment.getHeatLoadBtuh())
                .mounting(equipment.getMounting())
                .geometryType(equipment.getGeometryType())
                .geometryWkt(equipment.getGeometryWkt())
                .serialNumber(equipment.getSerialNumber())
                .build();
    }
}
