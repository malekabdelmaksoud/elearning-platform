package com.elearning.dto;

import lombok.Data;
import java.util.List;

// DTOs for Course-related requests and responses
public class CourseDTO {

    @Data
    public static class CreateCourseRequest {
        private String title;
        private String description;
    }

    @Data
    public static class AddLessonRequest {
        private String title;
        private String content;
        private Integer orderNum;
    }

    @Data
    public static class CourseResponse {
        private Long id;
        private String title;
        private String description;
        private String teacherName;
        private Long teacherId;
        private int lessonCount;
        private long studentCount;
        private String createdAt;
        private List<LessonResponse> lessons;
    }

    @Data
    public static class LessonResponse {
        private Long id;
        private String title;
        private String content;
        private Integer orderNum;
    }
}
