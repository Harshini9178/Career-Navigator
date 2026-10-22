package com.careernavigator.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.mail.from:Career Navigator <noreply@careernavigator.app>}")
    private String mailFrom;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public static class EmailDeliveryResult {
        private final boolean sent;
        private final String status;
        private final String correlationId;
        private final String devNotice;
        private final String error;

        public EmailDeliveryResult(boolean sent, String status, String correlationId, String devNotice, String error) {
            this.sent = sent;
            this.status = status;
            this.correlationId = correlationId;
            this.devNotice = devNotice;
            this.error = error;
        }

        public boolean isSent() { return sent; }
        public String getStatus() { return status; }
        public String getCorrelationId() { return correlationId; }
        public String getDevNotice() { return devNotice; }
        public String getError() { return error; }
    }

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isConfigured() {
        return mailSender != null && smtpHost != null && !smtpHost.isBlank();
    }

    /**
     * Dispatches verification email containing OTP code and one-click verification link.
     */
    public EmailDeliveryResult sendVerificationEmail(String toEmail, String recipientName, String code, String token) {
        String correlationId = UUID.randomUUID().toString();
        String safeName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Candidate";
        String verificationUrl = frontendUrl + "/verify-email?token=" + token + "&email=" + toEmail;

        String subject = "Verify your Career Navigator account - Verification Code: " + code;
        String htmlContent = buildVerificationEmailHtml(safeName, code, verificationUrl);

        return sendEmailInternal(toEmail, subject, htmlContent, correlationId, "account verification", code);
    }

    /**
     * Dispatches welcome email upon successful verification.
     */
    public EmailDeliveryResult sendWelcomeEmail(String toEmail, String recipientName) {
        String correlationId = UUID.randomUUID().toString();
        String safeName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Candidate";
        String subject = "Welcome to Career Navigator - Your AI Placement Preparation Suite";
        String htmlContent = buildWelcomeEmailHtml(safeName);

        return sendEmailInternal(toEmail, subject, htmlContent, correlationId, "welcome email", null);
    }

    /**
     * Dispatches password reset email.
     */
    public EmailDeliveryResult sendPasswordResetEmail(String toEmail, String recipientName, String otp) {
        String correlationId = UUID.randomUUID().toString();
        String safeName = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Candidate";
        String subject = "Reset your Career Navigator password - OTP: " + otp;
        String htmlContent = buildPasswordResetEmailHtml(safeName, otp);

        return sendEmailInternal(toEmail, subject, htmlContent, correlationId, "password reset", otp);
    }

    private EmailDeliveryResult sendEmailInternal(
            String toEmail,
            String subject,
            String htmlBody,
            String correlationId,
            String emailType,
            String codeForDevLog) {

        logger.info("[EmailService] Initiating dispatch [correlationId={}, type={}, recipient={}]",
                correlationId, emailType, maskEmail(toEmail));

        if (!isConfigured()) {
            String devNotice = "SMTP gateway is unconfigured in this environment (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env or application.properties).";
            logger.info("[EmailService-DevMode] {} For recipient={}, code/link logged safely: {}",
                    devNotice, maskEmail(toEmail), codeForDevLog != null ? codeForDevLog : "[N/A]");
            return new EmailDeliveryResult(
                    false,
                    "DEVELOPMENT_SIMULATED",
                    correlationId,
                    devNotice,
                    null
            );
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(mailFrom));
            helper.setTo(toEmail.trim());
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);

            logger.info("[EmailService] Email successfully accepted by SMTP provider [correlationId={}, recipient={}]",
                    correlationId, maskEmail(toEmail));

            return new EmailDeliveryResult(
                    true,
                    "DELIVERED_TO_GATEWAY",
                    correlationId,
                    "Verification email accepted by SMTP server for delivery.",
                    null
            );
        } catch (Exception ex) {
            String sanitizedError = ex.getClass().getSimpleName() + ": " + ex.getMessage();
            logger.error("[EmailService] SMTP delivery failed [correlationId={}, error={}]",
                    correlationId, sanitizedError);

            return new EmailDeliveryResult(
                    false,
                    "DELIVERY_FAILED",
                    correlationId,
                    "Mail delivery failed at SMTP gateway. Please verify SMTP host and credentials.",
                    sanitizedError
            );
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "unknown";
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "*@" + domain;
        }
        return name.substring(0, 2) + "***@" + domain;
    }

    private String buildVerificationEmailHtml(String name, String code, String verificationUrl) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 24px;'>"
                + "<div style='max-width: 580px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);'>"
                + "<div style='display: flex; align-items: center; margin-bottom: 24px;'>"
                + "<h1 style='color: #38BDF8; font-size: 22px; margin: 0;'>Career Navigator</h1>"
                + "</div>"
                + "<h2 style='color: #F8FAFC; font-size: 18px; margin-top: 0;'>Verify Your Email Address</h2>"
                + "<p style='color: #94A3B8; font-size: 14px; line-height: 1.6;'>Hello <strong>" + escapeHtml(name) + "</strong>,</p>"
                + "<p style='color: #94A3B8; font-size: 14px; line-height: 1.6;'>Thank you for registering on Career Navigator. Please enter the following 6-digit verification code to confirm your email address and activate your account:</p>"
                + "<div style='text-align: center; margin: 28px 0;'>"
                + "<div style='display: inline-block; background-color: #0F172A; border: 2px solid #38BDF8; border-radius: 8px; padding: 14px 28px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #38BDF8; font-family: monospace;'>"
                + code
                + "</div>"
                + "<p style='color: #64748B; font-size: 12px; margin-top: 8px;'>Code expires in 15 minutes. Single use only.</p>"
                + "</div>"
                + "<p style='color: #94A3B8; font-size: 14px; line-height: 1.6;'>Alternatively, click the button below to verify your account automatically:</p>"
                + "<div style='text-align: center; margin: 24px 0;'>"
                + "<a href='" + verificationUrl + "' style='display: inline-block; background-color: #2563EB; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px;'>Verify My Email Address</a>"
                + "</div>"
                + "<hr style='border: none; border-top: 1px solid #334155; margin: 24px 0;' />"
                + "<p style='color: #64748B; font-size: 12px; line-height: 1.5; margin: 0;'>If you did not request this registration, no further action is required; you may safely disregard this message.</p>"
                + "</div>"
                + "</body></html>";
    }

    private String buildWelcomeEmailHtml(String name) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 24px;'>"
                + "<div style='max-width: 580px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);'>"
                + "<h1 style='color: #38BDF8; font-size: 22px; margin: 0 0 16px 0;'>Welcome to Career Navigator!</h1>"
                + "<p style='color: #94A3B8; font-size: 14px; line-height: 1.6;'>Hello <strong>" + escapeHtml(name) + "</strong>,</p>"
                + "<p style='color: #94A3B8; font-size: 14px; line-height: 1.6;'>Your email has been verified and your Career Navigator account is ready. Explore our ATS Resume Analyzer, interactive Mock Interviews, CodeLab, and Placement Analytics.</p>"
                + "<div style='text-align: center; margin: 24px 0;'>"
                + "<a href='" + frontendUrl + "' style='display: inline-block; background-color: #2563EB; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px;'>Launch Career Navigator</a>"
                + "</div>"
                + "</div>"
                + "</body></html>";
    }

    private String buildPasswordResetEmailHtml(String name, String otp) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset='UTF-8'></head>"
                + "<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 24px;'>"
                + "<div style='max-width: 580px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);'>"
                + "<h1 style='color: #F43F5E; font-size: 22px; margin: 0 0 16px 0;'>Reset Your Password</h1>"
                + "<p style='color: #94A3B8; font-size: 14px; line-height: 1.6;'>Hello <strong>" + escapeHtml(name) + "</strong>,</p>"
                + "<p style='color: #94A3B8; font-size: 14px; line-height: 1.6;'>We received a request to reset your password. Use the following OTP code to proceed:</p>"
                + "<div style='text-align: center; margin: 24px 0;'>"
                + "<div style='display: inline-block; background-color: #0F172A; border: 2px solid #F43F5E; border-radius: 8px; padding: 12px 24px; font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #F43F5E; font-family: monospace;'>"
                + otp
                + "</div>"
                + "</div>"
                + "<p style='color: #64748B; font-size: 12px; line-height: 1.5;'>This code will expire in 10 minutes. If you did not request this, please ensure your account is secure.</p>"
                + "</div>"
                + "</body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
