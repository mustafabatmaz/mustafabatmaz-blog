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

/** Request and response bodies of the /uses API. */
public final class UsesDtos {

    // Only http(s): blocks javascript: and data: URLs that would run when rendered as a link
    private static final String HTTP_URL = "^https?://\\S+$";

    private UsesDtos() {}

    public record UsesCategoryResponse(UsesCategory category, List<UsesItemResponse> items) {}

    /** @param lang the language actually returned for this item */
    public record UsesItemResponse(String name, String description, String url, Language lang) {}

    public record UsesItemAdminRequest(
            @NotNull UsesCategory category,
            @Size(max = 500) @Pattern(regexp = HTTP_URL) String url,
            @NotEmpty @Valid List<UsesItemTranslationDto> translations,
            Long version) {}

    public record UsesItemAdminResponse(
            Long id,
            UsesCategory category,
            String url,
            int sortOrder,
            List<UsesItemTranslationDto> translations,
            long version,
            Instant updatedAt) {}

    public record UsesItemTranslationDto(
            @NotNull Language lang,
            @NotBlank @Size(max = 100) String name,
            @Size(max = 500) String description) {}

    /** The complete new order: every item id exactly once. */
    public record UsesOrderRequest(@NotEmpty List<Long> ids) {}
}
