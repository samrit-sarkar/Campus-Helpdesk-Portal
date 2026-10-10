
package com.uniassist.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.uniassist.dto.TicketResponse;
import com.uniassist.entity.Category;
import com.uniassist.entity.Ticket;
import com.uniassist.entity.User;
import com.uniassist.repository.CategoryRepository;
import com.uniassist.repository.TicketRepository;
import com.uniassist.repository.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public TicketController(
            TicketRepository ticketRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    // Get all tickets
    @GetMapping
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(TicketResponse::new)
                .toList();
    }

    // Get tickets by status
    @GetMapping("/status/{status}")
    public List<TicketResponse> getTicketsByStatus(
            @PathVariable String status) {
        return ticketRepository.findByStatus(status.toUpperCase())
                .stream()
                .map(TicketResponse::new)
                .toList();
    }

    // Get tickets created by a user
    @GetMapping("/user/{userId}")
    public List<TicketResponse> getTicketsByUser(
            @PathVariable Long userId) {
        return ticketRepository.findByUserId(userId)
                .stream()
                .map(TicketResponse::new)
                .toList();
    }

    // Get tickets by category
    @GetMapping("/category/{categoryId}")
    public List<TicketResponse> getTicketsByCategory(
            @PathVariable Long categoryId) {
        return ticketRepository.findByCategoryId(categoryId)
                .stream()
                .map(TicketResponse::new)
                .toList();
    }

    // Create a maintenance ticket
    @PostMapping
    public ResponseEntity<?> createTicket(
            @Valid @RequestBody Ticket request) {

        if (request.getUser() == null
                || request.getUser().getId() == null) {
            return ResponseEntity.badRequest()
                    .body("User ID is required");
        }

        if (request.getCategory() == null
                || request.getCategory().getId() == null) {
            return ResponseEntity.badRequest()
                    .body("Category ID is required");
        }

        User user = userRepository.findById(request.getUser().getId())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body("User not found");
        }

        Category category = categoryRepository
                .findById(request.getCategory().getId())
                .orElse(null);

        if (category == null) {
            return ResponseEntity.badRequest()
                    .body("Category not found");
        }

        Ticket ticket = new Ticket();
        ticket.setUser(user);
        ticket.setCategory(category);
        ticket.setRoomNo(request.getRoomNo());
        ticket.setDescription(request.getDescription());
        ticket.setPriority("MEDIUM");
        ticket.setStatus("PENDING");

        Ticket savedTicket = ticketRepository.save(ticket);

        return ResponseEntity.ok(new TicketResponse(savedTicket));
    }

    // Update ticket status
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateTicketStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        Ticket ticket = ticketRepository.findById(id)
                .orElse(null);

        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = status.toUpperCase();

        if (!List.of(
                "PENDING",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED"
        ).contains(newStatus)) {
            return ResponseEntity.badRequest()
                    .body("Invalid ticket status");
        }

        ticket.setStatus(newStatus);

        Ticket savedTicket = ticketRepository.save(ticket);

        return ResponseEntity.ok(new TicketResponse(savedTicket));
    }

    // Update ticket priority
    @PatchMapping("/{id}/priority")
    public ResponseEntity<?> updateTicketPriority(
            @PathVariable Long id,
            @RequestParam String priority) {

        Ticket ticket = ticketRepository.findById(id)
                .orElse(null);

        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }

        String newPriority = priority.toUpperCase();

        if (!List.of("LOW", "MEDIUM", "HIGH")
                .contains(newPriority)) {
            return ResponseEntity.badRequest()
                    .body("Priority must be LOW, MEDIUM, or HIGH");
        }

        ticket.setPriority(newPriority);

        Ticket savedTicket = ticketRepository.save(ticket);

        return ResponseEntity.ok(new TicketResponse(savedTicket));
    }

    // Assign a ticket to a staff member
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignTicket(
            @PathVariable Long id,
            @RequestParam Long staffId) {

        Ticket ticket = ticketRepository.findById(id)
                .orElse(null);

        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }

        User staff = userRepository.findById(staffId)
                .orElse(null);

        if (staff == null) {
            return ResponseEntity.badRequest()
                    .body("Staff user not found");
        }

        if (!"STAFF".equalsIgnoreCase(staff.getRole())) {
            return ResponseEntity.badRequest()
                    .body("User is not a staff member");
        }

        ticket.setAssignedTo(staff);
        ticket.setStatus("ASSIGNED");

        Ticket savedTicket = ticketRepository.save(ticket);

        return ResponseEntity.ok(new TicketResponse(savedTicket));
    }
}
