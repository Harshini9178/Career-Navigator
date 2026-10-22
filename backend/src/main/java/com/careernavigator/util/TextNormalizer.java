package com.careernavigator.util;

public class TextNormalizer {

    public static String normalizeResumeText(String text) {
        if (text == null) return "";

        return text
                // Replace smart quotes and apostrophes
                .replaceAll("[\u2018\u2019\u201A\u201B]", "'")
                .replaceAll("[\u201C\u201D\u201E\u201F]", "\"")
                // Replace em/en dashes and horizontal bars
                .replaceAll("[\u2013\u2014\u2015]", "-")
                // Replace bullets, middots, diamond marks
                .replaceAll("[\u2022\u2023\u25E6\u2043\u2219\u00B7]", " - ")
                // Remove zero-width spaces and soft hyphens
                .replaceAll("[\u200B\u200C\u200D\uFEFF\u00AD]", "")
                // Normalize unicode ligatures: fi, fl, etc.
                .replace("\uFB01", "fi")
                .replace("\uFB02", "fl")
                .replace("\uFB03", "ffi")
                .replace("\uFB04", "ffl")
                // Normalize newlines to \n
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                // Collapse 3+ newlines into double newlines
                .replaceAll("\n{3,}", "\n\n")
                // Collapse multiple horizontal spaces/tabs
                .replaceAll("[ \t]+", " ")
                .trim();
    }

    public static String computeContentHash(String content) {
        if (content == null) return "0";
        long hash = 5381;
        for (int i = 0; i < content.length(); i++) {
            hash = (((hash << 5) + hash) + content.charAt(i)) & 0xFFFFFFFFL;
        }
        return Long.toHexString(hash);
    }
}
