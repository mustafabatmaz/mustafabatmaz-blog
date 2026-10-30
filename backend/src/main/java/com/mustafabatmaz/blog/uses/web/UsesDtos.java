package com.mustafabatmaz.blog.uses.web;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.uses.domain.UsesCategory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.jspecify.annotations.Nullable;

/** Request and response bodies of the /uses API. */
public final class UsesDtos {

    // Only http(s): blocks javascript: and data: URLs that would run when rendered as a link
    private static final String HTTP_URL = "^https?://\\S+$";

    private UsesDtos() {}

    public record UsesCategoryResponse(UsesCategory category, List<UsesItemResponse> items) {}

    /** @param lang the language actually returned for this item */
    public record UsesItemResponse(
            String name,
            @Nullable String description,
            @Nullable String url,
            Language lang) {}

    public record UsesItemAdminRequest(
            @NotNull UsesCategory category,

            @Size(max = 500) @Pattern(regexp = HTTP_URL) @Nullable
            String url,

            @NotEmpty @Valid List<UsesItemTranslationDto> translations,
            @Nullable Long version) {}

    public record UsesItemAdminResponse(
            Long id,
            UsesCategory category,
            @Nullable String url,
            int sortOrder,
            List<UsesItemTranslationDto> translations,
            long version,
            Instant updatedAt) {}

    public record UsesItemTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = 100) String name,
            @Size(max = 500) @Nullable String description) {}

    /** The complete new order: every item id exactly once. */
    public record UsesOrderRequest(@NotEmpty List<Long> ids) {}
}
