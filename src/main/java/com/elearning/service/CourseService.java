package com.elearning.service;

import com.elearning.dto.CourseDTO;
import com.elearning.model.*;
import com.elearning.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired private CourseRepository       courseRepository;
    @Autowired private EnrollmentRepository   enrollmentRepository;
    @Autowired private LessonRepository       lessonRepository;
    @Autowired private FileResourceRepository fileResourceRepository;

    // -----------------------------------------------
    // CREATE Course
    // -----------------------------------------------
    public CourseDTO.CourseResponse createCourse(CourseDTO.CreateCourseRequest request, User teacher) {
        if (teacher.getRole() != User.Role.TEACHER) {
            throw new RuntimeException("Only teachers can create courses");
        }
        Course course = new Course(request.getTitle(), request.getDescription(), teacher);
        return mapToResponseWithLessons(courseRepository.save(course));
    }

    // -----------------------------------------------
    // READ — All courses
    // -----------------------------------------------
    public List<CourseDTO.CourseResponse> getAllCourses() {
        return courseRepository.findAll()
            .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // -----------------------------------------------
    // READ — Single course with lessons
    // -----------------------------------------------
    public CourseDTO.CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Course not found: " + id));
        return mapToResponseWithLessons(course);
    }

    // -----------------------------------------------
    // READ — Courses by teacher
    // -----------------------------------------------
    public List<CourseDTO.CourseResponse> getCoursesByTeacher(User teacher) {
        return courseRepository.findByTeacher(teacher)
            .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // -----------------------------------------------
    // UPDATE Course
    // -----------------------------------------------
    public CourseDTO.CourseResponse updateCourse(Long id, CourseDTO.CreateCourseRequest request, User teacher) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Course not found: " + id));

        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only edit your own courses");
        }

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        return mapToResponseWithLessons(courseRepository.save(course));
    }

    // -----------------------------------------------
    // DELETE Course (and all its lessons + files)
    // -----------------------------------------------
    @Transactional
    public void deleteCourse(Long id, User teacher) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Course not found: " + id));

        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only delete your own courses");
        }

        enrollmentRepository.findByStudent(teacher);
        fileResourceRepository.deleteByCourse(course);
        lessonRepository.deleteByCourse(course);
        enrollmentRepository.deleteByCourse(course);
        courseRepository.delete(course);
    }

    // -----------------------------------------------
    // ADD Lesson to a course
    // -----------------------------------------------
    public CourseDTO.LessonResponse addLesson(Long courseId, CourseDTO.AddLessonRequest request, User teacher) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only add lessons to your own courses");
        }

        Lesson lesson = new Lesson(
            request.getTitle(),
            request.getContent(),
            request.getOrderNum() != null ? request.getOrderNum() : 1,
            course
        );
        Lesson saved = lessonRepository.save(lesson);
        return mapLesson(saved);
    }

    // -----------------------------------------------
    // UPDATE Lesson
    // -----------------------------------------------
    public CourseDTO.LessonResponse updateLesson(Long courseId, Long lessonId,
                                                  CourseDTO.AddLessonRequest request, User teacher) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only edit lessons in your own courses");
        }

        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new RuntimeException("Lesson not found"));

        lesson.setTitle(request.getTitle());
        lesson.setContent(request.getContent());
        if (request.getOrderNum() != null) lesson.setOrderNum(request.getOrderNum());

        return mapLesson(lessonRepository.save(lesson));
    }

    // -----------------------------------------------
    // DELETE Lesson
    // -----------------------------------------------
    public void deleteLesson(Long courseId, Long lessonId, User teacher) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only delete lessons in your own courses");
        }

        lessonRepository.deleteById(lessonId);
    }

    // -----------------------------------------------
    // ENROLL Student
    // -----------------------------------------------
    public void enroll(User student, Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

        Optional<Enrollment> existing = enrollmentRepository.findByStudentAndCourse(student, course);
        if (existing.isPresent()) throw new RuntimeException("Already enrolled in this course");

        enrollmentRepository.save(new Enrollment(student, course));
    }

    // -----------------------------------------------
    // GET Enrolled courses for a student
    // -----------------------------------------------
    public List<CourseDTO.CourseResponse> getEnrolledCourses(User student) {
        return enrollmentRepository.findByStudent(student)
            .stream().map(e -> mapToResponse(e.getCourse())).collect(Collectors.toList());
    }

    // -----------------------------------------------
    // CHECK Enrollment
    // -----------------------------------------------
    public boolean isEnrolled(User student, Long courseId) {
        return courseRepository.findById(courseId)
            .flatMap(course -> enrollmentRepository.findByStudentAndCourse(student, course))
            .isPresent();
    }

    // -----------------------------------------------
    // UNENROLL Student
    // -----------------------------------------------
    public void unenroll(User student, Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));

        Enrollment enrollment = enrollmentRepository.findByStudentAndCourse(student, course)
            .orElseThrow(() -> new RuntimeException("Not enrolled in this course"));

        enrollmentRepository.delete(enrollment);
    }

    // -----------------------------------------------
    // GET Course Entity directly (used by controller)
    // -----------------------------------------------
    public Course getCourseEntity(Long id) {
        return courseRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Course not found: " + id));
    }

    // -----------------------------------------------
    // GET Lesson Entity directly (used by controller)
    // -----------------------------------------------
    public Lesson getLessonEntity(Long id) {
        return lessonRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Lesson not found: " + id));
    }

    // -----------------------------------------------
    // Mappers
    // -----------------------------------------------
    private CourseDTO.CourseResponse mapToResponse(Course course) {
        CourseDTO.CourseResponse resp = new CourseDTO.CourseResponse();
        resp.setId(course.getId());
        resp.setTitle(course.getTitle());
        resp.setDescription(course.getDescription());
        resp.setTeacherName(course.getTeacher().getName());
        resp.setTeacherId(course.getTeacher().getId());
        resp.setLessonCount(course.getLessons() != null ? course.getLessons().size() : 0);
        resp.setStudentCount(enrollmentRepository.countByCourse(course));
        resp.setCreatedAt(course.getCreatedAt().toString());
        return resp;
    }

    private CourseDTO.CourseResponse mapToResponseWithLessons(Course course) {
        CourseDTO.CourseResponse resp = mapToResponse(course);
        if (course.getLessons() != null) {
            resp.setLessons(course.getLessons().stream()
                .map(this::mapLesson).collect(Collectors.toList()));
        }
        return resp;
    }

    private CourseDTO.LessonResponse mapLesson(Lesson l) {
        CourseDTO.LessonResponse lr = new CourseDTO.LessonResponse();
        lr.setId(l.getId());
        lr.setTitle(l.getTitle());
        lr.setContent(l.getContent());
        lr.setOrderNum(l.getOrderNum());
        return lr;
    }
}
