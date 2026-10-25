package com.mustafabatmaz.blog.page.repository;

import com.mustafabatmaz.blog.page.domain.Page;
import com.mustafabatmaz.blog.page.domain.PageKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageRepository extends JpaRepository<Page, PageKey> {}
