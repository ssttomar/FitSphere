package com.fitsphere.api.repository;

import com.fitsphere.api.model.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface AppNotificationRepository extends JpaRepository<AppNotification, UUID> {

    List<AppNotification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    long countByRecipientIdAndReadFalse(UUID recipientId);

    @Transactional
    @Modifying
    @Query("UPDATE AppNotification n SET n.read = true WHERE n.recipient.id = :userId")
    void markAllReadForUser(@Param("userId") UUID userId);

    @Transactional
    @Modifying
    @Query("DELETE FROM AppNotification n WHERE n.relatedRequestId = :requestId")
    void deleteByRelatedRequestId(@Param("requestId") String requestId);
}
