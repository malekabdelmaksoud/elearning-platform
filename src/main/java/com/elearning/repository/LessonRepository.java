package com.elearning.repository;

import com.elearning.model.Lesson;
import com.elearning.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByCourseOrderByOrderNumAsc(Course course);

    void deleteByCourse(Course course);
}
