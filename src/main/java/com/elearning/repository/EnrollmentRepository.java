package com.elearning.repository;

import com.elearning.model.Enrollment;
import com.elearning.model.User;
import com.elearning.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    // Get all courses a student is enrolled in
    List<Enrollment> findByStudent(User student);

    // Check if a student is already enrolled in a course
    Optional<Enrollment> findByStudentAndCourse(User student, Course course);

    // Count how many students enrolled in a course
    long countByCourse(Course course);

    // Delete all enrollments for a course (used when deleting the course)
    void deleteByCourse(Course course);
}
