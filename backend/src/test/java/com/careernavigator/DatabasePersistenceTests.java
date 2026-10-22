package com.careernavigator;

import com.careernavigator.entity.MockInterviewEntity;
import com.careernavigator.entity.ResumeAnalysisEntity;
import com.careernavigator.entity.StudentFeedbackEntity;
import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.*;
import com.careernavigator.service.DatabaseStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabasePersistenceTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private DatabaseStorageService databaseStorageService;

    @Test
    void testDatabasePreservesEntitiesAndRelationships() {
        // Test 10: Database persistence
        String userId = "usr-" + UUID.randomUUID().toString();
        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setEmail("persist-" + UUID.randomUUID() + "@example.com");
        user.setName("Database Test User");
        user.setRole("student");
        user.setSkills(List.of("Java", "PostgreSQL", "Docker"));
        userRepository.save(user);

        ResumeAnalysisEntity resume = new ResumeAnalysisEntity();
        resume.setId("res-" + UUID.randomUUID().toString().substring(0, 8));
        resume.setUserId(userId);
        resume.setFileName("resume.pdf");
        resume.setAtsScore(88);
        resume.setSkills(List.of("Java", "PostgreSQL"));
        resumeRepository.save(resume);

        MockInterviewEntity interview = new MockInterviewEntity();
        interview.setId("int-" + UUID.randomUUID().toString().substring(0, 8));
        interview.setUserId(userId);
        interview.setJobRole("Backend Engineer");
        interview.setOverallScore(82);
        interviewRepository.save(interview);

        StudentFeedbackEntity feedback = new StudentFeedbackEntity();
        feedback.setId("feed-" + UUID.randomUUID().toString().substring(0, 8));
        feedback.setUserId(userId);
        feedback.setRating(5);
        feedback.setComment("Excellent preparation platform!");
        feedbackRepository.save(feedback);

        // Verify retrieval
        assertThat(userRepository.findById(userId)).isPresent();
        assertThat(resumeRepository.findByUserIdOrderByUploadedAtDesc(userId)).isNotEmpty();
        assertThat(interviewRepository.findByUserIdOrderByDateDesc(userId)).isNotEmpty();
        assertThat(feedbackRepository.findById(feedback.getId())).isPresent();

        // Sync test
        databaseStorageService.syncToDbJson();
    }
}
