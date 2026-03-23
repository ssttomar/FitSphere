package com.fitsphere.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email OTP sender via Spring Mail (SMTP).
 *
 * Configure in application.yml (or env vars):
 *   spring:
 *     mail:
 *       host: smtp.gmail.com
 *       port: 587
 *       username: yourapp@gmail.com
 *       password: app-password
 *       properties.mail.smtp.starttls.enable: true
 *
 * When JavaMailSender is not auto-configured (no host set) → dev mode.
 */
@Service
public class EmailOtpService {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpService.class);

    private final JavaMailSender mailSender;
    private final boolean configured;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailOtpService(
            java.util.Optional<JavaMailSender> mailSender,
            @Value("${spring.mail.host:}") String mailHost) {
        this.mailSender = mailSender.orElse(null);
        this.configured = this.mailSender != null && !mailHost.isBlank();
    }

    public boolean isConfigured() {
        return configured;
    }

    public void send(String to, String otp) {
        if (!configured) {
            log.info("[EMAIL DEV] to={} otp={}", to, otp);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail.isBlank() ? "noreply@fitsphere.app" : fromEmail);
            msg.setTo(to);
            msg.setSubject("FitSphere email verification code");
            msg.setText("Your FitSphere verification code is: " + otp + "\n\nThis code expires in 10 minutes.");
            mailSender.send(msg);
            log.info("[EMAIL] OTP sent to {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] failed to send to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}
