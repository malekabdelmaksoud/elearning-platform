package com.elearning.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "quiz_id"}))
@Data
@NoArgsConstructor
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "selected_answer", nullable = false, length = 1)
    private String selectedAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "attempted_at")
    private LocalDateTime attemptedAt = LocalDateTime.now();

    public QuizAttempt(User student, Quiz quiz, String selectedAnswer, Boolean isCorrect) {
        this.student = student;
        this.quiz = quiz;
        this.selectedAnswer = selectedAnswer;
        this.isCorrect = isCorrect;
    }
}
