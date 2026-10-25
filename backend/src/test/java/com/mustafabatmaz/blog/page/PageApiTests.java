package com.mustafabatmaz.blog.page;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.mustafabatmaz.blog.IntegrationTest;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class PageApiTests extends IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearPages() {
        jdbc.execute("TRUNCATE page CASCADE");
    }

    @Test
    void shouldReturnNotFound_whenPageWasNeverSaved() throws Exception {
        mockMvc.perform(get("/api/public/pages/about")).andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnBadRequest_whenPageKeyIsUnknown() throws Exception {
        mockMvc.perform(get("/api/public/pages/contact")).andExpect(status().isBadRequest());
    }

    @Test
    void shouldCreatePage_whenAdminSavesItForTheFirstTime() throws Exception {
        mockMvc.perform(asAdmin(put("/api/admin/pages/about"), pageJson(null, bothLanguages())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("ABOUT"))
                .andExpect(jsonPath("$.version").value(0));
    }

    @Test
    void shouldReturnPageInRequestedLanguage_withAvailableLanguages() throws Exception {
        savePage("about", bothLanguages());

        mockMvc.perform(get("/api/public/pages/about").param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lang").value("en"))
                .andExpect(jsonPath("$.title").value("About"))
                .andExpect(jsonPath("$.bodyMd").value("# Hello"))
                .andExpect(jsonPath("$.availableLanguages", contains("tr", "en")));
    }

    @Test
    void shouldFallBackToTurkish_whenEnglishIsMissing() throws Exception {
        savePage("now", "[" + turkish() + "]");

        mockMvc.perform(get("/api/public/pages/now").param("lang", "en"))
                .andExpect(jsonPath("$.lang").value("tr"))
                .andExpect(jsonPath("$.availableLanguages", contains("tr")));
    }

    @Test
    void shouldMoveUpdatedAt_whenOnlyTheTextChanges() throws Exception {
        // The "last updated" date on /now must follow edits to the translation alone
        String first = savePage("now", bothLanguages());
        Instant firstUpdate = Instant.parse(JsonPath.read(first, "$.updatedAt"));

        String second = mockMvc.perform(asAdmin(
                        put("/api/admin/pages/now"),
                        pageJson(0L, "[{\"lang\":\"tr\",\"title\":\"Şimdi\",\"bodyMd\":\"Yeni metin\"}]")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(Instant.parse(JsonPath.read(second, "$.updatedAt"))).isAfter(firstUpdate);
    }

    @Test
    void shouldRejectUpdate_whenVersionIsStale() throws Exception {
        savePage("about", bothLanguages());

        mockMvc.perform(asAdmin(put("/api/admin/pages/about"), pageJson(5L, bothLanguages())))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectPage_whenBodyIsEmpty() throws Exception {
        String empty = "[{\"lang\":\"tr\",\"title\":\"Hakkımda\",\"bodyMd\":\"\"}]";

        mockMvc.perform(asAdmin(put("/api/admin/pages/about"), pageJson(null, empty)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRequireAuthentication_forAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/pages/about")).andExpect(status().isUnauthorized());
    }

    private String savePage(String key, String translations) throws Exception {
        return mockMvc.perform(asAdmin(put("/api/admin/pages/" + key), pageJson(null, translations)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private static String pageJson(Long version, String translations) {
        return "{\"translations\":%s,\"version\":%s}".formatted(translations, version);
    }

    private static String bothLanguages() {
        return "[" + turkish() + ",{\"lang\":\"en\",\"title\":\"About\",\"bodyMd\":\"# Hello\"}]";
    }

    private static String turkish() {
        return "{\"lang\":\"tr\",\"title\":\"Hakkımda\",\"bodyMd\":\"# Merhaba\"}";
    }
}
