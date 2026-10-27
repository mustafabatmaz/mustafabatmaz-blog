# ---- Stage 1: build with the full JDK and Maven wrapper ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Copy only the build definition first: this layer (and the downloaded
# dependencies) is reused as long as pom.xml does not change.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q package -DskipTests -Dspotless.check.skip=true \
    && java -Djarmode=tools -jar target/blog-api-*.jar extract --layers --launcher --destination extracted

# ---- Stage 2: run with only the JRE ----
FROM eclipse-temurin:21-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --no-create-home app \
    # A new named volume copies this folder's owner, so the app user can write uploads
    && mkdir -p /var/lib/blog/media \
    && chown app:app /var/lib/blog/media
WORKDIR /app

# Spring Boot layers, least to most frequently changing
COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./

USER app
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
