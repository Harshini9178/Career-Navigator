package com.careernavigator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;

@SpringBootApplication
public class CareerNavigatorApplication {

    private static final Logger logger = LoggerFactory.getLogger(CareerNavigatorApplication.class);

    public static void main(String[] args) {
        loadDotEnvFiles();
        SpringApplication.run(CareerNavigatorApplication.class, args);
    }

    /**
     * Discovers and loads environment variables from local .env files into System properties
     * before the Spring Boot application context initializes.
     * Looks in the current working directory, parent directory, and backend folder.
     * Preserves existing OS environment variables and never logs secret values.
     */
    private static void loadDotEnvFiles() {
        List<File> candidates = List.of(
                new File(".env"),
                new File("../.env"),
                new File("backend/.env")
        );

        int loadedCount = 0;
        for (File file : candidates) {
            if (file.exists() && file.isFile() && file.canRead()) {
                logger.info("Reading environment variables from .env file: {}", file.getAbsolutePath());
                try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String val = line.substring(eqIdx + 1).trim();

                            // Strip surrounding quotes if present
                            if ((val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) ||
                                (val.startsWith("'") && val.endsWith("'") && val.length() >= 2)) {
                                val = val.substring(1, val.length() - 1).trim();
                            }

                            // Only populate if not already set in OS environment or system properties
                            if (System.getenv(key) == null && System.getProperty(key) == null) {
                                System.setProperty(key, val);
                                loadedCount++;
                            }
                        }
                    }
                } catch (IOException e) {
                    logger.warn("Could not read .env file {}: {}", file.getPath(), e.getMessage());
                }
            }
        }
        logger.info("Loaded {} environment properties from local .env configuration.", loadedCount);
    }
}
