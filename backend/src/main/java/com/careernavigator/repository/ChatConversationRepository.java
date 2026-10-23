package com.careernavigator.repository;

import com.careernavigator.entity.ChatConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversationEntity, String> {
    List<ChatConversationEntity> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<ChatConversationEntity> findByIdAndUserId(String id, String userId);
    void deleteByIdAndUserId(String id, String userId);
    void deleteByUserId(String userId);
}
