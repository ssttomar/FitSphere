package com.fitsphere.api.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_notifications")
public class AppNotification {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private FitnessUser recipient;

    // "like", "comment", "follow_request", "follow_accepted"
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String message;

    private String fromUserId;
    private String fromUserName;
    private String relatedPostId;
    private String relatedRequestId;

    @Column(nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public FitnessUser getRecipient() { return recipient; }
    public void setRecipient(FitnessUser recipient) { this.recipient = recipient; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getFromUserId() { return fromUserId; }
    public void setFromUserId(String fromUserId) { this.fromUserId = fromUserId; }
    public String getFromUserName() { return fromUserName; }
    public void setFromUserName(String fromUserName) { this.fromUserName = fromUserName; }
    public String getRelatedPostId() { return relatedPostId; }
    public void setRelatedPostId(String relatedPostId) { this.relatedPostId = relatedPostId; }
    public String getRelatedRequestId() { return relatedRequestId; }
    public void setRelatedRequestId(String relatedRequestId) { this.relatedRequestId = relatedRequestId; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public Instant getCreatedAt() { return createdAt; }
}
