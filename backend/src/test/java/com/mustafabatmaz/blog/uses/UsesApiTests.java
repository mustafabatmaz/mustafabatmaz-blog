package com.mustafabatmaz.blog.uses;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.mustafabatmaz.blog.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class UsesApiTests extends IntegrationTest {

    private static final String PUBLIC = "/api/public/uses";
    private static final String ADMIN = "/api/admin/uses";

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearUses() {
        jdbc.execute("TRUNCATE uses_item CASCADE");
    }

    @Test
    void shouldReturnEmptyList_whenNothingWasAdded() throws Exception {
        mockMvc.perform(get(PUBLIC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldGroupItemsByCategory_inCategoryThenAdminOrder() throws Exception {
        create("SOFTWARE", "Obsidian");
        create("HARDWARE", "MacBook Pro");
        create("SOFTWARE", "Docker Desktop");

        mockMvc.perform(get(PUBLIC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].category", contains("HARDWARE", "SOFTWARE")))
                .andExpect(jsonPath("$[1].items[*].name", contains("Obsidian", "Docker Desktop")));
    }

    @Test
    void shouldFallBackToTurkish_whenEnglishIsMissing() throws Exception {
        create("HARDWARE", "Klavye");

        mockMvc.perform(get(PUBLIC).param("lang", "en"))
                .andExpect(jsonPath("$[0].items[0].name").value("Klavye"))
                .andExpect(jsonPath("$[0].items[0].lang").value("tr"));
    }

    @Test
    void shouldReorderItems_whenAllIdsAreGiven() throws Exception {
        long first = create("SOFTWARE", "Obsidian");
        long second = create("SOFTWARE", "Docker Desktop");

        mockMvc.perform(asAdmin(put(ADMIN + "/order"), "{\"ids\":[%d,%d]}".formatted(second, first)))
                .andExpect(status().isOk());

        mockMvc.perform(get(PUBLIC)).andExpect(jsonPath("$[0].items[*].name", contains("Docker Desktop", "Obsidian")));
    }

    @Test
    void shouldRejectReorder_whenAnIdIsMissing() throws Exception {
        long first = create("SOFTWARE", "Obsidian");
        create("SOFTWARE", "Docker Desktop");

        mockMvc.perform(asAdmin(put(ADMIN + "/order"), "{\"ids\":[%d]}".formatted(first)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldUpdateItem_whenVersionIsCurrent() throws Exception {
        long id = create("SOFTWARE", "Obsidian");

        mockMvc.perform(asAdmin(put(ADMIN + "/" + id), itemJson("DEV_TOOLS", "IntelliJ IDEA", 0L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("DEV_TOOLS"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void shouldRejectUpdate_whenVersionIsStale() throws Exception {
        long id = create("SOFTWARE", "Obsidian");

        mockMvc.perform(asAdmin(put(ADMIN + "/" + id), itemJson("SOFTWARE", "Obsidian", 3L)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturnNotFound_whenUpdatingUnknownItem() throws Exception {
        mockMvc.perform(asAdmin(put(ADMIN + "/999999"), itemJson("SOFTWARE", "Obsidian", 0L)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldDeleteItem() throws Exception {
        long id = create("SOFTWARE", "Obsidian");

        mockMvc.perform(asAdmin(delete(ADMIN + "/" + id))).andExpect(status().isNoContent());

        mockMvc.perform(get(PUBLIC)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldRejectItem_whenCategoryIsUnknown() throws Exception {
        mockMvc.perform(asAdmin(post(ADMIN), itemJson("FURNITURE", "Chair", null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRequireAuthentication_forAdminEndpoints() throws Exception {
        mockMvc.perform(get(ADMIN)).andExpect(status().isUnauthorized());
    }

    private long create(String category, String name) throws Exception {
        String response = mockMvc.perform(asAdmin(post(ADMIN), itemJson(category, name, null)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private static String itemJson(String category, String name, Long version) {
        return """
                {"category":"%s","url":"https://example.com",
                 "translations":[{"lang":"tr","name":"%s","description":"Açıklama"}],"version":%s}
                """.formatted(category, name, version);
    }
}
