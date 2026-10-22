package com.careernavigator.repository;

import com.careernavigator.entity.ResumeTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TemplateRepository extends JpaRepository<ResumeTemplateEntity, String> {
}
