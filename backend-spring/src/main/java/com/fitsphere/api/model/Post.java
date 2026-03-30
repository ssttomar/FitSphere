package com.fitsphere.api.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private FitnessUser author;

    @Column(nullable = false)
    private String type; // "activity" or "blog"

    @Column(nullable = false)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String tag;
    private String badge;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String photosJson; // JSON array of data URLs

    @Lob
    @Column(columnDefinition = "TEXT")
    private String prsJson; // JSON array of {exercise, value, unit}

    @Lob
    @Column(columnDefinition = "TEXT")
    private String routeJson; // JSON {distanceKm, elevationM}

    @Column(nullable = false)
    private int likeCount = 0;

    @Column(nullable = false)
    private int commentCount = 0;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public FitnessUser getAuthor() { return author; }
    public void setAuthor(FitnessUser author) { this.author = author; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }
    public String getPhotosJson() { return photosJson; }
    public void setPhotosJson(String photosJson) { this.photosJson = photosJson; }
    public String getPrsJson() { return prsJson; }
    public void setPrsJson(String prsJson) { this.prsJson = prsJson; }
    public String getRouteJson() { return routeJson; }
    public void setRouteJson(String routeJson) { this.routeJson = routeJson; }
    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }
    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }
    public Instant getCreatedAt() { return createdAt; }
}
