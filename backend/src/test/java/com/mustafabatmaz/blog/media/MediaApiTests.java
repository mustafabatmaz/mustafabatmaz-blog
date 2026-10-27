package com.mustafabatmaz.blog.media;

import static com.mustafabatmaz.blog.media.ImageBytes.ascii;
import static com.mustafabatmaz.blog.media.ImageBytes.avif;
import static com.mustafabatmaz.blog.media.ImageBytes.contains;
import static com.mustafabatmaz.blog.media.ImageBytes.exif;
import static com.mustafabatmaz.blog.media.ImageBytes.jfif;
import static com.mustafabatmaz.blog.media.ImageBytes.jpeg;
import static com.mustafabatmaz.blog.media.ImageBytes.png;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.mustafabatmaz.blog.IntegrationTest;
import java.nio.file.Files;
import java.util.Arrays;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

class MediaApiTests extends IntegrationTest {

    private static final String ADMIN = "/api/admin/media";

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearMedia() {
        jdbc.execute("TRUNCATE media CASCADE");
    }

    @Test
    void shouldStoreUpload_andServeItWithSafeHeaders() throws Exception {
        byte[] image = png();
        String url = JsonPath.read(upload("photo.png", "image/png", image), "$.url");

        mockMvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Cache-Control", containsString("immutable")))
                .andExpect(content().bytes(image));
    }

    @Test
    void shouldDecideTypeFromContent_notFromFileNameOrBrowserHeader() throws Exception {
        String response = upload("holiday.png", "image/png", jpeg(jfif()));

        assertThat((String) JsonPath.read(response, "$.format")).isEqualTo("JPEG");
        assertThat((String) JsonPath.read(response, "$.url")).endsWith(".jpg");
    }

    @Test
    void shouldRejectSvg() throws Exception {
        byte[] svg = ascii("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>");

        mockMvc.perform(uploadRequest("logo.svg", "image/svg+xml", svg)).andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void shouldRejectHtml_disguisedAsPng() throws Exception {
        mockMvc.perform(uploadRequest("cat.png", "image/png", ascii("<html><script>alert(1)</script></html>")))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void shouldRejectEmptyFile() throws Exception {
        mockMvc.perform(uploadRequest("empty.png", "image/png", new byte[0])).andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectFile_largerThanFiveMegabytes() throws Exception {
        byte[] tooBig = Arrays.copyOf(png(), 5 * 1024 * 1024 + 1);

        mockMvc.perform(uploadRequest("big.png", "image/png", tooBig)).andExpect(status().isPayloadTooLarge());
    }

    @Test
    void shouldRemoveLocationData_fromUploadedPhotos() throws Exception {
        String response = upload("phone.jpg", "image/jpeg", jpeg(jfif(), exif(1, "GPS:39.92,32.85")));
        String url = JsonPath.read(response, "$.url");

        byte[] served = mockMvc.perform(get(url)).andReturn().getResponse().getContentAsByteArray();

        assertThat((Boolean) JsonPath.read(response, "$.metadataStripped")).isTrue();
        assertThat(contains(served, "GPS:")).isFalse();
    }

    @Test
    void shouldStoreAvifAsIs_andSayItWasNotStripped() throws Exception {
        String response = upload("photo.avif", "image/avif", avif());

        assertThat((Boolean) JsonPath.read(response, "$.metadataStripped")).isFalse();
    }

    @Test
    void shouldSaveAltTexts_givenWithTheUpload() throws Exception {
        mockMvc.perform(uploadRequest("photo.png", "image/png", png())
                        .param("altTr", "Ankara'da bir masa")
                        .param("altEn", "A desk in Ankara"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.translations[*].lang", contains("tr", "en")));
    }

    @Test
    void shouldUpdateAltTexts_whenVersionIsCurrent() throws Exception {
        long id = ((Number) JsonPath.read(upload("photo.png", "image/png", png()), "$.id")).longValue();

        mockMvc.perform(asAdmin(
                        put(ADMIN + "/" + id),
                        "{\"translations\":[{\"lang\":\"en\",\"altText\":\"A desk\"}],\"version\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.translations[0].altText").value("A desk"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void shouldListUploads_newestFirst() throws Exception {
        upload("first.png", "image/png", png());
        upload("second.png", "image/png", png());

        mockMvc.perform(asAdmin(get(ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].originalFilename", contains("second.png", "first.png")));
    }

    @Test
    void shouldKeepOnlyTheFileName_whenBrowserSendsAPath() throws Exception {
        String response = upload("C:\\Users\\mustafa\\Desktop\\photo.png", "image/png", png());

        assertThat((String) JsonPath.read(response, "$.originalFilename")).isEqualTo("photo.png");
    }

    @Test
    void shouldDeleteUpload_togetherWithItsFile() throws Exception {
        String response = upload("photo.png", "image/png", png());
        long id = ((Number) JsonPath.read(response, "$.id")).longValue();
        String url = JsonPath.read(response, "$.url");
        String fileName = url.substring(url.lastIndexOf('/') + 1);

        mockMvc.perform(asAdmin(delete(ADMIN + "/" + id))).andExpect(status().isNoContent());

        mockMvc.perform(get(url)).andExpect(status().isNotFound());
        assertThat(Files.exists(MEDIA_DIR.resolve(fileName))).isFalse();
    }

    @Test
    void shouldReturnNotFound_forUnknownOrMalformedFileNames() throws Exception {
        mockMvc.perform(get("/api/public/media/6f1c2a52-6a4e-4c8a-9a3e-0d5f9b2c7e11.png"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/public/media/passwd")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/public/media/..passwd.png")).andExpect(status().isNotFound());
    }

    @Test
    void shouldServeUrl_underThePublicMediaPath() throws Exception {
        upload("photo.png", "image/png", png());

        mockMvc.perform(asAdmin(get(ADMIN))).andExpect(jsonPath("$[0].url", startsWith("/api/public/media/")));
        mockMvc.perform(asAdmin(get(ADMIN))).andExpect(jsonPath("$[0].url", endsWith(".png")));
    }

    @Test
    void shouldRequireAuthentication_forUploads() throws Exception {
        mockMvc.perform(multipart(ADMIN)
                        .file(new MockMultipartFile("file", "photo.png", "image/png", png()))
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    private String upload(String fileName, String contentType, byte[] bytes) throws Exception {
        return mockMvc.perform(uploadRequest(fileName, contentType, bytes))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private static MockMultipartHttpServletRequestBuilder uploadRequest(
            String fileName, String contentType, byte[] bytes) {
        return asAdmin(multipart(ADMIN).file(new MockMultipartFile("file", fileName, contentType, bytes)));
    }
}
