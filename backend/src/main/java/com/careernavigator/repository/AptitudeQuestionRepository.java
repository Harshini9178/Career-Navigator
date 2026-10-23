package com.careernavigator.repository;

import com.careernavigator.entity.AptitudeQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AptitudeQuestionRepository extends JpaRepository<AptitudeQuestionEntity, String> {

    List<AptitudeQuestionEntity> findByCategoryAndActiveTrue(String category);

    List<AptitudeQuestionEntity> findAllByActiveTrue();

    long countByActiveTrue();
}
