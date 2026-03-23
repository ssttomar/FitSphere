package com.fitsphere.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * In-memory OTP store with TTL.
 * Also tracks which phones/emails have completed verification (consumed on use).
 *
 * Key conventions:
 *   otp:phone:{phone}      → pending phone OTP
 *   otp:email:{email}      → pending email OTP
 *   verified:phone:{phone} → phone OTP was successfully verified (15 min window to register)
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final long OTP_TTL_SECONDS = 600;       // 10 minutes
    private static final long VERIFIED_TTL_SECONDS = 900;  // 15 minutes

    private final ConcurrentHashMap<String, OtpEntry> store = new ConcurrentHashMap<>();

    /** Generate and store a 6-digit OTP. Returns the OTP string. */
    public String generate(String key) {
        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
        store.put(key, new OtpEntry(otp, Instant.now().plusSeconds(OTP_TTL_SECONDS)));
        log.info("[OTP] key={} otp={}", key, otp);
        return otp;
    }

    /** Verify an OTP. Removes it on success. Returns true if valid. */
    public boolean verify(String key, String otp) {
        OtpEntry entry = store.get(key);
        if (entry == null || entry.expiry().isBefore(Instant.now())) {
            store.remove(key);
            return false;
        }
        if (entry.code().equals(otp)) {
            store.remove(key);
            return true;
        }
        return false;
    }

    /** Mark a subject (phone/email) as verified for up to 15 minutes. */
    public void markVerified(String verifiedKey) {
        store.put(verifiedKey, new OtpEntry("__verified__", Instant.now().plusSeconds(VERIFIED_TTL_SECONDS)));
    }

    /** Check and consume the verified marker (single use). */
    public boolean consumeVerified(String verifiedKey) {
        OtpEntry entry = store.get(verifiedKey);
        if (entry == null || entry.expiry().isBefore(Instant.now())) {
            store.remove(verifiedKey);
            return false;
        }
        store.remove(verifiedKey);
        return true;
    }

    /** Peek without consuming (for multi-step where we verify mid-registration). */
    public boolean isVerified(String verifiedKey) {
        OtpEntry entry = store.get(verifiedKey);
        if (entry == null || entry.expiry().isBefore(Instant.now())) {
            store.remove(verifiedKey);
            return false;
        }
        return "__verified__".equals(entry.code());
    }

    private record OtpEntry(String code, Instant expiry) {}
}
