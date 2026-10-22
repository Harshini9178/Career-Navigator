package com.careernavigator.service;

import com.careernavigator.exception.ApiException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class ResumeParserService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeParserService.class);

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("No resume file uploaded or file is empty.", 400);
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt";
        String lowerFilename = originalFilename.toLowerCase();

        try {
            if (lowerFilename.endsWith(".pdf")) {
                return extractPdfText(file.getBytes());
            } else if (lowerFilename.endsWith(".docx")) {
                try (InputStream is = file.getInputStream()) {
                    return extractDocxText(is);
                }
            } else if (lowerFilename.endsWith(".txt")) {
                return new String(file.getBytes(), StandardCharsets.UTF_8).trim();
            } else {
                throw new ApiException("Unsupported file format. Please upload a PDF, DOCX, or TXT file.", 400);
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error extracting text from file {}: {}", originalFilename, e.getMessage(), e);
            throw new ApiException("Corrupted or unreadable resume file: " + e.getMessage(), 400);
        }
    }

    private String extractPdfText(byte[] bytes) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted()) {
                throw new ApiException("Password protected/encrypted PDF documents cannot be analyzed.", 400);
            }

            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            if (text == null || text.trim().length() < 30) {
                throw new ApiException("Scanned or image-based PDF detected with insufficient extractable text. Please upload a text-based resume.", 400);
            }

            return text.trim();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("Failed to parse PDF document. File may be corrupted.", 400);
        }
    }

    private String extractDocxText(InputStream is) {
        try (XWPFDocument doc = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            String text = extractor.getText();
            if (text == null || text.trim().length() < 20) {
                throw new ApiException("DOCX file contains insufficient text for ATS evaluation.", 400);
            }
            return text.trim();
        } catch (Exception e) {
            throw new ApiException("Failed to parse DOCX document. File may be corrupted: " + e.getMessage(), 400);
        }
    }
}
