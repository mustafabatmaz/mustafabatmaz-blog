package com.mustafabatmaz.blog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

/**
 * Keeps the OpenAPI snapshot that the frontend generates its types from in step with the API. When this fails, start
 * the backend with API_DOCS_ENABLED=true and run {@code pnpm gen:api} in {@code frontend/}.
 */
class OpenApiSpecTests extends IntegrationTest {

    // Maven runs the tests from backend/, and CI checks out the whole repository
    private static final Path SNAPSHOT = Path.of("../frontend/packages/api-client/openapi.json");
    private static final Path ACTUAL = Path.of("target/openapi.json");

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldMatchFrontendSnapshot_whenSpecIsGenerated() throws Exception {
        ObjectNode actual = liveSpec();
        // The server URL depends on the host that served the spec, so the snapshot leaves it out
        actual.remove("servers");
        JsonNode expected = jsonMapper.readTree(Files.readString(SNAPSHOT));

        // Compared as JSON trees, so key order and formatting don't matter
        boolean matches = actual.equals(expected);
        if (!matches) {
            Files.writeString(
                    ACTUAL, jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(actual));
        }
        assertThat(matches)
                .withFailMessage(
                        "The API no longer matches %s (the current spec is in %s). Start the backend with"
                                + " API_DOCS_ENABLED=true and run `pnpm gen:api` in frontend/.",
                        SNAPSHOT, ACTUAL)
                .isTrue();
    }

    @Test
    void shouldRequireResponseFields_whenTheyAreNeverNull() throws Exception {
        JsonNode profile = schema("ProfileResponse");

        assertThat(required(profile))
                .contains("fullName", "headline", "lang", "socialLinks")
                .doesNotContain("intro", "location", "email");
    }

    @Test
    void shouldMarkNullableFields_asOptionalAndNullable() throws Exception {
        JsonNode post = schema("PostDetailResponse");

        assertThat(required(post))
                .contains("slug", "title", "bodyMd", "publishedAt", "readingMinutes", "tags", "availableTranslations")
                .doesNotContain("summary", "cover", "previous", "next");
        assertThat(post.at("/properties/summary/type").toString()).contains("\"null\"");
        // A reference can't carry a second type, so a nullable one becomes "the reference or null"
        assertThat(post.at("/properties/cover/oneOf").toString())
                .contains("#/components/schemas/CoverResponse")
                .contains("\"null\"");
    }

    @Test
    void shouldRequireEveryPageField_whenTheListIsGeneric() throws Exception {
        JsonNode page = schema("PageResponsePostSummaryResponse");

        assertThat(required(page)).containsExactlyInAnyOrder("items", "page", "size", "totalItems", "totalPages");
    }

    @Test
    void shouldKeepOptionalRequestFields_optional() throws Exception {
        JsonNode request = schema("ProfileAdminRequest");

        assertThat(required(request))
                .contains("fullName", "translations", "socialLinks")
                .doesNotContain("email", "location", "version");
    }

    private ObjectNode liveSpec() throws Exception {
        byte[] body = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray();
        return (ObjectNode) jsonMapper.readTree(body);
    }

    private JsonNode schema(String name) throws Exception {
        JsonNode schema = liveSpec().at("/components/schemas/" + name);
        assertThat(schema.isMissingNode())
                .withFailMessage("No schema %s in the spec", name)
                .isFalse();
        return schema;
    }

    private static List<String> required(JsonNode schema) {
        List<String> names = new ArrayList<>();
        schema.path("required").forEach(name -> names.add(name.asString()));
        return names;
    }
}
