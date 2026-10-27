package com.mustafabatmaz.blog.content.service;

import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.content.domain.Post;
import com.mustafabatmaz.blog.content.domain.PostTranslation;
import com.mustafabatmaz.blog.content.domain.Tag;
import com.mustafabatmaz.blog.content.repository.TagCount;
import com.mustafabatmaz.blog.content.web.PostDtos.CoverResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminSummary;
import com.mustafabatmaz.blog.content.web.PostDtos.PostDetailResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostLink;
import com.mustafabatmaz.blog.content.web.PostDtos.PostSummaryResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostTranslationAdminResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.TagCountResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.TagResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.TranslationLink;
import com.mustafabatmaz.blog.content.web.PostDtos.TranslationTitle;
import com.mustafabatmaz.blog.media.MediaReference;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import org.mapstruct.Mapper;

@Mapper
interface PostMapper {

    // ---- generated: field-by-field copies ----

    PostTranslationAdminResponse toAdminDto(PostTranslation translation);

    TagResponse toResponse(Tag tag);

    TagCountResponse toResponse(TagCount count);

    List<TagCountResponse> toTagCountResponses(List<TagCount> counts);

    List<TagResponse> toTagResponses(List<Tag> tags);

    // ---- written by hand: they need the current time, a language or data from the media module ----

    default PostSummaryResponse toSummary(Post post, Language lang, MediaReference cover) {
        PostTranslation t = translation(post, lang);
        return new PostSummaryResponse(
                t.getSlug(),
                t.getTitle(),
                t.getSummary(),
                post.getPublishedAt(),
                t.getReadingMinutes(),
                tagResponses(post.getTags()),
                toCover(cover, lang),
                lang);
    }

    default PostDetailResponse toDetail(
            Post post, Language lang, MediaReference cover, PostTranslation previous, PostTranslation next) {
        PostTranslation t = translation(post, lang);
        return new PostDetailResponse(
                t.getSlug(),
                lang,
                t.getTitle(),
                t.getSummary(),
                t.getBodyMd(),
                post.getPublishedAt(),
                post.getUpdatedAt(),
                t.getReadingMinutes(),
                tagResponses(post.getTags()),
                toCover(cover, lang),
                post.getTranslations().stream()
                        .sorted(Comparator.comparing(PostTranslation::getLang))
                        .map(tr -> new TranslationLink(tr.getLang(), tr.getSlug()))
                        .toList(),
                toLink(previous),
                toLink(next));
    }

    default PostAdminResponse toAdminResponse(Post post, Instant now) {
        return new PostAdminResponse(
                post.getId(),
                post.getStatus(),
                post.getPublishedAt(),
                post.isScheduled(now),
                post.getCoverMediaId(),
                post.getTranslations().stream()
                        .sorted(Comparator.comparing(PostTranslation::getLang))
                        .map(this::toAdminDto)
                        .toList(),
                tagNames(post.getTags()),
                post.getVersion(),
                post.getCreatedAt(),
                post.getUpdatedAt());
    }

    default PostAdminSummary toAdminSummary(Post post, Instant now) {
        return new PostAdminSummary(
                post.getId(),
                post.getStatus(),
                post.getPublishedAt(),
                post.isScheduled(now),
                post.getTranslations().stream()
                        .sorted(Comparator.comparing(PostTranslation::getLang))
                        .map(t -> new TranslationTitle(t.getLang(), t.getSlug(), t.getTitle()))
                        .toList(),
                tagNames(post.getTags()),
                post.getVersion(),
                post.getUpdatedAt());
    }

    private static PostTranslation translation(Post post, Language lang) {
        // Public queries only return posts that have this language
        return post.getTranslations().stream()
                .filter(t -> t.getLang() == lang)
                .findFirst()
                .orElseThrow();
    }

    private List<TagResponse> tagResponses(Collection<Tag> tags) {
        return tags.stream()
                .sorted(Comparator.comparing(Tag::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .toList();
    }

    private static List<String> tagNames(Collection<Tag> tags) {
        return tags.stream()
                .map(Tag::getName)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    private static CoverResponse toCover(MediaReference cover, Language lang) {
        return cover == null ? null : new CoverResponse(cover.url(), cover.altText(lang));
    }

    private static PostLink toLink(PostTranslation translation) {
        return translation == null ? null : new PostLink(translation.getSlug(), translation.getTitle());
    }
}
