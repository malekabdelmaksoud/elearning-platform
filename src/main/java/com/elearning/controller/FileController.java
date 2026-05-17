package com.elearning.controller;

import com.elearning.model.Course;
import com.elearning.model.FileResource;
import com.elearning.model.User;
import com.elearning.repository.CourseRepository;
import com.elearning.repository.FileResourceRepository;
import com.elearning.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired private FileResourceRepository fileResourceRepository;
    @Autowired private CourseRepository       courseRepository;
    @Autowired private UserService            userService;

    // -----------------------------------------------
    // POST /api/files/upload/{courseId}
    // Upload a file and store it in the database
    // -----------------------------------------------
    @PostMapping("/upload/{courseId}")
    public ResponseEntity<?> uploadFile(
            @PathVariable Long courseId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("Authorization") String token) {
        try {
            User uploader = getUserFromToken(token);
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

            // Generate a unique stored filename
            String ext        = getExtension(file.getOriginalFilename());
            String storedName = UUID.randomUUID().toString() + ext;

            // Read file bytes and store in database
            byte[] fileData = file.getBytes();

            // Save metadata + file content to database
            FileResource resource = new FileResource(
                file.getOriginalFilename(),
                storedName,
                file.getContentType(),
                file.getSize(),
                fileData,
                course,
                uploader
            );
            FileResource saved = fileResourceRepository.save(resource);

            return ResponseEntity.ok(mapFile(saved));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "File upload failed: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // GET /api/files/course/{courseId}
    // List all files attached to a course
    // -----------------------------------------------
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> listFiles(@PathVariable Long courseId) {
        try {
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

            List<Map<String, Object>> files = fileResourceRepository
                .findByCourseOrderByUploadedAtDesc(course)
                .stream()
                .map(this::mapFile)
                .collect(Collectors.toList());

            return ResponseEntity.ok(files);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // GET /api/files/{fileId}/download
    // Download a file from the database
    // -----------------------------------------------
    @GetMapping("/{fileId}/download")
    @Transactional(readOnly = true)
    public ResponseEntity<?> downloadFile(@PathVariable Long fileId) {
        try {
            FileResource fileResource = fileResourceRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

            byte[] fileData = fileResource.getFileData();
            if (fileData == null || fileData.length == 0) {
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType = fileResource.getContentType();
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + fileResource.getOriginalName() + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileData.length))
                .body(fileData);

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -----------------------------------------------
    // DELETE /api/files/{fileId}
    // Delete a file (only uploader or teacher of the course)
    // -----------------------------------------------
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable Long fileId,
            @RequestHeader("Authorization") String token) {
        try {
            User user = getUserFromToken(token);
            FileResource fileResource = fileResourceRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

            boolean isOwner   = fileResource.getUploadedBy().getId().equals(user.getId());
            boolean isTeacher = fileResource.getCourse().getTeacher().getId().equals(user.getId());
            if (!isOwner && !isTeacher) {
                return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));
            }

            // Delete from database
            fileResourceRepository.delete(fileResource);

            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // Helper: convert FileResource to response map
    // -----------------------------------------------
    private Map<String, Object> mapFile(FileResource f) {
        return Map.of(
            "id",           f.getId(),
            "originalName", f.getOriginalName(),
            "contentType",  f.getContentType() != null ? f.getContentType() : "unknown",
            "fileSize",     formatSize(f.getFileSize()),
            "uploadedBy",   f.getUploadedBy().getName(),
            "uploadedAt",   f.getUploadedAt().toString(),
            "downloadUrl",  "/api/files/" + f.getId() + "/download"
        );
    }

    // Get file extension from filename
    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }

    // Format file size to human-readable string
    private String formatSize(Long bytes) {
        if (bytes == null) return "unknown";
        if (bytes < 1024)       return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }

    private User getUserFromToken(String token) {
        Long userId = userService.getUserIdFromToken(token);
        return userService.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
