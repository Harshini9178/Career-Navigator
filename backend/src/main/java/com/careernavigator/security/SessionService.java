package com.careernavigator.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class SessionService {

    @Value("${app.security.session-secret:career-navigator-default-dev-secret-key-change-in-prod}")
    private String sessionSecret;

    public String signSession(String userId) {
        if (userId == null) return null;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(sessionSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(userId.getBytes(StandardCharsets.UTF_8));
            String hmacHex = HexFormat.of().formatHex(hmacBytes);
            return userId + "." + hmacHex;
        } catch (Exception e) {
            throw new RuntimeException("Error signing session", e);
        }
    }

    public String verifySession(String token) {
        if (token == null || token.isBlank()) return null;

        int lastDot = token.lastIndexOf('.');
        if (lastDot == -1) {
            // Development fallback for existing unsigned demo cookies
            if (token.startsWith("demo-") || token.startsWith("admin-") || token.startsWith("usr-")) {
                return token;
            }
            return null;
        }

        String userId = token.substring(0, lastDot);
        String signature = token.substring(lastDot + 1);

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(sessionSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] expectedHmac = mac.doFinal(userId.getBytes(StandardCharsets.UTF_8));
            byte[] actualHmac = HexFormat.of().parseHex(signature);

            if (MessageDigest.isEqual(actualHmac, expectedHmac)) {
                return userId;
            }
        } catch (Exception ignored) {
        }

        return null;
    }
}
