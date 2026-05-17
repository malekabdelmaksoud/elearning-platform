package com.elearning.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Send a password reset verification code via email.
     * Runs asynchronously so the API response is instant.
     */
    @Async
    public void sendResetCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("ELearn — Password Reset Code");
        message.setText(
            "Hello,\n\n" +
            "You requested to reset your password on ELearn platform.\n\n" +
            "Your verification code is: " + code + "\n\n" +
            "This code expires in 10 minutes.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "— ELearn Platform"
        );

        mailSender.send(message);
    }

    /**
     * Forward a contact form message to the admin/support email.
     */
    @Async
    public void sendContactMessage(String fromName, String fromEmail, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("abdelmaksoudmelek965@gmail.com");
        message.setSubject("ELearn Contact: " + (subject != null && !subject.isEmpty() ? subject : "No Subject"));
        message.setText(
            "New message from ELearn contact form:\n\n" +
            "From: " + fromName + " (" + fromEmail + ")\n" +
            "Subject: " + (subject != null ? subject : "N/A") + "\n\n" +
            "Message:\n" + body + "\n\n" +
            "— ELearn Contact System"
        );
        message.setReplyTo(fromEmail);

        mailSender.send(message);
    }
}
