package com.careernavigator.repository;

import com.careernavigator.entity.ResumeDocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeDocumentRepository extends JpaRepository<ResumeDocumentEntity, String> {

    List<ResumeDocumentEntity> findByUserIdOrderByUpdatedAtDesc(String userId);

    Optional<ResumeDocumentEntity> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);
}
