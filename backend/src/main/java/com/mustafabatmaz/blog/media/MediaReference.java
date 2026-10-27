package com.mustafabatmaz.blog.media;

import com.mustafabatmaz.blog.common.Language;
import java.util.Map;

/**
 * @param url relative path the image is served from
 * @param altTexts may be missing for one or both languages
 */
public record MediaReference(long id, String url, Map<Language, String> altTexts) {

    /** Alt text in the requested language, else in the other one, else empty (decorative). */
    public String altText(Language requested) {
        String text = altTexts.get(requested);
        if (text == null) {
            text = altTexts.get(requested.other());
        }
        return text == null ? "" : text;
    }
}
