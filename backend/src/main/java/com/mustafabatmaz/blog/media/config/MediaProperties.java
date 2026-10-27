package com.mustafabatmaz.blog.media.config;

import jakarta.validation.constraints.NotNull;
import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/**
 * @param dir where uploaded files are stored (MEDIA_DIR)
 * @param maxFileSize also enforced earlier by spring.servlet.multipart.max-file-size
 */
@Validated
@ConfigurationProperties(prefix = "blog.media")
public record MediaProperties(
        @NotNull Path dir, @DefaultValue("5MB") DataSize maxFileSize) {}
