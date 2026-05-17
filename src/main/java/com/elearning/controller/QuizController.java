package com.elearning.controller;

import com.elearning.dto.QuizDTO;
import com.elearning.model.*;
import com.elearning.repository.*;
import com.elearning.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired private QuizRepository quizRepository;
    @Autowired private QuizAttemptRepository quizAttemptRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private UserService userService;

    // -----------------------------------------------
    // POST /api/courses/{courseId}/lessons/{lessonId}/quizzes
    // Add a quiz question (teacher only)
    // -----------------------------------------------
    @PostMapping("/courses/{courseId}/lessons/{lessonId}/quizzes")
    public ResponseEntity<?> addQuiz(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestBody QuizDTO.CreateQuizRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

            if (!course.getTeacher().getId().equals(teacher.getId())) {
                throw new RuntimeException("Only the course teacher can add quizzes");
            }

            Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

            Quiz quiz = new Quiz(
                request.getQuestion(),
                request.getOptionA(),
                request.getOptionB(),
                request.getOptionC(),
                request.getOptionD(),
                request.getCorrectAnswer().toUpperCase(),
                lesson
            );

            Quiz saved = quizRepository.save(quiz);
            return ResponseEntity.ok(mapQuizForTeacher(saved));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // GET /api/courses/{courseId}/lessons/{lessonId}/quizzes
    // Get all quiz questions for a lesson
    // -----------------------------------------------
    @GetMapping("/courses/{courseId}/lessons/{lessonId}/quizzes")
    public ResponseEntity<?> getQuizzes(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

            List<Quiz> quizzes = quizRepository.findByLessonOrderByIdAsc(lesson);

            // Check if user is the teacher
            boolean isTeacher = false;
            User user = null;
            if (token != null) {
                try {
                    user = getUserFromToken(token);
                    Course course = courseRepository.findById(courseId).orElse(null);
                    if (course != null && course.getTeacher().getId().equals(user.getId())) {
                        isTeacher = true;
                    }
                } catch (Exception ignored) {}
            }

            if (isTeacher) {
                // Teacher sees correct answers
                List<QuizDTO.QuizResponse> responses = quizzes.stream()
                    .map(this::mapQuizForTeacher)
                    .collect(Collectors.toList());
                return ResponseEntity.ok(responses);
            } else {
                // Student doesn't see correct answers initially
                final User student = user;
                List<Map<String, Object>> responses = quizzes.stream().map(q -> {
                    QuizDTO.QuizResponse resp = mapQuizForStudent(q);
                    Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", resp.getId());
                    map.put("question", resp.getQuestion());
                    map.put("optionA", resp.getOptionA());
                    map.put("optionB", resp.getOptionB());
                    map.put("optionC", resp.getOptionC());
                    map.put("optionD", resp.getOptionD());
                    map.put("lessonId", resp.getLessonId());

                    // If student already attempted, include result
                    if (student != null) {
                        Optional<QuizAttempt> attempt = quizAttemptRepository.findByStudentAndQuiz(student, q);
                        if (attempt.isPresent()) {
                            map.put("attempted", true);
                            map.put("selectedAnswer", attempt.get().getSelectedAnswer());
                            map.put("isCorrect", attempt.get().getIsCorrect());
                            map.put("correctAnswer", q.getCorrectAnswer());
                        } else {
                            map.put("attempted", false);
                        }
                    }
                    return map;
                }).collect(Collectors.toList());
                return ResponseEntity.ok(responses);
            }

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // POST /api/quizzes/{quizId}/attempt — answer a quiz (student)
    // -----------------------------------------------
    @PostMapping("/quizzes/{quizId}/attempt")
    public ResponseEntity<?> attemptQuiz(
            @PathVariable Long quizId,
            @RequestBody QuizDTO.AttemptRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            User student = getUserFromToken(token);
            Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

            // Check if already attempted
            Optional<QuizAttempt> existing = quizAttemptRepository.findByStudentAndQuiz(student, quiz);
            if (existing.isPresent()) {
                throw new RuntimeException("You have already answered this question");
            }

            String selected = request.getSelectedAnswer().toUpperCase();
            boolean correct = selected.equals(quiz.getCorrectAnswer());

            QuizAttempt attempt = new QuizAttempt(student, quiz, selected, correct);
            quizAttemptRepository.save(attempt);

            QuizDTO.AttemptResponse response = new QuizDTO.AttemptResponse();
            response.setQuizId(quizId);
            response.setSelectedAnswer(selected);
            response.setIsCorrect(correct);
            response.setCorrectAnswer(quiz.getCorrectAnswer());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // DELETE /api/quizzes/{quizId} — delete a quiz (teacher)
    // -----------------------------------------------
    @DeleteMapping("/quizzes/{quizId}")
    @Transactional
    public ResponseEntity<?> deleteQuiz(
            @PathVariable Long quizId,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

            Course course = quiz.getLesson().getCourse();
            if (!course.getTeacher().getId().equals(teacher.getId())) {
                throw new RuntimeException("Only the course teacher can delete quizzes");
            }

            quizRepository.delete(quiz);
            return ResponseEntity.ok(Map.of("message", "Quiz deleted successfully"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // Mappers
    // -----------------------------------------------
    private QuizDTO.QuizResponse mapQuizForTeacher(Quiz q) {
        QuizDTO.QuizResponse resp = new QuizDTO.QuizResponse();
        resp.setId(q.getId());
        resp.setQuestion(q.getQuestion());
        resp.setOptionA(q.getOptionA());
        resp.setOptionB(q.getOptionB());
        resp.setOptionC(q.getOptionC());
        resp.setOptionD(q.getOptionD());
        resp.setCorrectAnswer(q.getCorrectAnswer());
        resp.setLessonId(q.getLesson().getId());
        return resp;
    }

    private QuizDTO.QuizResponse mapQuizForStudent(Quiz q) {
        QuizDTO.QuizResponse resp = new QuizDTO.QuizResponse();
        resp.setId(q.getId());
        resp.setQuestion(q.getQuestion());
        resp.setOptionA(q.getOptionA());
        resp.setOptionB(q.getOptionB());
        resp.setOptionC(q.getOptionC());
        resp.setOptionD(q.getOptionD());
        resp.setLessonId(q.getLesson().getId());
        // No correctAnswer for students
        return resp;
    }

    private User getUserFromToken(String token) {
        Long userId = userService.getUserIdFromToken(token);
        return userService.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
