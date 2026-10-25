package com.mustafabatmaz.blog.experience.domain;

import com.mustafabatmaz.blog.common.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * A position at one company. Its projects are separate aggregates (edited on their own);
 * deleting an experience removes them through the database cascade.
 */
@Entity
@Table(name = "experience")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Experience extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String company;

    @Column(name = "start_month", nullable = false)
    private YearMonth startMonth;

    /** Null while this is the current position. */
    @Column(name = "end_month")
    private YearMonth endMonth;

    @OneToMany(mappedBy = "experience", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExperienceTranslation> translations = new ArrayList<>();

    public Experience(String company, YearMonth startMonth, YearMonth endMonth) {
        update(company, startMonth, endMonth);
    }

    public void update(String company, YearMonth startMonth, YearMonth endMonth) {
        this.company = company;
        this.startMonth = startMonth;
        this.endMonth = endMonth;
    }

    public boolean isCurrent() {
        return endMonth == null;
    }
}
