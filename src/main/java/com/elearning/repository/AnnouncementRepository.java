package com.elearning.repository;

import com.elearning.model.Announcement;
import com.elearning.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByCourseOrderByCreatedAtDesc(Course course);
    void deleteByCourse(Course course);
}
