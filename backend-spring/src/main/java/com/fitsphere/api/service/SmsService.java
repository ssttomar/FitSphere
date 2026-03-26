package com.fitsphere.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * SMS sender via Fast2SMS REST API.
 *
 * Configure in environment variables:
 *   FAST2SMS_API_KEY=your_api_key
 *
 * When not configured → dev mode: OTP is logged to console and returned in the API response.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);
    private static final String FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

    @Value("${fast2sms.api-key:}")
    private String apiKey;

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    public void send(String to, String message) {
        if (!isConfigured()) {
            log.info("[SMS DEV] to={} message={}", to, message);
            return;
        }
        try {
            // Strip country code — Fast2SMS expects 10-digit Indian numbers
            String number = to.startsWith("+91") ? to.substring(3) : to;

            RestTemplate rt = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.set("authorization", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = UriComponentsBuilder.fromUriString(FAST2SMS_URL)
                    .queryParam("route", "q")
                    .queryParam("message", message)
                    .queryParam("numbers", number)
                    .toUriString();

            rt.postForObject(url, new HttpEntity<>(headers), String.class);
            log.info("[SMS] sent to {}", to);
        } catch (Exception e) {
            log.error("[SMS] failed to send to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send SMS: " + e.getMessage());
        }
    }
}
