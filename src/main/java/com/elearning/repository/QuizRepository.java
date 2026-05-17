package com.elearning.repository;

import com.elearning.model.Quiz;
import com.elearning.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByLesson(Lesson lesson);
    List<Quiz> findByLessonOrderByIdAsc(Lesson lesson);
    void deleteByLesson(Lesson lesson);
}
