package com.sitesurvey.service;

import com.sitesurvey.exception.ResourceNotFoundException;
import com.sitesurvey.model.Floor;
import com.sitesurvey.model.FloorPlan;
import com.sitesurvey.model.User;
import com.sitesurvey.repository.FloorPlanRepository;
import com.sitesurvey.repository.FloorRepository;
import com.sitesurvey.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/png", "image/jpeg", "image/webp", "application/pdf");

    private final FloorPlanRepository floorPlanRepository;
    private final FloorRepository floorRepository;
    private final UserRepository userRepository;

    /**
     * Generic file upload with ownerType/ownerId polymorphic linking.
     */
    public FloorPlan uploadFile(MultipartFile file, String ownerType, Long ownerId, Long userId) throws IOException {
        // Validate MIME type
        String contentType = file.getContentType();
        
        boolean isRfScan = "rf_scan".equals(ownerType);
        if (!isRfScan && (contentType == null || !ALLOWED_TYPES.contains(contentType))) {
            throw new IllegalArgumentException("Invalid file type. Allowed: PNG, JPEG, WebP, PDF");
        }

        // Validate size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds maximum size of 20 MB");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        if (originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String storedFilename = UUID.randomUUID().toString() + extension;

        // Create directory: /uploads/{ownerType}/{ownerId}/
        Path uploadPath = Paths.get(uploadDir, ownerType, ownerId.toString());
        Files.createDirectories(uploadPath);

        Path filePath = uploadPath.resolve(storedFilename);

        // Compute SHA-256 while copying
        String checksum = copyWithChecksum(file, filePath);

        FloorPlan floorPlan = FloorPlan.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .fileName(originalFilename)
                .filePath(filePath.toString())
                .fileType(contentType)
                .fileSize(file.getSize())
                .checksumSha256(checksum)
                .uploadedBy(user)
                .build();

        return floorPlanRepository.save(floorPlan);
    }

    /**
     * Upload file directly from byte array.
     */
    public FloorPlan uploadFileFromBytes(byte[] fileData, String filename, String contentType, String ownerType, Long ownerId, Long userId) throws IOException {
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Allowed: PNG, JPEG, WebP, PDF");
        }
        if (fileData.length > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds maximum size of 20 MB");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String originalFilename = StringUtils.cleanPath(filename);
        String extension = "";
        if (originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String storedFilename = UUID.randomUUID().toString() + extension;

        Path uploadPath = Paths.get(uploadDir, ownerType, ownerId.toString());
        Files.createDirectories(uploadPath);

        Path filePath = uploadPath.resolve(storedFilename);

        String checksum;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fileData);
            checksum = HexFormat.of().formatHex(hash);
            Files.write(filePath, fileData);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }

        FloorPlan floorPlan = FloorPlan.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .fileName(originalFilename)
                .filePath(filePath.toString())
                .fileType(contentType)
                .fileSize((long) fileData.length)
                .checksumSha256(checksum)
                .uploadedBy(user)
                .build();

        return floorPlanRepository.save(floorPlan);
    }

    /**
     * Floor-plan specific upload (links the file to a floor).
     */
    public FloorPlan uploadFloorPlan(MultipartFile file, Long floorId, Long userId) throws IOException {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", floorId));

        FloorPlan saved = uploadFile(file, "floor", floorId, userId);
        saved.setFloor(floor);
        saved = floorPlanRepository.save(saved);

        // Link floor to this plan
        floor.setFloorPlan(saved);
        floorRepository.save(floor);

        return saved;
    }

    /**
     * Link an existing file to a floor as its plan file.
     */
    @Transactional
    public void linkPlanToFloor(Long floorId, Long fileId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", floorId));
        FloorPlan plan = floorPlanRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", fileId));
        plan.setFloor(floor);
        floorPlanRepository.save(plan);
        floor.setFloorPlan(plan);
        floorRepository.save(floor);
    }

    /**
     * Get the floor plan linked to a floor.
     */
    public FloorPlan getFloorPlan(Long floorId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", floorId));
        if (floor.getFloorPlan() == null) {
            throw new ResourceNotFoundException("No plan file linked to floor " + floorId);
        }
        return floor.getFloorPlan();
    }

    public FloorPlan getFloorPlanById(Long id) {
        return floorPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FloorPlan", "id", id));
    }

    public Resource loadFile(Long floorPlanId) throws MalformedURLException {
        FloorPlan floorPlan = floorPlanRepository.findById(floorPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("FloorPlan", "id", floorPlanId));

        Path filePath = Paths.get(floorPlan.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            throw new ResourceNotFoundException("File not found on disk");
        }
        return resource;
    }

    public List<FloorPlan> getFloorPlansByFloor(Long floorId) {
        return floorPlanRepository.findByFloorId(floorId);
    }

    public void deleteFloorPlan(Long id) throws IOException {
        FloorPlan floorPlan = floorPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FloorPlan", "id", id));

        // Clear FK reference on the floor before deleting the file record
        if (floorPlan.getFloor() != null) {
            Floor floor = floorPlan.getFloor();
            floor.setFloorPlan(null);
            floorRepository.save(floor);
        }

        Path filePath = Paths.get(floorPlan.getFilePath());
        Files.deleteIfExists(filePath);
        floorPlanRepository.delete(floorPlan);
    }

    /**
     * Copy file to disk while computing SHA-256 checksum.
     */
    private String copyWithChecksum(MultipartFile file, Path target) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = file.getInputStream();
                    DigestInputStream dis = new DigestInputStream(is, digest)) {
                Files.copy(dis, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is always available in Java
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
