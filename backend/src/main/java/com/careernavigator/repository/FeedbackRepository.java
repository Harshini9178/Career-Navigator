package com.careernavigator.repository;

import com.careernavigator.entity.StudentFeedbackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<StudentFeedbackEntity, String> {
    List<StudentFeedbackEntity> findAllByOrderByCreatedAtDesc();
}
