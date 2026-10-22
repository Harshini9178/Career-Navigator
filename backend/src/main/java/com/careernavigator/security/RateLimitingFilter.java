package com.careernavigator.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static class RateLimitEntry {
        int count;
        long resetAt;

        RateLimitEntry(int count, long resetAt) {
            this.count = count;
            this.resetAt = resetAt;
        }
    }

    private final Map<String, RateLimitEntry> authLimits = new ConcurrentHashMap<>();
    private final Map<String, RateLimitEntry> aiLimits = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = getClientIp(request);
        long now = System.currentTimeMillis();

        // 1. Auth Rate Limiting (100 req / 60 sec)
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register") || path.startsWith("/api/auth/send-otp")) {
            RateLimitEntry entry = authLimits.compute(ip, (k, v) -> {
                if (v == null || now > v.resetAt) {
                    return new RateLimitEntry(1, now + 60_000);
                }
                v.count++;
                return v;
            });

            if (entry.count > 100) {
                long retryAfter = Math.max(1, (entry.resetAt - now) / 1000);
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests\",\"message\":\"Too many authentication attempts. Please try again in " + retryAfter + " seconds.\"}");
                return;
            }
        }

        // 2. AI / Upload Rate Limiting (30 req / 60 sec)
        if (path.startsWith("/api/resume/upload") || path.startsWith("/api/interview/generate") || path.startsWith("/api/interview/code-review")) {
            RateLimitEntry entry = aiLimits.compute(ip, (k, v) -> {
                if (v == null || now > v.resetAt) {
                    return new RateLimitEntry(1, now + 60_000);
                }
                v.count++;
                return v;
            });

            if (entry.count > 40) {
                long retryAfter = Math.max(1, (entry.resetAt - now) / 1000);
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests\",\"message\":\"Rate limit exceeded for AI operations. Please try again in " + retryAfter + " seconds.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown-ip";
    }
}
