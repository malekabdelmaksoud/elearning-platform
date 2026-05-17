package com.elearning.repository;

import com.elearning.model.ChatMessage;
import com.elearning.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Get all messages in a course chat room, ordered by time
    List<ChatMessage> findByCourseOrderBySentAtAsc(Course course);
}
