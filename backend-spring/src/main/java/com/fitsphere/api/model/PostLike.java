package com.fitsphere.api.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "post_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "post_id"}))
public class PostLike {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private FitnessUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public FitnessUser getUser() { return user; }
    public void setUser(FitnessUser user) { this.user = user; }
    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }
    public Instant getCreatedAt() { return createdAt; }
}
