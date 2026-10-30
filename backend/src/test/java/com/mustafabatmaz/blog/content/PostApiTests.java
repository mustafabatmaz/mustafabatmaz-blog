package com.mustafabatmaz.blog.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.mustafabatmaz.blog.IntegrationTest;
import com.mustafabatmaz.blog.media.ImageBytes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

class PostApiTests extends IntegrationTest {

    private static final String PUBLIC = "/api/public/posts";
    private static final String ADMIN = "/api/admin/posts";

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearContent() {
        jdbc.execute("TRUNCATE post, tag, media CASCADE");
    }

    // ---- visibility and publishing ----

    @Test
    void shouldHideDrafts_fromThePublicSite() throws Exception {
        create(postJson("DRAFT", null, null, "[" + tr("taslak", "Taslak") + "]", null));

        mockMvc.perform(get(PUBLIC)).andExpect(jsonPath("$.totalItems").value(0));
        mockMvc.perform(get(PUBLIC + "/taslak")).andExpect(status().isNotFound());
    }

    @Test
    void shouldShowPublishedPost_withItsListFields() throws Exception {
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("ilk-yazi", "İlk yazı") + "]", null, "Kafka"));

        mockMvc.perform(get(PUBLIC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].slug").value("ilk-yazi"))
                .andExpect(jsonPath("$.items[0].title").value("İlk yazı"))
                .andExpect(jsonPath("$.items[0].lang").value("tr"))
                .andExpect(jsonPath("$.items[0].readingMinutes").value(1))
                .andExpect(jsonPath("$.items[0].tags[0].slug").value("kafka"))
                .andExpect(jsonPath("$.items[0].cover", nullValue()));
    }

    @Test
    void shouldUseNowAsPublishDate_whenNoneIsGiven() throws Exception {
        String response = create(postJson("PUBLISHED", null, null, "[" + tr("hemen", "Hemen") + "]", null));

        Instant publishedAt = Instant.parse(JsonPath.read(response, "$.publishedAt"));
        assertThat(publishedAt).isBetween(Instant.now().minusSeconds(60), Instant.now());
        mockMvc.perform(get(PUBLIC + "/hemen")).andExpect(status().isOk());
    }

    @Test
    void shouldKeepFuturePostHidden_untilItsPublishDate() throws Exception {
        String future = Instant.now().plus(3, ChronoUnit.DAYS).toString();
        String response = create(postJson("PUBLISHED", future, null, "[" + tr("yakinda", "Yakında") + "]", null));

        assertThat((Boolean) JsonPath.read(response, "$.scheduled")).isTrue();
        mockMvc.perform(get(PUBLIC)).andExpect(jsonPath("$.totalItems").value(0));
        mockMvc.perform(get(PUBLIC + "/yakinda")).andExpect(status().isNotFound());
    }

    @Test
    void shouldHidePost_whenItIsMovedBackToDraft() throws Exception {
        long id = id(create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("geri", "Geri") + "]", null)));

        mockMvc.perform(asAdmin(
                        put(ADMIN + "/" + id), postJson("DRAFT", daysAgo(1), null, "[" + tr("geri", "Geri") + "]", 0L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        mockMvc.perform(get(PUBLIC + "/geri")).andExpect(status().isNotFound());
    }

    // ---- languages ----

    @Test
    void shouldLeaveOutPosts_withoutTheRequestedLanguage() throws Exception {
        create(postJson("PUBLISHED", daysAgo(2), null, "[" + tr("sadece-turkce", "Sadece Türkçe") + "]", null));
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + en("english-only", "English only") + "]", null));

        mockMvc.perform(get(PUBLIC).param("lang", "tr"))
                .andExpect(jsonPath("$.items[*].slug", contains("sadece-turkce")));
        mockMvc.perform(get(PUBLIC).param("lang", "en"))
                .andExpect(jsonPath("$.items[*].slug", contains("english-only")));
    }

    @Test
    void shouldLinkTranslations_eachWithItsOwnSlug() throws Exception {
        create(postJson(
                "PUBLISHED",
                daysAgo(1),
                null,
                "[" + tr("kaybolan-eventler", "Kaybolan event'ler") + ","
                        + en("disappearing-events", "Disappearing events") + "]",
                null));

        mockMvc.perform(get(PUBLIC + "/disappearing-events").param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Disappearing events"))
                .andExpect(jsonPath(
                        "$.availableTranslations[*].slug", contains("kaybolan-eventler", "disappearing-events")))
                .andExpect(jsonPath("$.availableTranslations[*].lang", contains("tr", "en")));
    }

    @Test
    void shouldNotFallBack_toTheOtherLanguageForPosts() throws Exception {
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("turkce-yazi", "Türkçe yazı") + "]", null));

        mockMvc.perform(get(PUBLIC + "/turkce-yazi").param("lang", "en")).andExpect(status().isNotFound());
    }

    // ---- paging, ordering, neighbours ----

    @Test
    void shouldPageResults_newestFirst() throws Exception {
        for (int day = 12; day >= 1; day--) {
            create(postJson("PUBLISHED", daysAgo(day), null, "[" + tr("yazi-" + day, "Yazı " + day) + "]", null));
        }

        mockMvc.perform(get(PUBLIC))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalItems").value(12))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items.length()").value(10))
                .andExpect(jsonPath("$.items[0].slug").value("yazi-1"));
        mockMvc.perform(get(PUBLIC).param("page", "2"))
                .andExpect(jsonPath("$.items[*].slug", contains("yazi-11", "yazi-12")));
    }

    @Test
    void shouldRejectPageZero() throws Exception {
        mockMvc.perform(get(PUBLIC).param("page", "0")).andExpect(status().isBadRequest());
    }

    @Test
    void shouldLinkPreviousAndNextPosts_inTheSameLanguage() throws Exception {
        create(postJson("PUBLISHED", daysAgo(3), null, "[" + tr("eski", "Eski") + "]", null));
        create(postJson("PUBLISHED", daysAgo(2), null, "[" + tr("orta", "Orta") + "]", null));
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("yeni", "Yeni") + "]", null));

        mockMvc.perform(get(PUBLIC + "/orta"))
                .andExpect(jsonPath("$.previous.slug").value("eski"))
                .andExpect(jsonPath("$.next.slug").value("yeni"));
        mockMvc.perform(get(PUBLIC + "/yeni")).andExpect(jsonPath("$.next", nullValue()));
    }

    // ---- tags ----

    @Test
    void shouldFilterByTag() throws Exception {
        create(postJson("PUBLISHED", daysAgo(2), null, "[" + tr("kafka-yazisi", "Kafka") + "]", null, "Kafka"));
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("diger", "Diğer") + "]", null, "Liquibase"));

        mockMvc.perform(get(PUBLIC).param("tag", "kafka"))
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("kafka-yazisi"));
    }

    @Test
    void shouldBuildTagSlugs_fromTurkishNames_andReuseThem() throws Exception {
        create(postJson("PUBLISHED", daysAgo(2), null, "[" + tr("a", "A") + "]", null, "Güvenlik"));
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("b", "B") + "]", null, "güvenlik"));

        mockMvc.perform(asAdmin(get("/api/admin/tags")))
                .andExpect(jsonPath("$[*].slug", contains("guvenlik")))
                .andExpect(jsonPath("$[*].name", contains("Güvenlik")));
    }

    @Test
    void shouldCountOnlyVisiblePosts_inThePublicTagList() throws Exception {
        create(postJson("PUBLISHED", daysAgo(2), null, "[" + tr("bir", "Bir") + "]", null, "Kafka", "Java"));
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("iki", "İki") + "]", null, "Kafka"));
        create(postJson("DRAFT", null, null, "[" + tr("taslak", "Taslak") + "]", null, "Docker"));

        mockMvc.perform(get("/api/public/tags"))
                .andExpect(jsonPath("$[*].slug", contains("java", "kafka")))
                .andExpect(jsonPath("$[1].postCount").value(2));
    }

    // ---- validation ----

    @Test
    void shouldRejectDuplicateSlug_inTheSameLanguage() throws Exception {
        create(postJson("DRAFT", null, null, "[" + tr("ayni", "Bir") + "]", null));

        mockMvc.perform(asAdmin(post(ADMIN), postJson("DRAFT", null, null, "[" + tr("ayni", "İki") + "]", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://mustafabatmaz.com/problems/slug-taken"));
    }

    @Test
    void shouldAllowSameSlug_inDifferentLanguages() throws Exception {
        create(postJson("DRAFT", null, null, "[" + tr("docker", "Docker") + "]", null));

        mockMvc.perform(asAdmin(post(ADMIN), postJson("DRAFT", null, null, "[" + en("docker", "Docker") + "]", null)))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldRejectSlug_thatIsNotUrlFriendly() throws Exception {
        mockMvc.perform(asAdmin(post(ADMIN), postJson("DRAFT", null, null, "[" + tr("İlk Yazı", "İlk") + "]", null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUpdate_whenVersionIsStale() throws Exception {
        long id = id(create(postJson("DRAFT", null, null, "[" + tr("v", "V") + "]", null)));

        mockMvc.perform(asAdmin(put(ADMIN + "/" + id), postJson("DRAFT", null, null, "[" + tr("v", "V") + "]", 7L)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://mustafabatmaz.com/problems/version-conflict"));
    }

    // ---- cover image (cross-module) ----

    @Test
    void shouldShowCoverImage_withItsAltText() throws Exception {
        long cover = uploadCover();
        create(postJson("PUBLISHED", daysAgo(1), cover, "[" + tr("kapakli", "Kapaklı") + "]", null));

        mockMvc.perform(get(PUBLIC + "/kapakli"))
                .andExpect(jsonPath("$.cover.url", notNullValue()))
                .andExpect(jsonPath("$.cover.alt").value("Kapak görseli"));
    }

    @Test
    void shouldRejectPost_whenCoverImageDoesNotExist() throws Exception {
        mockMvc.perform(asAdmin(post(ADMIN), postJson("DRAFT", null, 999999L, "[" + tr("x", "X") + "]", null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRefuseToDeleteImage_whileAPostUsesItAsCover() throws Exception {
        long cover = uploadCover();
        create(postJson("DRAFT", null, cover, "[" + tr("x", "X") + "]", null));

        mockMvc.perform(asAdmin(delete("/api/admin/media/" + cover)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://mustafabatmaz.com/problems/media-in-use"));
        // The failed delete left the image in place
        mockMvc.perform(asAdmin(get("/api/admin/media")))
                .andExpect(jsonPath("$[0].id").value(cover));
    }

    // ---- admin ----

    @Test
    void shouldListDraftsToo_andFilterByStatus() throws Exception {
        create(postJson("DRAFT", null, null, "[" + tr("taslak", "Taslak") + "]", null));
        create(postJson("PUBLISHED", daysAgo(1), null, "[" + tr("yayinda", "Yayında") + "]", null));

        mockMvc.perform(asAdmin(get(ADMIN))).andExpect(jsonPath("$.totalItems").value(2));
        mockMvc.perform(asAdmin(get(ADMIN).param("status", "draft")))
                .andExpect(jsonPath("$.items[*].translations[0].slug", contains("taslak")));
    }

    @Test
    void shouldDeletePost() throws Exception {
        long id = id(create(
                postJson("PUBLISHED", daysAgo(1), null, "[" + tr("silinecek", "Silinecek") + "]", null, "Kafka")));

        mockMvc.perform(asAdmin(delete(ADMIN + "/" + id))).andExpect(status().isNoContent());

        mockMvc.perform(get(PUBLIC + "/silinecek")).andExpect(status().isNotFound());
        mockMvc.perform(asAdmin(get(ADMIN + "/" + id))).andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnFullPost_toTheAdmin() throws Exception {
        long id = id(create(postJson("DRAFT", null, null, "[" + tr("tam", "Tam") + "]", null, "Java", "Docker")));

        mockMvc.perform(asAdmin(get(ADMIN + "/" + id)))
                .andExpect(jsonPath("$.translations[0].bodyMd").value("Bu bir deneme yazısıdır."))
                .andExpect(jsonPath("$.tags", containsInAnyOrder("Java", "Docker")))
                .andExpect(jsonPath("$.version").value(0));
    }

    @Test
    void shouldRequireAuthentication_forAdminEndpoints() throws Exception {
        mockMvc.perform(get(ADMIN)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/tags")).andExpect(status().isUnauthorized());
    }

    // ---- helpers ----

    private String create(String json) throws Exception {
        return mockMvc.perform(asAdmin(post(ADMIN), json))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private long uploadCover() throws Exception {
        String response = mockMvc.perform(asAdmin(multipart("/api/admin/media")
                                .file(new MockMultipartFile("file", "cover.png", "image/png", ImageBytes.png())))
                        .param("altTr", "Kapak görseli"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return id(response);
    }

    private static long id(String response) {
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private static String daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS).toString();
    }

    private static String postJson(
            String status, String publishedAt, Long coverMediaId, String translations, Long version, String... tags) {
        String tagJson = Arrays.stream(tags).map(t -> "\"" + t + "\"").collect(Collectors.joining(","));
        return """
                {"status":"%s","publishedAt":%s,"coverMediaId":%s,
                 "translations":%s,"tags":[%s],"version":%s}
                """.formatted(
                        status,
                        publishedAt == null ? "null" : "\"" + publishedAt + "\"",
                        coverMediaId,
                        translations,
                        tagJson,
                        version);
    }

    private static String tr(String slug, String title) {
        return translation("tr", slug, title, "Bu bir deneme yazısıdır.");
    }

    private static String en(String slug, String title) {
        return translation("en", slug, title, "This is a test post.");
    }

    private static String translation(String lang, String slug, String title, String body) {
        return """
                {"lang":"%s","slug":"%s","title":"%s","summary":"Özet","bodyMd":"%s"}
                """.formatted(lang, slug, title.replace("\"", "\\\""), body);
    }
}
