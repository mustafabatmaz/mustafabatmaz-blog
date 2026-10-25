package com.mustafabatmaz.blog.experience;

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

class ExperienceApiTests extends IntegrationTest {

    private static final String PUBLIC = "/api/public/experience";
    private static final String ADMIN = "/api/admin/experiences";

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void clearExperience() {
        jdbc.execute("TRUNCATE experience, technology CASCADE");
    }

    @Test
    void shouldReturnEmptyTimeline_whenNothingWasAdded() throws Exception {
        mockMvc.perform(get(PUBLIC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldListExperiencesNewestFirst_andMarkCurrentRole() throws Exception {
        createExperience("Grey&Rea Technology", "2020-10", "2025-05");
        createExperience("NEG Teknoloji", "2025-06", null);

        mockMvc.perform(get(PUBLIC))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].company", contains("NEG Teknoloji", "Grey&Rea Technology")))
                .andExpect(jsonPath("$[0].current").value(true))
                .andExpect(jsonPath("$[0].startMonth").value("2025-06"))
                .andExpect(jsonPath("$[1].current").value(false))
                .andExpect(jsonPath("$[1].endMonth").value("2025-05"));
    }

    @Test
    void shouldRejectExperience_whenItEndsBeforeItStarts() throws Exception {
        mockMvc.perform(asAdmin(post(ADMIN), experienceJson("NEG Teknoloji", "2025-06", "2025-01", null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldShowProjectsUnderTheirCompany_inAdminOrder() throws Exception {
        long company = createExperience("Grey&Rea Technology", "2020-10", "2025-05");
        createProject(company, "streamlyne-classic", "Streamlyne Classic", null, "Java");
        createProject(company, "boston-college", "Boston College", null, "Oracle");

        mockMvc.perform(get(PUBLIC))
                .andExpect(jsonPath("$[0].projects[*].name", contains("Streamlyne Classic", "Boston College")));
    }

    @Test
    void shouldReturnTechnologiesSortedByName() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        createProject(company, "turkpatent", "TÜRKPATENT", null, "Spring Boot", "Apache Kafka", "Java 21");

        mockMvc.perform(get(PUBLIC))
                .andExpect(
                        jsonPath("$[0].projects[0].technologies", contains("Apache Kafka", "Java 21", "Spring Boot")));
    }

    @Test
    void shouldReuseTechnology_whenNameDiffersOnlyInCase() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        createProject(company, "turkpatent", "TÜRKPATENT", null, "Kafka");
        createProject(company, "other", "Other", null, "kafka");

        mockMvc.perform(asAdmin(get("/api/admin/technologies")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("Kafka")));
    }

    @Test
    void shouldRejectProject_whenSlugIsAlreadyUsed() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        createProject(company, "turkpatent", "TÜRKPATENT", null, "Java");

        mockMvc.perform(asAdmin(
                        post(ADMIN + "/" + company + "/projects"), projectJson("turkpatent", "Again", null, null)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectProject_whenSlugIsNotUrlFriendly() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);

        mockMvc.perform(asAdmin(
                        post(ADMIN + "/" + company + "/projects"),
                        projectJson("Türk Patent", "TÜRKPATENT", null, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnNotFound_whenAddingProjectToUnknownExperience() throws Exception {
        mockMvc.perform(asAdmin(post(ADMIN + "/999999/projects"), projectJson("x", "X", null, null)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldServeCaseStudy_andFlagItInTheTimeline() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        createProject(company, "turkpatent", "TÜRKPATENT", "## Sorun\nKafka event'leri kayboluyordu.", "Kafka");
        createProject(company, "internal-tools", "Internal tools", null, "Java");

        mockMvc.perform(get(PUBLIC))
                .andExpect(jsonPath("$[0].projects[0].hasCaseStudy").value(true))
                .andExpect(jsonPath("$[0].projects[1].hasCaseStudy").value(false));
        mockMvc.perform(get(PUBLIC + "/projects/turkpatent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company").value("NEG Teknoloji"))
                .andExpect(jsonPath("$.caseStudyMd").value("## Sorun\nKafka event'leri kayboluyordu."))
                .andExpect(jsonPath("$.technologies", contains("Kafka")));
    }

    @Test
    void shouldFallBackToTurkishCaseStudy_whenEnglishIsMissing() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        createProject(company, "turkpatent", "TÜRKPATENT", "Türkçe vaka analizi", "Kafka");

        mockMvc.perform(get(PUBLIC + "/projects/turkpatent").param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lang").value("tr"))
                .andExpect(jsonPath("$.availableLanguages", contains("tr")));
    }

    @Test
    void shouldReturnNotFound_whenProjectHasNoCaseStudy() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        createProject(company, "internal-tools", "Internal tools", null, "Java");

        mockMvc.perform(get(PUBLIC + "/projects/internal-tools")).andExpect(status().isNotFound());
        mockMvc.perform(get(PUBLIC + "/projects/does-not-exist")).andExpect(status().isNotFound());
    }

    @Test
    void shouldUpdateProject_andReplaceItsTechnologies() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        long project = createProject(company, "turkpatent", "TÜRKPATENT", null, "Java", "Kafka");

        mockMvc.perform(asAdmin(
                        put("/api/admin/projects/" + project),
                        projectJson("turkpatent", "TÜRKPATENT", null, 0L, "Liquibase")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.technologies", contains("Liquibase")));
    }

    @Test
    void shouldRejectProjectUpdate_whenVersionIsStale() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        long project = createProject(company, "turkpatent", "TÜRKPATENT", null, "Java");

        mockMvc.perform(asAdmin(
                        put("/api/admin/projects/" + project), projectJson("turkpatent", "TÜRKPATENT", null, 4L)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReorderProjects_withinTheirCompany() throws Exception {
        long company = createExperience("Grey&Rea Technology", "2020-10", "2025-05");
        long first = createProject(company, "streamlyne-classic", "Streamlyne Classic", null, "Java");
        long second = createProject(company, "boston-college", "Boston College", null, "Oracle");

        mockMvc.perform(asAdmin(
                        put(ADMIN + "/" + company + "/projects/order"), "{\"ids\":[%d,%d]}".formatted(second, first)))
                .andExpect(status().isOk());

        mockMvc.perform(get(PUBLIC))
                .andExpect(jsonPath("$[0].projects[*].name", contains("Boston College", "Streamlyne Classic")));
    }

    @Test
    void shouldUpdateExperience_whenVersionIsCurrent() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);

        mockMvc.perform(asAdmin(
                        put(ADMIN + "/" + company), experienceJson("NEG Teknoloji A.Ş.", "2025-06", "2026-09", 0L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.company").value("NEG Teknoloji A.Ş."))
                .andExpect(jsonPath("$.endMonth").value("2026-09"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void shouldDeleteExperience_togetherWithItsProjects() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        createProject(company, "turkpatent", "TÜRKPATENT", "Vaka analizi", "Kafka");

        mockMvc.perform(asAdmin(delete(ADMIN + "/" + company))).andExpect(status().isNoContent());

        mockMvc.perform(get(PUBLIC)).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get(PUBLIC + "/projects/turkpatent")).andExpect(status().isNotFound());
    }

    @Test
    void shouldDeleteProject() throws Exception {
        long company = createExperience("NEG Teknoloji", "2025-06", null);
        long project = createProject(company, "turkpatent", "TÜRKPATENT", null, "Kafka");

        mockMvc.perform(asAdmin(delete("/api/admin/projects/" + project))).andExpect(status().isNoContent());

        mockMvc.perform(get(PUBLIC))
                .andExpect(jsonPath("$[0].projects.length()").value(0));
    }

    @Test
    void shouldRequireAuthentication_forAdminEndpoints() throws Exception {
        mockMvc.perform(get(ADMIN)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/technologies")).andExpect(status().isUnauthorized());
    }

    private long createExperience(String company, String start, String end) throws Exception {
        String response = mockMvc.perform(asAdmin(post(ADMIN), experienceJson(company, start, end, null)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private long createProject(long experienceId, String slug, String name, String caseStudy, String... tech)
            throws Exception {
        String response = mockMvc.perform(asAdmin(
                        post(ADMIN + "/" + experienceId + "/projects"), projectJson(slug, name, caseStudy, null, tech)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private static String experienceJson(String company, String start, String end, Long version) {
        return """
                {"company":"%s","startMonth":"%s","endMonth":%s,
                 "translations":[{"lang":"tr","roleTitle":"Senior Software Developer","summary":"Özet"}],
                 "version":%s}
                """.formatted(company, start, end == null ? "null" : "\"" + end + "\"", version);
    }

    private static String projectJson(String slug, String name, String caseStudy, Long version, String... tech) {
        String technologies = String.join(
                ",", java.util.Arrays.stream(tech).map(t -> "\"" + t + "\"").toList());
        String caseStudyJson = caseStudy == null ? "null" : "\"" + caseStudy.replace("\n", "\\n") + "\"";
        return """
                {"slug":"%s",
                 "translations":[{"lang":"tr","name":"%s","client":"Müşteri","description":"Açıklama",
                                  "highlightsMd":"- Madde","caseStudyMd":%s}],
                 "technologies":[%s],"version":%s}
                """.formatted(slug, name, caseStudyJson, technologies, version);
    }
}
