package com.fitsphere.api.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "post_comment_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "comment_id"}))
public class PostCommentLike {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private FitnessUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private PostComment comment;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public FitnessUser getUser() { return user; }
    public void setUser(FitnessUser user) { this.user = user; }
    public PostComment getComment() { return comment; }
    public void setComment(PostComment comment) { this.comment = comment; }
    public Instant getCreatedAt() { return createdAt; }
}
