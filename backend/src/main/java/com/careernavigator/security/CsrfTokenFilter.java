package com.careernavigator.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Set;

@Component
public class CsrfTokenFilter extends OncePerRequestFilter {

    private final SecureRandom secureRandom = new SecureRandom();

    private static final Set<String> EXEMPT_PATHS = Set.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/demo",
            "/api/auth/demo-login",
            "/api/auth/logout",
            "/api/auth/send-otp",
            "/api/auth/verify-otp",
            "/api/auth/verify-email",
            "/api/auth/resend-verification",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/url",
            "/auth/callback",
            "/api/health",
            "/health",
            "/api/ai/status",
            "/api/ai/quick-ask"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String csrfCookie = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("csrf-token".equals(c.getName())) {
                    csrfCookie = c.getValue();
                    break;
                }
            }
        }

        // Auto-generate CSRF cookie if absent
        if (csrfCookie == null || csrfCookie.isBlank()) {
            byte[] bytes = new byte[24];
            secureRandom.nextBytes(bytes);
            csrfCookie = HexFormat.of().formatHex(bytes);

            Cookie newCookie = new Cookie("csrf-token", csrfCookie);
            newCookie.setPath("/");
            newCookie.setMaxAge(30 * 24 * 3600);
            newCookie.setHttpOnly(false); // Accessible to JavaScript client
            response.addCookie(newCookie);
        }

        String path = request.getRequestURI();
        String method = request.getMethod().toUpperCase();

        if (isStateChanging(method) && path.startsWith("/api/")) {
            if (!isExempt(path)) {
                String csrfHeader = request.getHeader("X-CSRF-Token");
                if (csrfHeader == null || !csrfHeader.equals(csrfCookie)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Forbidden: Invalid or missing CSRF token\",\"code\":\"CSRF_VALIDATION_FAILED\"}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isStateChanging(String method) {
        return "POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method) || "PATCH".equals(method);
    }

    private boolean isExempt(String path) {
        if (EXEMPT_PATHS.contains(path)) return true;
        for (String exempt : EXEMPT_PATHS) {
            if (path.endsWith(exempt)) return true;
        }
        return false;
    }
}
