package com.elearning.dto;

import lombok.Data;
import java.util.List;

public class QuizDTO {

    @Data
    public static class CreateQuizRequest {
        private String question;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctAnswer; // "A", "B", "C", or "D"
    }

    @Data
    public static class AttemptRequest {
        private String selectedAnswer; // "A", "B", "C", or "D"
    }

    @Data
    public static class QuizResponse {
        private Long id;
        private String question;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctAnswer; // only shown to teacher or after attempt
        private Long lessonId;
    }

    @Data
    public static class AttemptResponse {
        private Long quizId;
        private String selectedAnswer;
        private Boolean isCorrect;
        private String correctAnswer;
    }

    @Data
    public static class QuizResultSummary {
        private int totalQuestions;
        private int answeredQuestions;
        private int correctAnswers;
        private double scorePercentage;
        private List<AttemptDetail> details;
    }

    @Data
    public static class AttemptDetail {
        private Long quizId;
        private String question;
        private String selectedAnswer;
        private String correctAnswer;
        private Boolean isCorrect;
    }

    @Data
    public static class AnnouncementRequest {
        private String title;
        private String content;
    }

    @Data
    public static class AnnouncementResponse {
        private Long id;
        private String title;
        private String content;
        private String teacherName;
        private String createdAt;
    }
}
