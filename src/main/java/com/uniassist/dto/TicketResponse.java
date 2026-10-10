
package com.uniassist.dto;

import java.time.LocalDateTime;

import com.uniassist.entity.Ticket;

public class TicketResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long categoryId;
    private String categoryName;
    private String roomNo;
    private String description;
    private String priority;
    private String status;
    private LocalDateTime createdAt;
    private Long assignedToId;
    private String assignedToName;

    public TicketResponse(Ticket ticket) {
        this.id = ticket.getId();
        this.userId = ticket.getUser().getId();
        this.userName = ticket.getUser().getName();
        this.categoryId = ticket.getCategory().getId();
        this.categoryName = ticket.getCategory().getName();
        this.roomNo = ticket.getRoomNo();
        this.description = ticket.getDescription();
        this.priority = ticket.getPriority();
        this.status = ticket.getStatus();
        this.createdAt = ticket.getCreatedAt();

        if (ticket.getAssignedTo() != null) {
            this.assignedToId = ticket.getAssignedTo().getId();
            this.assignedToName = ticket.getAssignedTo().getName();
        }
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public String getRoomNo() { return roomNo; }
    public String getDescription() { return description; }
    public String getPriority() { return priority; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getAssignedToId() { return assignedToId; }
    public String getAssignedToName() { return assignedToName; }
}
