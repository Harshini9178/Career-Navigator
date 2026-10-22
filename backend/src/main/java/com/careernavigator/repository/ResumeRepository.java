package com.careernavigator.repository;

import com.careernavigator.entity.ResumeAnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<ResumeAnalysisEntity, String> {
    List<ResumeAnalysisEntity> findByUserIdOrderByUploadedAtDesc(String userId);
    Optional<ResumeAnalysisEntity> findFirstByUserIdOrderByUploadedAtDesc(String userId);
}
