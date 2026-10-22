package com.careernavigator.repository;

import com.careernavigator.entity.MockInterviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<MockInterviewEntity, String> {
    List<MockInterviewEntity> findByUserIdOrderByDateDesc(String userId);
}
