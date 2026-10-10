
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

import com.uniassist.dto.LostFoundItemResponse;
import com.uniassist.entity.Category;
import com.uniassist.entity.LostFoundItem;
import com.uniassist.entity.User;
import com.uniassist.repository.CategoryRepository;
import com.uniassist.repository.LostFoundItemRepository;
import com.uniassist.repository.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/lost-found")
public class LostFoundItemController {

    private final LostFoundItemRepository itemRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public LostFoundItemController(
            LostFoundItemRepository itemRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository) {
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    // Get all lost and found items
    @GetMapping
    public List<LostFoundItemResponse> getAllItems() {
        return itemRepository.findAll()
                .stream()
                .map(LostFoundItemResponse::new)
                .toList();
    }

    // Get items by type: LOST or FOUND
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getItemsByType(
            @PathVariable String type) {

        String itemType = type.toUpperCase();

        if (!List.of("LOST", "FOUND").contains(itemType)) {
            return ResponseEntity.badRequest()
                    .body("Type must be LOST or FOUND");
        }

        List<LostFoundItemResponse> items = itemRepository
                .findByType(itemType)
                .stream()
                .map(LostFoundItemResponse::new)
                .toList();

        return ResponseEntity.ok(items);
    }

    // Get items by status
    @GetMapping("/status/{status}")
    public List<LostFoundItemResponse> getItemsByStatus(
            @PathVariable String status) {

        return itemRepository.findByStatus(status.toUpperCase())
                .stream()
                .map(LostFoundItemResponse::new)
                .toList();
    }

    // Create a lost/found listing
    @PostMapping
    public ResponseEntity<?> createItem(
            @Valid @RequestBody LostFoundItem request) {

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

        String itemType = request.getType() == null
                ? "" : request.getType().toUpperCase();

        if (!List.of("LOST", "FOUND").contains(itemType)) {
            return ResponseEntity.badRequest()
                    .body("Type must be LOST or FOUND");
        }

        User user = userRepository
                .findById(request.getUser().getId())
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

        LostFoundItem item = new LostFoundItem();
        item.setUser(user);
        item.setCategory(category);
        item.setItemName(request.getItemName());
        item.setDescription(request.getDescription());
        item.setLocation(request.getLocation());
        item.setType(itemType);
        item.setStatus("OPEN");
        item.setImagePath(request.getImagePath());

        LostFoundItem savedItem = itemRepository.save(item);

        return ResponseEntity.ok(
                new LostFoundItemResponse(savedItem));
    }

    // Update item status
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateItemStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        LostFoundItem item = itemRepository
                .findById(id)
                .orElse(null);

        if (item == null) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = status.toUpperCase();

        if (!List.of(
                "OPEN",
                "CLAIM_REQUESTED",
                "VERIFIED",
                "RESOLVED"
        ).contains(newStatus)) {
            return ResponseEntity.badRequest()
                    .body("Invalid item status");
        }

        item.setStatus(newStatus);

        LostFoundItem savedItem = itemRepository.save(item);

        return ResponseEntity.ok(
                new LostFoundItemResponse(savedItem));
    }

    // Get lost/found items by category
    @GetMapping("/category/{categoryId}")
    public List<LostFoundItemResponse> getItemsByCategory(
            @PathVariable Long categoryId) {

        return itemRepository.findByCategoryId(categoryId)
                .stream()
                .map(LostFoundItemResponse::new)
                .toList();
    }
}
