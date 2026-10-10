package com.uniassist.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uniassist.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByStatus(String status);

    List<Ticket> findByUserId(Long userId);

    List<Ticket> findByCategoryId(Long categoryId);
}