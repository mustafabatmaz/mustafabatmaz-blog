package com.mustafabatmaz.blog.uses.domain;

import com.mustafabatmaz.blog.common.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "uses_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UsesItem extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UsesCategory category;

    private String url;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UsesItemTranslation> translations = new ArrayList<>();

    public UsesItem(UsesCategory category, String url, int sortOrder) {
        update(category, url);
        this.sortOrder = sortOrder;
    }

    public void update(UsesCategory category, String url) {
        this.category = category;
        this.url = url;
    }

    public void moveTo(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
