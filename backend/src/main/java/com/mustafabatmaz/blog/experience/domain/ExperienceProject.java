package com.mustafabatmaz.blog.experience.domain;

import com.mustafabatmaz.blog.common.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "experience_project")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExperienceProject extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "experience_id")
    private Experience experience;

    /** URL key of the case-study page; the same in every language. */
    @Column(nullable = false)
    private String slug;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExperienceProjectTranslation> translations = new ArrayList<>();

    // A Set, not a List: Hibernate can't fetch two Lists (bags) in one query
    @ManyToMany
    @JoinTable(
            name = "experience_project_technology",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "technology_id"))
    private Set<Technology> technologies = new LinkedHashSet<>();

    public ExperienceProject(Experience experience, String slug, int sortOrder) {
        this.experience = experience;
        this.slug = slug;
        this.sortOrder = sortOrder;
    }

    public void changeSlug(String slug) {
        this.slug = slug;
    }

    public void replaceTechnologies(Collection<Technology> technologies) {
        this.technologies.clear();
        this.technologies.addAll(technologies);
    }

    public void moveTo(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    /** True when at least one language has a case-study text. */
    public boolean hasCaseStudy() {
        return translations.stream().anyMatch(ExperienceProjectTranslation::hasCaseStudy);
    }
}
