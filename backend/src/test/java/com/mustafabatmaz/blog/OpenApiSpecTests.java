package com.mustafabatmaz.blog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
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
        byte[] body = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray();
        ObjectNode actual = (ObjectNode) jsonMapper.readTree(body);
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
}
