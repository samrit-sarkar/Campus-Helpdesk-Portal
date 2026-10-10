
package com.uniassist.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uniassist.entity.Category;
import com.uniassist.repository.CategoryRepository;
import com.uniassist.repository.LostFoundItemRepository;
import com.uniassist.repository.TicketRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final TicketRepository ticketRepository;
    private final LostFoundItemRepository lostFoundItemRepository;

    public CategoryController(
            CategoryRepository categoryRepository,
            TicketRepository ticketRepository,
            LostFoundItemRepository lostFoundItemRepository) {

        this.categoryRepository = categoryRepository;
        this.ticketRepository = ticketRepository;
        this.lostFoundItemRepository = lostFoundItemRepository;
    }

    // Get all categories
    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Get category by ID
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(
            @PathVariable Long id) {

        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create a category
    @PostMapping
    public ResponseEntity<?> createCategory(
            @Valid @RequestBody Category category) {

        if (categoryRepository.existsByName(category.getName())) {
            return ResponseEntity.badRequest()
                    .body("Category already exists");
        }

        Category savedCategory = categoryRepository.save(category);

        return ResponseEntity.ok(savedCategory);
    }

    // Update a category
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody Category updatedCategory) {

        return categoryRepository.findById(id)
                .map(existingCategory -> {

                    if (categoryRepository.existsByName(
                            updatedCategory.getName())
                            && !existingCategory.getName().equalsIgnoreCase(
                                    updatedCategory.getName())) {

                        return ResponseEntity.badRequest()
                                .body("Category name already exists");
                    }

                    existingCategory.setName(updatedCategory.getName());
                    existingCategory.setDescription(
                            updatedCategory.getDescription());

                    Category savedCategory =
                            categoryRepository.save(existingCategory);

                    return ResponseEntity.ok(savedCategory);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete a category only if it is not being used
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id) {

        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        boolean hasTickets =
                !ticketRepository.findByCategoryId(id).isEmpty();

        boolean hasLostFoundItems =
                !lostFoundItemRepository.findByCategoryId(id).isEmpty();

        if (hasTickets || hasLostFoundItems) {
            return ResponseEntity.badRequest()
                    .body("Cannot delete category because it is in use.");
        }

        categoryRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
