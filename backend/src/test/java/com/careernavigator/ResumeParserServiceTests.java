package com.careernavigator;

import com.careernavigator.exception.ApiException;
import com.careernavigator.service.ResumeParserService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class ResumeParserServiceTests {

    @Autowired
    private ResumeParserService resumeParserService;

    @Test
    void testExtractTextFromPdf() throws Exception {
        // Test 12: PDF text extraction using Apache PDFBox
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(doc, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                contentStream.newLineAtOffset(100, 700);
                contentStream.showText("Alex Johnson - Software Engineer - Java, Spring Boot, React");
                contentStream.endText();
            }
            doc.save(baos);
        }

        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "alex_resume.pdf", "application/pdf", baos.toByteArray());

        String extracted = resumeParserService.extractText(pdfFile);

        assertThat(extracted).contains("Alex Johnson");
        assertThat(extracted).contains("Software Engineer");
        assertThat(extracted).contains("Spring Boot");
    }

    @Test
    void testExtractTextFromDocx() throws Exception {
        // Test 12: DOCX text extraction using Apache POI
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFParagraph p = doc.createParagraph();
            p.createRun().setText("Candidate Resume: Experienced Full Stack Engineer specializing in TypeScript, React, and Python.");
            doc.write(baos);
        }

        MockMultipartFile docxFile = new MockMultipartFile(
                "file", "resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", baos.toByteArray());

        String extracted = resumeParserService.extractText(docxFile);

        assertThat(extracted).contains("Candidate Resume");
        assertThat(extracted).contains("Full Stack Engineer");
    }

    @Test
    void testScannedPdfWithLowTextThrowsException() throws Exception {
        // Test 18: Scanned PDF detection
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            // Blank page with almost no text
            try (PDPageContentStream contentStream = new PDPageContentStream(doc, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
                contentStream.newLineAtOffset(50, 700);
                contentStream.showText("Hi"); // only 2 chars, below 30 char threshold
                contentStream.endText();
            }
            doc.save(baos);
        }

        MockMultipartFile blankPdf = new MockMultipartFile("file", "scanned.pdf", "application/pdf", baos.toByteArray());

        assertThatThrownBy(() -> resumeParserService.extractText(blankPdf))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Scanned or image-based PDF detected");
    }

    @Test
    void testEmptyFileThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> resumeParserService.extractText(emptyFile))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("No resume file uploaded or file is empty");
    }
}
