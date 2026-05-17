package com.elearning.repository;

import com.elearning.model.Course;
import com.elearning.model.FileResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FileResourceRepository extends JpaRepository<FileResource, Long> {

    List<FileResource> findByCourseOrderByUploadedAtDesc(Course course);

    void deleteByCourse(Course course);
}
