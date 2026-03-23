package com.fitsphere.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * SMS sender via Twilio REST API (no SDK dependency required).
 *
 * Configure in application.yml (or environment variables):
 *   twilio:
 *     account-sid: ACxxxxxxxxxx
 *     auth-token: xxxxxxxx
 *     phone-number: +15555550100
 *
 * When not configured → dev mode: OTP is logged to console and returned in the API response.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String fromPhone;

    public boolean isConfigured() {
        return !accountSid.isBlank() && !authToken.isBlank() && !fromPhone.isBlank();
    }

    public void send(String to, String message) {
        if (!isConfigured()) {
            log.info("[SMS DEV] to={} message={}", to, message);
            return;
        }
        try {
            RestTemplate rt = new RestTemplate();
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

            String credentials = accountSid + ":" + authToken;
            String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Authorization", "Basic " + encoded);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("To", to);
            params.add("From", fromPhone);
            params.add("Body", message);

            rt.postForObject(url, new HttpEntity<>(params, headers), String.class);
            log.info("[SMS] sent to {}", to);
        } catch (Exception e) {
            log.error("[SMS] failed to send to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send SMS: " + e.getMessage());
        }
    }
}
