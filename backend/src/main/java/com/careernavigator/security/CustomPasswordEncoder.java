package com.careernavigator.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.util.HexFormat;

@Component
public class CustomPasswordEncoder implements PasswordEncoder {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return bcrypt.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }

        String raw = rawPassword.toString();

        // 1. Check BCrypt
        if (encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$") || encodedPassword.startsWith("$2y$")) {
            return bcrypt.matches(rawPassword, encodedPassword);
        }

        // 2. Check Salt:Hash format (Node.js scrypt / PBKDF2 format)
        if (encodedPassword.contains(":")) {
            String[] parts = encodedPassword.split(":", 2);
            if (parts.length == 2) {
                String saltHex = parts[0];
                String hashHex = parts[1];

                if (verifyScryptOrPbkdf2(raw, saltHex, hashHex)) {
                    return true;
                }
            }
        }

        // 3. Timing-safe plaintext fallback for legacy test data
        byte[] a = raw.getBytes();
        byte[] b = encodedPassword.getBytes();
        if (a.length != b.length) {
            return false;
        }
        return MessageDigest.isEqual(a, b);
    }

    private boolean verifyScryptOrPbkdf2(String raw, String saltHex, String hashHex) {
        try {
            byte[] salt = HexFormat.of().parseHex(saltHex);
            byte[] expectedHash = HexFormat.of().parseHex(hashHex);

            // PBKDF2WithHmacSHA256 simulation or check length
            int keyLength = expectedHash.length * 8;
            PBEKeySpec spec = new PBEKeySpec(raw.toCharArray(), salt, 16384, keyLength);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] testHash = skf.generateSecret(spec).getEncoded();

            if (MessageDigest.isEqual(testHash, expectedHash)) {
                return true;
            }
        } catch (Exception ignored) {
        }
        return false;
    }
}
