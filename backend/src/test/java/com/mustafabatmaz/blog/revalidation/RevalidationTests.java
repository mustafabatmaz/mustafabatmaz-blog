package com.mustafabatmaz.blog.revalidation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mustafabatmaz.blog.FakePublicWeb;
import com.mustafabatmaz.blog.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** After an admin change the backend asks public-web to refresh its cached pages (6a). */
class RevalidationTests extends IntegrationTest {

    // Long enough for the background call, short enough to keep "no call" checks quick
    private static final long WAIT_MILLIS = 2000;

    private static final String PAGE =
            "{\"version\":null,\"translations\":[{\"lang\":\"tr\",\"title\":\"Şimdi\",\"bodyMd\":\"Metin\"}]}";

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void reset() throws InterruptedException {
        jdbc.execute("TRUNCATE page CASCADE");
        // Calls still on their way from earlier tests mustn't count here
        while (FakePublicWeb.next(100) != null) {}
        FakePublicWeb.reset();
    }

    @Test
    void shouldAskPublicWebToRevalidate_whenAdminSavesSomething() throws Exception {
        mockMvc.perform(asAdmin(put("/api/admin/pages/now"), PAGE)).andExpect(status().isOk());

        FakePublicWeb.Received request = FakePublicWeb.next(WAIT_MILLIS);
        assertThat(request).isNotNull();
        assertThat(request.method()).isEqualTo("POST");
        assertThat(request.path()).isEqualTo("/api/revalidate");
        assertThat(request.authorization()).isEqualTo("Bearer " + FakePublicWeb.SECRET);
        // Plain HTTP/1.1: an h2c upgrade request gets an empty reply from public-web (found in Docker)
        assertThat(request.upgrade()).isNull();
    }

    @Test
    void shouldNotRevalidate_whenAdminOnlyReads() throws Exception {
        mockMvc.perform(asAdmin(get("/api/admin/posts"))).andExpect(status().isOk());

        assertThat(FakePublicWeb.next(WAIT_MILLIS)).isNull();
    }

    @Test
    void shouldNotRevalidate_whenTheChangeIsRejected() throws Exception {
        String missingTitle =
                "{\"version\":null,\"translations\":[{\"lang\":\"tr\",\"title\":\"\",\"bodyMd\":\"Metin\"}]}";

        mockMvc.perform(asAdmin(put("/api/admin/pages/now"), missingTitle)).andExpect(status().isBadRequest());

        assertThat(FakePublicWeb.next(WAIT_MILLIS)).isNull();
    }

    @Test
    void shouldNotRevalidate_whenSomeoneLogsIn() throws Exception {
        mockMvc.perform(asAdmin(post("/api/admin/auth/login"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());

        assertThat(FakePublicWeb.next(WAIT_MILLIS)).isNull();
    }

    @Test
    void shouldStillSave_whenPublicWebFails() throws Exception {
        FakePublicWeb.answerWith(500);

        mockMvc.perform(asAdmin(put("/api/admin/pages/now"), PAGE)).andExpect(status().isOk());

        assertThat(FakePublicWeb.next(WAIT_MILLIS)).isNotNull();
        mockMvc.perform(get("/api/public/pages/now")).andExpect(status().isOk());
    }
}
