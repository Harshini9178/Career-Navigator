package com.careernavigator.controller;

import com.careernavigator.dto.HealthResponse;
import com.careernavigator.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping
public class HealthController {

    private final UserRepository userRepository;

    public HealthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping({"/api/health", "/health"})
    public ResponseEntity<HealthResponse> getHealth() {
        Runtime rt = Runtime.getRuntime();
        long totalMemory = rt.totalMemory();
        long freeMemory = rt.freeMemory();
        long usedMemory = totalMemory - freeMemory;

        Map<String, Object> memory = new LinkedHashMap<>();
        memory.put("usedMb", usedMemory / (1024 * 1024));
        memory.put("totalMb", totalMemory / (1024 * 1024));
        memory.put("maxMb", rt.maxMemory() / (1024 * 1024));

        boolean dbOk = true;
        try {
            userRepository.count();
        } catch (Exception e) {
            dbOk = false;
        }

        HealthResponse response = new HealthResponse(
                dbOk ? "ok" : "degraded",
                "1.0.0",
                Instant.now().toString(),
                dbOk ? "connected" : "error",
                memory
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/monitor")
    public ResponseEntity<Map<String, Object>> getMonitor() {
        Runtime rt = Runtime.getRuntime();
        Map<String, Object> monitor = new LinkedHashMap<>();
        monitor.put("status", "healthy");
        monitor.put("uptimeSeconds", ManagementFactoryUptime.getUptimeSeconds());
        monitor.put("activeThreads", Thread.activeCount());
        monitor.put("totalMemoryMb", rt.totalMemory() / (1024 * 1024));
        monitor.put("freeMemoryMb", rt.freeMemory() / (1024 * 1024));
        return ResponseEntity.ok(monitor);
    }

    private static class ManagementFactoryUptime {
        static long getUptimeSeconds() {
            return java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        }
    }
}
