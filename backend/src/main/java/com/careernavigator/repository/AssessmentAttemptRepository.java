package com.careernavigator.repository;

import com.careernavigator.entity.AssessmentAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttemptEntity, String> {

    List<AssessmentAttemptEntity> findByUserIdOrderByStartedAtDesc(String userId);

    Optional<AssessmentAttemptEntity> findFirstByUserIdAndStatusOrderByStartedAtDesc(String userId, String status);

    long countByUserId(String userId);
}
