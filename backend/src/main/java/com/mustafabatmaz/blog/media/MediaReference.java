package com.mustafabatmaz.blog.media;

import com.mustafabatmaz.blog.common.Language;
import java.util.Map;
import org.jspecify.annotations.Nullable;

/**
 * @param url relative path the image is served from
 * @param altTexts may be missing for one or both languages
 * @param width as shown, null when unknown (likewise height)
 */
public record MediaReference(
        long id,
        String url,
        Map<Language, String> altTexts,
        @Nullable Integer width,
        @Nullable Integer height) {

    /** Alt text in the requested language, else in the other one, else empty (decorative). */
    public String altText(Language requested) {
        String text = altTexts.get(requested);
        if (text == null) {
            text = altTexts.get(requested.other());
        }
        return text == null ? "" : text;
    }
}
