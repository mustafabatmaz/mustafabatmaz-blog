package com.mustafabatmaz.blog.uses.repository;

import com.mustafabatmaz.blog.uses.domain.UsesItem;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UsesItemRepository extends JpaRepository<UsesItem, Long> {

    // Loads translations in the same query instead of one query per item
    @EntityGraph(attributePaths = "translations")
    List<UsesItem> findAllByOrderBySortOrderAsc();

    @Query("select coalesce(max(u.sortOrder), -1) from UsesItem u")
    int findMaxSortOrder();
}
