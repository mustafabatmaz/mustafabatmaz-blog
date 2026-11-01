package com.mustafabatmaz.blog.media.config;

import com.mustafabatmaz.blog.media.service.MediaDimensionsBackfill;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(MediaProperties.class)
class MediaConfig {

    // Its own bean, calling the service from outside: a runner inside the service would call its own
    // @Transactional method past the proxy, without a transaction, and nothing would be saved
    @Bean
    ApplicationRunner mediaSizesAtStartup(MediaDimensionsBackfill backfill) {
        return args -> backfill.fillMissing();
    }
}
