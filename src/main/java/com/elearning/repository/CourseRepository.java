package com.elearning.repository;

import com.elearning.model.Course;
import com.elearning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // Get all courses created by a specific teacher
    List<Course> findByTeacher(User teacher);

    // Search courses by title keyword
    List<Course> findByTitleContainingIgnoreCase(String keyword);
}
