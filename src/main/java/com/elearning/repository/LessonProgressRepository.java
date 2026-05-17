package com.elearning.repository;

import com.elearning.model.LessonProgress;
import com.elearning.model.Lesson;
import com.elearning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByStudentAndLesson(User student, Lesson lesson);
    List<LessonProgress> findByStudentAndLessonIn(User student, List<Lesson> lessons);
    long countByStudentAndLessonInAndCompletedTrue(User student, List<Lesson> lessons);
}
