package com.elearning;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ElearningApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElearningApplication.class, args);
        System.out.println("==============================================");
        System.out.println("  E-Learning Platform started!");
        System.out.println("  Open: http://localhost:8080");
        System.out.println("==============================================");
    }
}
