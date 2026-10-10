package com.uniassist.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uniassist.entity.LostFoundItem;

public interface LostFoundItemRepository
        extends JpaRepository<LostFoundItem, Long> {

    List<LostFoundItem> findByType(String type);

    List<LostFoundItem> findByStatus(String status);

    List<LostFoundItem> findByUserId(Long userId);

    List<LostFoundItem> findByCategoryId(Long categoryId);
}