package com.mustafabatmaz.blog.common.web;

import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverter;
import io.swagger.v3.core.converter.ModelConverterContext;
import io.swagger.v3.core.util.Json;
import io.swagger.v3.oas.models.media.JsonSchema;
import io.swagger.v3.oas.models.media.Schema;
import java.lang.reflect.RecordComponent;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

/**
 * Tells the frontend which fields of a DTO can be null. springdoc only marks fields required when they carry
 * {@code @NotNull}/{@code @NotBlank}, so every response field came out optional in the generated types. Here a record
 * component is required unless it is annotated {@link Nullable}; a {@code @Nullable} one stays optional (requests may
 * leave it out) and also accepts null (responses write it as null).
 */
@Component
class RecordNullabilityModelConverter implements ModelConverter {

    private static final String SCHEMA_REF_PREFIX = "#/components/schemas/";

    @Override
    public @Nullable Schema resolve(AnnotatedType type, ModelConverterContext context, Iterator<ModelConverter> chain) {
        Schema<?> schema = chain.hasNext() ? chain.next().resolve(type, context, chain) : null;
        Class<?> rawClass = Json.mapper().constructType(type.getType()).getRawClass();
        if (schema != null && rawClass.isRecord()) {
            Schema<?> model = definedModel(schema, context);
            if (model != null && model.getProperties() != null) {
                describe(model, rawClass.getRecordComponents());
            }
        }
        return schema;
    }

    // Named models come back as a reference; the properties live on the definition
    private static @Nullable Schema<?> definedModel(Schema<?> schema, ModelConverterContext context) {
        String ref = schema.get$ref();
        if (ref == null) {
            return schema;
        }
        return context.getDefinedModels().get(ref.substring(SCHEMA_REF_PREFIX.length()));
    }

    private static void describe(Schema<?> model, RecordComponent[] components) {
        Map<String, Schema> properties = model.getProperties();
        for (RecordComponent component : components) {
            String name = component.getName();
            Schema<?> property = properties.get(name);
            if (property == null) {
                continue;
            }
            // JSpecify's @Nullable is a type-use annotation, so it sits on the component's type
            if (component.getAnnotatedType().isAnnotationPresent(Nullable.class)) {
                properties.put(name, nullable(property));
            } else if (model.getRequired() == null || !model.getRequired().contains(name)) {
                model.addRequiredItem(name);
            }
        }
    }

    // OpenAPI 3.1 writes null as a type; a reference can't carry a second type, so it becomes "reference or null"
    private static Schema<?> nullable(Schema<?> property) {
        if (property.get$ref() != null) {
            return new JsonSchema().oneOf(List.of(property, new JsonSchema().typesItem("null")));
        }
        if (property.getTypes() != null) {
            property.addType("null");
        }
        return property;
    }
}
