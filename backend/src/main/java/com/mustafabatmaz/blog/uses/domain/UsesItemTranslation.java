package com.mustafabatmaz.blog.uses.domain;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.Translatable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "uses_item_translation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UsesItemTranslation implements Translatable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uses_item_id")
    private UsesItem item;

    @Column(nullable = false)
    private Language lang;

    @Column(nullable = false)
    private String name;

    private String description;

    public UsesItemTranslation(UsesItem item, Language lang, String name, String description) {
        this.item = item;
        this.lang = lang;
        update(name, description);
    }

    public void update(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
