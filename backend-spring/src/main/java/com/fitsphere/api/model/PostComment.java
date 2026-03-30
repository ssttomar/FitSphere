package com.fitsphere.api.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "post_comments")
public class PostComment {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private FitnessUser author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private PostComment parentComment;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public FitnessUser getAuthor() { return author; }
    public void setAuthor(FitnessUser author) { this.author = author; }
    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public PostComment getParentComment() { return parentComment; }
    public void setParentComment(PostComment parentComment) { this.parentComment = parentComment; }
    public Instant getCreatedAt() { return createdAt; }
}
