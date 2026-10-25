package com.mustafabatmaz.blog.profile.repository;

import com.mustafabatmaz.blog.profile.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {}
