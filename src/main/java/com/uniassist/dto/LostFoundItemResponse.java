
package com.uniassist.dto;

import java.time.LocalDateTime;

import com.uniassist.entity.LostFoundItem;

public class LostFoundItemResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long categoryId;
    private String categoryName;
    private String itemName;
    private String description;
    private String location;
    private String type;
    private String status;
    private String imagePath;
    private LocalDateTime createdAt;

    public LostFoundItemResponse(LostFoundItem item) {
        this.id = item.getId();
        this.userId = item.getUser().getId();
        this.userName = item.getUser().getName();
        this.categoryId = item.getCategory().getId();
        this.categoryName = item.getCategory().getName();
        this.itemName = item.getItemName();
        this.description = item.getDescription();
        this.location = item.getLocation();
        this.type = item.getType();
        this.status = item.getStatus();
        this.imagePath = item.getImagePath();
        this.createdAt = item.getCreatedAt();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public String getItemName() { return itemName; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getImagePath() { return imagePath; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
