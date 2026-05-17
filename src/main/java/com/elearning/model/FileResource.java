package com.elearning.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_resources")
@Data
@NoArgsConstructor
public class FileResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "stored_name", nullable = false)
    private String storedName;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    // Store the actual file content in the database (BLOB)
    // This ensures files persist across Render redeploys
    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    @Basic(fetch = FetchType.LAZY)
    private byte[] fileData;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public FileResource(String originalName, String storedName, String contentType,
                        Long fileSize, byte[] fileData, Course course, User uploadedBy) {
        this.originalName = originalName;
        this.storedName   = storedName;
        this.contentType  = contentType;
        this.fileSize     = fileSize;
        this.fileData     = fileData;
        this.course       = course;
        this.uploadedBy   = uploadedBy;
    }
}
