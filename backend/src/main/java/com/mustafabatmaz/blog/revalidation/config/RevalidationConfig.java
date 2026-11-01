package com.mustafabatmaz.blog.revalidation.config;

import com.mustafabatmaz.blog.revalidation.service.PublicSiteRevalidator;
import com.mustafabatmaz.blog.revalidation.web.RevalidationInterceptor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(RevalidationProperties.class)
class RevalidationConfig implements WebMvcConfigurer {

    private final PublicSiteRevalidator revalidator;
    private final TaskExecutor executor;

    // Boot's own executor (applicationTaskExecutor); named because it isn't the only TaskExecutor bean type
    RevalidationConfig(PublicSiteRevalidator revalidator, @Qualifier("applicationTaskExecutor") TaskExecutor executor) {
        this.revalidator = revalidator;
        this.executor = executor;
    }

    // Login and logout are writes too, but they change no content
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RevalidationInterceptor(revalidator, executor))
                .addPathPatterns("/api/admin/**")
                .excludePathPatterns("/api/admin/auth/**");
    }
}
