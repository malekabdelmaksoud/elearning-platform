-- =============================================
-- E-Learning Platform Database Schema
-- Run this in phpMyAdmin or MySQL CLI
-- =============================================

CREATE DATABASE IF NOT EXISTS elearning_db;
USE elearning_db;

-- Users table: stores both students and teachers
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100)         NOT NULL,
    email      VARCHAR(100) UNIQUE  NOT NULL,
    password   VARCHAR(255)         NOT NULL,
    role       ENUM('STUDENT','TEACHER') NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table: created by teachers
CREATE TABLE IF NOT EXISTS courses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id  BIGINT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Lessons table: content inside a course
CREATE TABLE IF NOT EXISTS lessons (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    content    TEXT,
    order_num  INT DEFAULT 1,
    course_id  BIGINT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Enrollments: students enrolled in courses
CREATE TABLE IF NOT EXISTS enrollments (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT NOT NULL,
    course_id   BIGINT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id)  REFERENCES courses(id)
);

-- Chat messages (persisted XMPP messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id  BIGINT NOT NULL,
    sender_id  BIGINT NOT NULL,
    message    TEXT NOT NULL,
    sent_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- File resources attached to courses
CREATE TABLE IF NOT EXISTS file_resources (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    content_type  VARCHAR(100),
    file_size     BIGINT,
    course_id     BIGINT NOT NULL,
    uploaded_by   BIGINT,
    uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Quizzes: MCQ questions attached to lessons
CREATE TABLE IF NOT EXISTS quizzes (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    question       TEXT NOT NULL,
    option_a       VARCHAR(255) NOT NULL,
    option_b       VARCHAR(255) NOT NULL,
    option_c       VARCHAR(255) NOT NULL,
    option_d       VARCHAR(255) NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    lesson_id      BIGINT NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Quiz attempts: student answers
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT NOT NULL,
    quiz_id         BIGINT NOT NULL,
    selected_answer CHAR(1) NOT NULL,
    is_correct      BOOLEAN,
    attempted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attempt (student_id, quiz_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Announcements: course-level announcements from teachers
CREATE TABLE IF NOT EXISTS announcements (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    content    TEXT,
    course_id  BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Lesson progress: tracks which lessons a student has completed
CREATE TABLE IF NOT EXISTS lesson_progress (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT NOT NULL,
    lesson_id    BIGINT NOT NULL,
    completed    BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_progress (student_id, lesson_id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id)  REFERENCES lessons(id) ON DELETE CASCADE
);

-- Password reset tokens: stores verification codes for password recovery
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(100) NOT NULL,
    code       VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Professor Ahmed', 'teacher@demo.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8a9YZDAI6x4HbXhGpe', 'TEACHER'),
('Student Sara',   'student@demo.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8a9YZDAI6x4HbXhGpe', 'STUDENT');
-- Default password for both accounts: "password123"

