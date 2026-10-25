package com.mustafabatmaz.blog.experience.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A technology name shared by projects. Unique ignoring case; keeps the casing it was first entered with. */
@Entity
@Table(name = "technology")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Technology {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    public Technology(String name) {
        this.name = name;
    }
}
