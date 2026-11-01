package com.mustafabatmaz.blog.revalidation.service;

import com.mustafabatmaz.blog.revalidation.config.RevalidationProperties;
import java.net.http.HttpClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Tells public-web that content changed, so its cached pages are rebuilt on their next visit instead of
 * within a minute (6a). The whole site is refreshed, so the request carries no body (6a decision 1).
 */
@Slf4j
@Service
public class PublicSiteRevalidator {

    private final RevalidationProperties properties;
    private final RestClient restClient;

    public PublicSiteRevalidator(RevalidationProperties properties) {
        this.properties = properties;
        // HTTP/1.1: by default the JDK client asks plain-http servers to upgrade to HTTP/2 (h2c), and Next's Node
        // server answers that request with nothing ("header parser received no bytes")
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(properties.timeout())
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.timeout());
        this.restClient = RestClient.builder()
                .baseUrl(properties.url().toString())
                .requestFactory(requestFactory)
                .build();
        if (!properties.enabled()) {
            log.info("On-demand revalidation is off (REVALIDATE_SECRET not set); public pages refresh within a minute");
        }
    }

    public boolean enabled() {
        return properties.enabled();
    }

    /**
     * Never throws: the change is already saved, and public-web catches up within a minute anyway. The secret
     * stays out of the log.
     */
    public void revalidate() {
        try {
            restClient
                    .post()
                    .uri("/api/revalidate")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.secret())
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Could not ask public-web at {} to revalidate: {}", properties.url(), ex.getMessage());
        }
    }
}
