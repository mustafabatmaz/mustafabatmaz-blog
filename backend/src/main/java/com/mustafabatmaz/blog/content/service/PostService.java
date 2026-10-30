package com.mustafabatmaz.blog.content.service;

import com.mustafabatmaz.blog.common.BadRequestException;
import com.mustafabatmaz.blog.common.Language;
import com.mustafabatmaz.blog.common.NotFoundException;
import com.mustafabatmaz.blog.common.PageResponse;
import com.mustafabatmaz.blog.common.Slugs;
import com.mustafabatmaz.blog.common.Translations;
import com.mustafabatmaz.blog.content.domain.Post;
import com.mustafabatmaz.blog.content.domain.PostStatus;
import com.mustafabatmaz.blog.content.domain.PostTranslation;
import com.mustafabatmaz.blog.content.domain.Tag;
import com.mustafabatmaz.blog.content.repository.PostRepository;
import com.mustafabatmaz.blog.content.repository.PostTranslationRepository;
import com.mustafabatmaz.blog.content.repository.TagRepository;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminRequest;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostAdminSummary;
import com.mustafabatmaz.blog.content.web.PostDtos.PostDetailResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostSummaryResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.PostTranslationDto;
import com.mustafabatmaz.blog.content.web.PostDtos.TagCountResponse;
import com.mustafabatmaz.blog.content.web.PostDtos.TagResponse;
import com.mustafabatmaz.blog.media.MediaCatalog;
import com.mustafabatmaz.blog.media.MediaReference;
import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostService {

    static final int PUBLIC_PAGE_SIZE = 10;
    static final int ADMIN_PAGE_SIZE = 20;

    private final PostRepository postRepository;
    private final PostTranslationRepository translationRepository;
    private final TagRepository tagRepository;
    private final MediaCatalog mediaCatalog;
    private final PostMapper mapper;
    private final Clock clock;

    // ---- public ----

    /** Visible posts in one language, newest first. A post without this language is left out. */
    @Transactional(readOnly = true)
    public PageResponse<PostSummaryResponse> listPublic(Language lang, int page, String tag) {
        Instant now = clock.instant();
        PageRequest request = PageRequest.of(toIndex(page), PUBLIC_PAGE_SIZE);
        Page<Long> ids = tag == null
                ? postRepository.findVisibleIds(lang, PostStatus.PUBLISHED, now, request)
                : postRepository.findVisibleIdsByTag(lang, PostStatus.PUBLISHED, now, tag, request);
        List<Post> posts = loadInOrder(ids.getContent());
        Map<Long, MediaReference> covers = mediaCatalog.findAll(posts.stream()
                .map(Post::getCoverMediaId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));
        return PageResponse.of(
                ids,
                posts.stream()
                        .map(p -> mapper.toSummary(p, lang, coverOf(p, covers)))
                        .toList());
    }

    // Null-safe on purpose: Map.of() and other immutable maps throw on get(null)
    private static MediaReference coverOf(Post post, Map<Long, MediaReference> covers) {
        return post.getCoverMediaId() == null ? null : covers.get(post.getCoverMediaId());
    }

    @Transactional(readOnly = true)
    public PostDetailResponse getPublic(String slug, Language lang) {
        Instant now = clock.instant();
        Long id = postRepository
                .findVisibleIdBySlug(lang, PostStatus.PUBLISHED, now, slug)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        Post post = loadInOrder(List.of(id)).getFirst();
        PageRequest one = PageRequest.of(0, 1);
        PostTranslation previous = first(translationRepository.findOlder(
                lang, PostStatus.PUBLISHED, now, post.getPublishedAt(), post.getId(), one));
        PostTranslation next = first(translationRepository.findNewer(
                lang, PostStatus.PUBLISHED, now, post.getPublishedAt(), post.getId(), one));
        MediaReference cover = post.getCoverMediaId() == null
                ? null
                : mediaCatalog.find(post.getCoverMediaId()).orElse(null);
        return mapper.toDetail(post, lang, cover, previous, next);
    }

    @Transactional(readOnly = true)
    public List<TagCountResponse> listPublicTags(Language lang) {
        return mapper.toTagCountResponses(
                postRepository.countVisibleByTag(lang, PostStatus.PUBLISHED, clock.instant()));
    }

    // ---- admin ----

    /** All posts including drafts, most recently edited first. */
    @Transactional(readOnly = true)
    public PageResponse<PostAdminSummary> listAdmin(int page, PostStatus status) {
        Instant now = clock.instant();
        PageRequest request = PageRequest.of(
                toIndex(page), ADMIN_PAGE_SIZE, Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id")));
        Page<Long> ids =
                status == null ? postRepository.findAllIds(request) : postRepository.findIdsByStatus(status, request);
        return PageResponse.of(
                ids,
                loadInOrder(ids.getContent()).stream()
                        .map(p -> mapper.toAdminSummary(p, now))
                        .toList());
    }

    @Transactional(readOnly = true)
    public PostAdminResponse getAdmin(long id) {
        return mapper.toAdminResponse(load(id), clock.instant());
    }

    @Transactional(readOnly = true)
    public List<TagResponse> listTags() {
        return mapper.toTagResponses(tagRepository.findAllByOrderByNameAsc());
    }

    @Transactional
    public PostAdminResponse create(PostAdminRequest request) {
        checkCover(request.coverMediaId());
        checkSlugsAreFree(request.translations(), null);
        Set<Tag> tags = resolveTags(request.tags());
        Post post = Post.create();
        apply(post, request, tags);
        return mapper.toAdminResponse(postRepository.saveAndFlush(post), clock.instant());
    }

    @Transactional
    public PostAdminResponse update(long id, PostAdminRequest request) {
        Post post = load(id);
        post.checkVersion(request.version());
        // All queries run before the entity changes, so no intermediate flush bumps the version twice
        checkCover(request.coverMediaId());
        checkSlugsAreFree(request.translations(), id);
        Set<Tag> tags = resolveTags(request.tags());
        apply(post, request, tags);
        return mapper.toAdminResponse(postRepository.saveAndFlush(post), clock.instant());
    }

    @Transactional
    public void delete(long id) {
        postRepository.delete(load(id));
    }

    // ---- helpers ----

    private void apply(Post post, PostAdminRequest request, Set<Tag> tags) {
        Instant now = clock.instant();
        post.changePublication(request.status(), request.publishedAt(), now);
        post.changeCover(request.coverMediaId());
        Translations.sync(
                post.getTranslations(),
                request.translations(),
                PostTranslationDto::lang,
                t -> {
                    PostTranslation translation = new PostTranslation(post, t.lang());
                    translation.update(t.slug(), t.title(), t.summary(), t.bodyMd());
                    return translation;
                },
                (existing, t) -> existing.update(t.slug(), t.title(), t.summary(), t.bodyMd()));
        post.replaceTags(tags);
        post.touch(now);
    }

    private void checkCover(Long coverMediaId) {
        if (coverMediaId != null && mediaCatalog.find(coverMediaId).isEmpty()) {
            throw new BadRequestException("Cover image not found");
        }
    }

    /** Checks every language first, so the client can mark all taken slugs at once. */
    private void checkSlugsAreFree(List<PostTranslationDto> translations, Long postId) {
        List<Language> taken = translations.stream()
                .filter(t -> postId == null
                        ? translationRepository.existsByLangAndSlug(t.lang(), t.slug())
                        : translationRepository.existsByLangAndSlugAndPost_IdNot(t.lang(), t.slug(), postId))
                .map(PostTranslationDto::lang)
                .toList();
        if (!taken.isEmpty()) {
            throw new SlugTakenException(taken);
        }
    }

    /** Finds each tag by the slug of its name, creating the ones that don't exist yet. */
    private Set<Tag> resolveTags(List<String> names) {
        Map<String, String> bySlug = new LinkedHashMap<>();
        for (String name : names) {
            String trimmed = name.trim();
            bySlug.putIfAbsent(Slugs.slugify(trimmed), trimmed);
        }
        Set<Tag> tags = new LinkedHashSet<>();
        bySlug.forEach((slug, name) ->
                tags.add(tagRepository.findBySlug(slug).orElseGet(() -> tagRepository.save(new Tag(name, slug)))));
        return tags;
    }

    /** Loads posts with their translations and tags, keeping the order of the given ids. */
    private List<Post> loadInOrder(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Post> byId =
                postRepository.findAllByIdIn(ids).stream().collect(Collectors.toMap(Post::getId, Function.identity()));
        return ids.stream().map(byId::get).toList();
    }

    private Post load(long id) {
        return postRepository.findById(id).orElseThrow(() -> new NotFoundException("Post not found"));
    }

    /** The URL counts pages from 1; Spring counts from 0. */
    private static int toIndex(int page) {
        if (page < 1) {
            throw new BadRequestException("Pages start at 1");
        }
        return page - 1;
    }

    private static PostTranslation first(List<PostTranslation> translations) {
        return translations.isEmpty() ? null : translations.getFirst();
    }
}
