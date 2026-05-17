package com.elearning.controller;

import com.elearning.model.ChatMessage;
import com.elearning.model.Course;
import com.elearning.model.User;
import com.elearning.repository.ChatMessageRepository;
import com.elearning.repository.CourseRepository;
import com.elearning.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserService userService;

    // GET /api/chat/{courseId}/history — load past messages for a course room
    @GetMapping("/{courseId}/history")
    public ResponseEntity<?> getChatHistory(@PathVariable Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Map<String, Object>> history = chatMessageRepository
            .findByCourseOrderBySentAtAsc(course)
            .stream()
            .map(this::mapMessage)
            .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }

    // WebSocket handler: client sends to /app/chat/{courseId}
    // Server broadcasts to /topic/chat/{courseId}
    @MessageMapping("/chat/{courseId}")
    public void handleChatMessage(
            @DestinationVariable Long courseId,
            @Payload Map<String, String> payload) {

        try {
            String token   = payload.get("token");
            String message = payload.get("message");

            if (message == null || message.isBlank()) return;

            // Decode token to get the sender
            Long userId = userService.getUserIdFromToken(token);
            User sender = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

            // Save message to database
            ChatMessage saved = chatMessageRepository.save(
                new ChatMessage(course, sender, message)
            );

            // Broadcast the message to all subscribers of this course room
            Map<String, Object> outgoing = mapMessage(saved);
            messagingTemplate.convertAndSend("/topic/chat/" + courseId, outgoing);

        } catch (Exception e) {
            System.err.println("Chat error: " + e.getMessage());
        }
    }

    // Convert ChatMessage entity to a simple map for JSON response
    private Map<String, Object> mapMessage(ChatMessage msg) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        return Map.of(
            "id",         msg.getId(),
            "senderName", msg.getSender().getName(),
            "senderId",   msg.getSender().getId(),
            "senderRole", msg.getSender().getRole().name(),
            "message",    msg.getMessage(),
            "sentAt",     msg.getSentAt().format(fmt)
        );
    }
}
