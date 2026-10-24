package com.mustafabatmaz.blog;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTests {

    private final ApplicationModules modules = ApplicationModules.of(BlogApplication.class);

    @Test
    void shouldRespectModuleBoundaries_whenModulesAreVerified() {
        modules.verify();
    }
}
