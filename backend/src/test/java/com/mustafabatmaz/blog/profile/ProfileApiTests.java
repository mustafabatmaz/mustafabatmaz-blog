package com.mustafabatmaz.blog.profile;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mustafabatmaz.blog.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class ProfileApiTests extends IntegrationTest {

    private static final String PUBLIC = "/api/public/profile";
    private static final String ADMIN = "/api/admin/profile";

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearProfile() {
        jdbc.execute("TRUNCATE profile CASCADE");
    }

    @Test
    void shouldReturnNotFound_whenProfileWasNeverSaved() throws Exception {
        mockMvc.perform(get(PUBLIC)).andExpect(status().isNotFound());
    }

    @Test
    void shouldCreateProfile_whenAdminSavesItForTheFirstTime() throws Exception {
        mockMvc.perform(asAdmin(put(ADMIN), profileJson(null, bothLanguages(), twoLinks())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Mustafa Batmaz"))
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.translations.length()").value(2));
    }

    @Test
    void shouldReturnTurkish_whenLanguageIsNotGiven() throws Exception {
        saveProfile(bothLanguages());

        mockMvc.perform(get(PUBLIC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lang").value("tr"))
                .andExpect(jsonPath("$.headline").value("Kıdemli Yazılım Geliştirici"));
    }

    @Test
    void shouldReturnRequestedLanguage_whenItExists() throws Exception {
        saveProfile(bothLanguages());

        mockMvc.perform(get(PUBLIC).param("lang", "en"))
                .andExpect(jsonPath("$.lang").value("en"))
                .andExpect(jsonPath("$.headline").value("Senior Software Developer"));
    }

    @Test
    void shouldFallBackToTurkish_whenEnglishIsMissing() throws Exception {
        saveProfile(turkishOnly());

        mockMvc.perform(get(PUBLIC).param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lang").value("tr"));
    }

    @Test
    void shouldReturnBadRequest_whenLanguageIsUnsupported() throws Exception {
        mockMvc.perform(get(PUBLIC).param("lang", "de")).andExpect(status().isBadRequest());
    }

    @Test
    void shouldKeepSocialLinksInGivenOrder() throws Exception {
        saveProfile(bothLanguages());

        mockMvc.perform(get(PUBLIC)).andExpect(jsonPath("$.socialLinks[*].platform", contains("GITHUB", "LINKEDIN")));
    }

    @Test
    void shouldUpdateAndBumpVersion_whenVersionIsCurrent() throws Exception {
        saveProfile(bothLanguages());

        mockMvc.perform(asAdmin(put(ADMIN), profileJson(0L, turkishOnly(), twoLinks())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.translations.length()").value(1));
    }

    @Test
    void shouldRejectUpdate_whenVersionIsStale() throws Exception {
        saveProfile(bothLanguages());
        mockMvc.perform(asAdmin(put(ADMIN), profileJson(0L, bothLanguages(), twoLinks())))
                .andExpect(status().isOk());

        // A second tab still holding version 0
        mockMvc.perform(asAdmin(put(ADMIN), profileJson(0L, turkishOnly(), twoLinks())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void shouldRejectUpdate_whenSameLanguageAppearsTwice() throws Exception {
        String duplicated = "[" + turkish() + "," + turkish() + "]";

        mockMvc.perform(asAdmin(put(ADMIN), profileJson(null, duplicated, twoLinks())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectLink_whenUrlIsNotHttp() throws Exception {
        String links = "[{\"platform\":\"GITHUB\",\"url\":\"javascript:alert(1)\"}]";

        mockMvc.perform(asAdmin(put(ADMIN), profileJson(null, bothLanguages(), links)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldListEducationInGivenOrder_withDegreeInRequestedLanguage() throws Exception {
        saveProfile(bothLanguages(), twoSchools());

        mockMvc.perform(get(PUBLIC).param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.education[*].school", contains("İskenderun Teknik Üniversitesi", "Ankara Lisesi")))
                .andExpect(jsonPath("$.education[0].degree").value("Computer Engineering (BSc)"))
                .andExpect(jsonPath("$.education[0].lang").value("en"))
                .andExpect(jsonPath("$.education[0].startYear").value(2012))
                .andExpect(jsonPath("$.education[0].endYear").value(2016));
    }

    @Test
    void shouldFallBackToOtherLanguage_whenDegreeIsMissingInRequestedOne() throws Exception {
        saveProfile(bothLanguages(), twoSchools());

        mockMvc.perform(get(PUBLIC).param("lang", "en"))
                .andExpect(jsonPath("$.education[1].degree").value("Fen Bilimleri"))
                .andExpect(jsonPath("$.education[1].lang").value("tr"));
    }

    @Test
    void shouldAllowOngoingEducation_withoutEndYear() throws Exception {
        String ongoing = """
                [{"school":"ODTÜ","startYear":2024,
                  "translations":[{"lang":"tr","degree":"Yüksek Lisans"}]}]
                """;
        saveProfile(bothLanguages(), ongoing);

        mockMvc.perform(get(PUBLIC))
                .andExpect(jsonPath("$.education[0].endYear").value(nullValue()));
    }

    @Test
    void shouldReplaceEducation_whenProfileIsSavedAgain() throws Exception {
        saveProfile(bothLanguages(), twoSchools());

        mockMvc.perform(asAdmin(put(ADMIN), profileJson(0L, bothLanguages(), twoLinks(), "[]")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.education.length()").value(0));
        mockMvc.perform(get(PUBLIC)).andExpect(jsonPath("$.education.length()").value(0));
    }

    @Test
    void shouldReturnEducationWithAllLanguages_toTheAdmin() throws Exception {
        saveProfile(bothLanguages(), twoSchools());

        mockMvc.perform(asAdmin(get(ADMIN)))
                .andExpect(jsonPath("$.education[0].translations.length()").value(2))
                .andExpect(jsonPath("$.education[1].endYear").value(2012));
    }

    @Test
    void shouldRejectEducation_whenEndYearIsBeforeStartYear() throws Exception {
        String backwards = """
                [{"school":"ODTÜ","startYear":2016,"endYear":2012,
                  "translations":[{"lang":"tr","degree":"Lisans"}]}]
                """;

        mockMvc.perform(asAdmin(put(ADMIN), profileJson(null, bothLanguages(), twoLinks(), backwards)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectEducation_whenDegreeLanguageAppearsTwice() throws Exception {
        String duplicated = """
                [{"school":"ODTÜ","startYear":2012,"endYear":2016,
                  "translations":[{"lang":"tr","degree":"Lisans"},{"lang":"tr","degree":"Lisans"}]}]
                """;

        mockMvc.perform(asAdmin(put(ADMIN), profileJson(null, bothLanguages(), twoLinks(), duplicated)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRequireAuthentication_forAdminEndpoints() throws Exception {
        mockMvc.perform(get(ADMIN)).andExpect(status().isUnauthorized());
        // With a CSRF token, so the 401 comes from the missing login and not from CSRF
        mockMvc.perform(put(ADMIN)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(profileJson(null, bothLanguages(), twoLinks())))
                .andExpect(status().isUnauthorized());
    }

    private void saveProfile(String translations) throws Exception {
        saveProfile(translations, "[]");
    }

    private void saveProfile(String translations, String education) throws Exception {
        mockMvc.perform(asAdmin(put(ADMIN), profileJson(null, translations, twoLinks(), education)))
                .andExpect(status().isOk());
    }

    private static String profileJson(Long version, String translations, String links) {
        return profileJson(version, translations, links, "[]");
    }

    private static String profileJson(Long version, String translations, String links, String education) {
        return """
                {"fullName":"Mustafa Batmaz","email":"mustafa@example.com","location":"Ankara",
                 "translations":%s,"socialLinks":%s,"education":%s,"version":%s}
                """.formatted(translations, links, education, version);
    }

    private static String bothLanguages() {
        return "[" + turkish() + ","
                + "{\"lang\":\"en\",\"headline\":\"Senior Software Developer\",\"intro\":\"Hello\"}]";
    }

    private static String turkishOnly() {
        return "[" + turkish() + "]";
    }

    private static String turkish() {
        return "{\"lang\":\"tr\",\"headline\":\"Kıdemli Yazılım Geliştirici\",\"intro\":\"Merhaba\"}";
    }

    private static String twoSchools() {
        return """
                [{"school":"İskenderun Teknik Üniversitesi","startYear":2012,"endYear":2016,
                  "translations":[{"lang":"tr","degree":"Bilgisayar Mühendisliği (Lisans)"},
                                  {"lang":"en","degree":"Computer Engineering (BSc)"}]},
                 {"school":"Ankara Lisesi","startYear":2008,"endYear":2012,
                  "translations":[{"lang":"tr","degree":"Fen Bilimleri"}]}]
                """;
    }

    private static String twoLinks() {
        return """
                [{"platform":"GITHUB","url":"https://github.com/mustafabatmaz"},
                 {"platform":"LINKEDIN","url":"https://www.linkedin.com/in/mustafabatmaz"}]
                """;
    }
}
