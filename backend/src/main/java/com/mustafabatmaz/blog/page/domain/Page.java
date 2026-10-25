package com.mustafabatmaz.blog.page.domain;

import com.mustafabatmaz.blog.common.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A standalone page such as /about or /now, identified by its key. */
@Entity
@Table(name = "page")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Page extends AuditableEntity {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "page_key")
    private PageKey key;

    @OneToMany(mappedBy = "page", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PageTranslation> translations = new ArrayList<>();

    public Page(PageKey key) {
        this.key = key;
    }
}
