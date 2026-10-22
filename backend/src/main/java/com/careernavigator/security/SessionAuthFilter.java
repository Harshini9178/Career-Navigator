package com.careernavigator.security;

import com.careernavigator.entity.UserEntity;
import com.careernavigator.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class SessionAuthFilter extends OncePerRequestFilter {

    private final SessionService sessionService;
    private final UserRepository userRepository;

    public SessionAuthFilter(SessionService sessionService, UserRepository userRepository) {
        this.sessionService = sessionService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String sessionToken = null;

        // 1. Check cookies
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("session".equals(c.getName())) {
                    sessionToken = c.getValue();
                    break;
                }
            }
        }

        // 2. Check Authorization Header fallback
        if (sessionToken == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                sessionToken = authHeader.substring(7);
            }
        }

        if (sessionToken != null) {
            String userId = sessionService.verifySession(sessionToken);
            if (userId != null) {
                Optional<UserEntity> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent()) {
                    UserEntity user = userOpt.get();
                    String role = user.getRole() != null ? user.getRole().toUpperCase() : "STUDENT";
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(user, null, Collections.singletonList(authority));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
