package com.elearning.repository;

import com.elearning.model.QuizAttempt;
import com.elearning.model.Quiz;
import com.elearning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    Optional<QuizAttempt> findByStudentAndQuiz(User student, Quiz quiz);
    List<QuizAttempt> findByStudentAndQuizIn(User student, List<Quiz> quizzes);
}
