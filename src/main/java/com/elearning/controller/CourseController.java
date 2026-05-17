package com.elearning.controller;

import com.elearning.dto.CourseDTO;
import com.elearning.dto.QuizDTO;
import com.elearning.model.*;
import com.elearning.repository.AnnouncementRepository;
import com.elearning.repository.LessonProgressRepository;
import com.elearning.service.CourseService;
import com.elearning.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    @Autowired private CourseService courseService;
    @Autowired private UserService   userService;
    @Autowired private AnnouncementRepository announcementRepository;
    @Autowired private LessonProgressRepository lessonProgressRepository;

    // -----------------------------------------------
    // GET /api/courses — list all courses
    // -----------------------------------------------
    @GetMapping
    public ResponseEntity<List<CourseDTO.CourseResponse>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    // -----------------------------------------------
    // GET /api/courses/{id} — get course with lessons
    // -----------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<?> getCourse(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(courseService.getCourseById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -----------------------------------------------
    // POST /api/courses — create course (teacher)
    // -----------------------------------------------
    @PostMapping
    public ResponseEntity<?> createCourse(
            @RequestBody CourseDTO.CreateCourseRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            return ResponseEntity.ok(courseService.createCourse(request, teacher));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // PUT /api/courses/{id} — update course (teacher)
    // -----------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Long id,
            @RequestBody CourseDTO.CreateCourseRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            return ResponseEntity.ok(courseService.updateCourse(id, request, teacher));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // DELETE /api/courses/{id} — delete course (teacher)
    // -----------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            courseService.deleteCourse(id, teacher);
            return ResponseEntity.ok(Map.of("message", "Course deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // POST /api/courses/{id}/lessons — add lesson
    // -----------------------------------------------
    @PostMapping("/{id}/lessons")
    public ResponseEntity<?> addLesson(
            @PathVariable Long id,
            @RequestBody CourseDTO.AddLessonRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            return ResponseEntity.ok(courseService.addLesson(id, request, teacher));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // PUT /api/courses/{id}/lessons/{lessonId} — update lesson
    // -----------------------------------------------
    @PutMapping("/{id}/lessons/{lessonId}")
    public ResponseEntity<?> updateLesson(
            @PathVariable Long id,
            @PathVariable Long lessonId,
            @RequestBody CourseDTO.AddLessonRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            return ResponseEntity.ok(courseService.updateLesson(id, lessonId, request, teacher));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // DELETE /api/courses/{id}/lessons/{lessonId}
    // -----------------------------------------------
    @DeleteMapping("/{id}/lessons/{lessonId}")
    public ResponseEntity<?> deleteLesson(
            @PathVariable Long id,
            @PathVariable Long lessonId,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            courseService.deleteLesson(id, lessonId, teacher);
            return ResponseEntity.ok(Map.of("message", "Lesson deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // POST /api/courses/{id}/enroll
    // -----------------------------------------------
    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enroll(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            User student = getUserFromToken(token);
            courseService.enroll(student, id);
            return ResponseEntity.ok(Map.of("message", "Enrolled successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // DELETE /api/courses/{id}/enroll — unenroll
    // -----------------------------------------------
    @DeleteMapping("/{id}/enroll")
    public ResponseEntity<?> unenroll(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            User student = getUserFromToken(token);
            courseService.unenroll(student, id);
            return ResponseEntity.ok(Map.of("message", "Unenrolled successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // GET /api/courses/my — my courses
    // -----------------------------------------------
    @GetMapping("/my")
    public ResponseEntity<?> myCourses(@RequestHeader("Authorization") String token) {
        try {
            User user = getUserFromToken(token);
            List<CourseDTO.CourseResponse> courses = user.getRole() == User.Role.TEACHER
                ? courseService.getCoursesByTeacher(user)
                : courseService.getEnrolledCourses(user);
            return ResponseEntity.ok(courses);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // GET /api/courses/{id}/enrolled
    // -----------------------------------------------
    @GetMapping("/{id}/enrolled")
    public ResponseEntity<?> checkEnrollment(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            User user = getUserFromToken(token);
            return ResponseEntity.ok(Map.of("enrolled", courseService.isEnrolled(user, id)));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(Map.of("enrolled", false));
        }
    }

    // ===============================================
    // ANNOUNCEMENTS
    // ===============================================

    // POST /api/courses/{id}/announcements — create announcement (teacher)
    @PostMapping("/{id}/announcements")
    public ResponseEntity<?> createAnnouncement(
            @PathVariable Long id,
            @RequestBody QuizDTO.AnnouncementRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            Course course = courseService.getCourseEntity(id);

            if (!course.getTeacher().getId().equals(teacher.getId())) {
                throw new RuntimeException("Only the course teacher can post announcements");
            }

            Announcement ann = new Announcement(request.getTitle(), request.getContent(), course, teacher);
            Announcement saved = announcementRepository.save(ann);
            return ResponseEntity.ok(mapAnnouncement(saved));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/courses/{id}/announcements — list announcements
    @GetMapping("/{id}/announcements")
    public ResponseEntity<?> getAnnouncements(@PathVariable Long id) {
        try {
            Course course = courseService.getCourseEntity(id);
            List<QuizDTO.AnnouncementResponse> announcements = announcementRepository
                .findByCourseOrderByCreatedAtDesc(course)
                .stream().map(this::mapAnnouncement).collect(Collectors.toList());
            return ResponseEntity.ok(announcements);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/courses/{id}/announcements/{annId} — delete announcement
    @DeleteMapping("/{id}/announcements/{annId}")
    public ResponseEntity<?> deleteAnnouncement(
            @PathVariable Long id,
            @PathVariable Long annId,
            @RequestHeader("Authorization") String token) {
        try {
            User teacher = getUserFromToken(token);
            Course course = courseService.getCourseEntity(id);

            if (!course.getTeacher().getId().equals(teacher.getId())) {
                throw new RuntimeException("Only the course teacher can delete announcements");
            }

            announcementRepository.deleteById(annId);
            return ResponseEntity.ok(Map.of("message", "Announcement deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===============================================
    // PROGRESS TRACKING
    // ===============================================

    // POST /api/courses/{id}/lessons/{lessonId}/complete — mark lesson as complete
    @PostMapping("/{id}/lessons/{lessonId}/complete")
    public ResponseEntity<?> markLessonComplete(
            @PathVariable Long id,
            @PathVariable Long lessonId,
            @RequestHeader("Authorization") String token) {
        try {
            User student = getUserFromToken(token);
            Course course = courseService.getCourseEntity(id);
            Lesson lesson = courseService.getLessonEntity(lessonId);

            Optional<LessonProgress> existing = lessonProgressRepository.findByStudentAndLesson(student, lesson);
            if (existing.isPresent()) {
                return ResponseEntity.ok(Map.of("message", "Already completed", "completed", true));
            }

            lessonProgressRepository.save(new LessonProgress(student, lesson));
            return ResponseEntity.ok(Map.of("message", "Lesson marked as complete", "completed", true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/courses/{id}/progress — get progress for current user
    @GetMapping("/{id}/progress")
    public ResponseEntity<?> getCourseProgress(
            @PathVariable Long id,
            @RequestHeader("Authorization") String token) {
        try {
            User student = getUserFromToken(token);
            Course course = courseService.getCourseEntity(id);
            List<Lesson> lessons = course.getLessons();

            if (lessons == null || lessons.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "totalLessons", 0,
                    "completedLessons", 0,
                    "percentage", 0,
                    "completedLessonIds", List.of()
                ));
            }

            long completed = lessonProgressRepository.countByStudentAndLessonInAndCompletedTrue(student, lessons);
            List<Long> completedIds = lessonProgressRepository.findByStudentAndLessonIn(student, lessons)
                .stream()
                .filter(LessonProgress::getCompleted)
                .map(lp -> lp.getLesson().getId())
                .collect(Collectors.toList());

            int total = lessons.size();
            int percentage = total > 0 ? (int) Math.round((completed * 100.0) / total) : 0;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("totalLessons", total);
            result.put("completedLessons", completed);
            result.put("percentage", percentage);
            result.put("completedLessonIds", completedIds);
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -----------------------------------------------
    // Helpers
    // -----------------------------------------------
    private QuizDTO.AnnouncementResponse mapAnnouncement(Announcement ann) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        QuizDTO.AnnouncementResponse resp = new QuizDTO.AnnouncementResponse();
        resp.setId(ann.getId());
        resp.setTitle(ann.getTitle());
        resp.setContent(ann.getContent());
        resp.setTeacherName(ann.getTeacher().getName());
        resp.setCreatedAt(ann.getCreatedAt().format(fmt));
        return resp;
    }

    private User getUserFromToken(String token) {
        Long userId = userService.getUserIdFromToken(token);
        return userService.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}

