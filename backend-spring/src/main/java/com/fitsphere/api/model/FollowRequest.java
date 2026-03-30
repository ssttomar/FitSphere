package com.fitsphere.api.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "follow_requests", uniqueConstraints = @UniqueConstraint(columnNames = {"from_user_id", "to_user_id"}))
public class FollowRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private FitnessUser fromUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private FitnessUser toUser;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public FitnessUser getFromUser() { return fromUser; }
    public void setFromUser(FitnessUser fromUser) { this.fromUser = fromUser; }
    public FitnessUser getToUser() { return toUser; }
    public void setToUser(FitnessUser toUser) { this.toUser = toUser; }
    public Instant getCreatedAt() { return createdAt; }
}
