package com.fitsphere.api.controller;

import com.fitsphere.api.model.*;
import com.fitsphere.api.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
public class SocialController {

    private final PostRepository postRepository;
    private final PostLikeRepository likeRepository;
    private final PostCommentRepository commentRepository;
    private final PostCommentLikeRepository commentLikeRepository;
    private final AppNotificationRepository notificationRepository;
    private final UserController userController; // reuse resolveUser

    public SocialController(PostRepository postRepository,
                            PostLikeRepository likeRepository,
                            PostCommentRepository commentRepository,
                            PostCommentLikeRepository commentLikeRepository,
                            AppNotificationRepository notificationRepository,
                            UserController userController) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.notificationRepository = notificationRepository;
        this.userController = userController;
    }

    // ── Create Post ───────────────────────────────────────────────────────────

    @PostMapping("/api/posts")
    @Transactional
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        String title = (String) body.getOrDefault("title", "");
        String content = (String) body.getOrDefault("content", "");
        if (title.isBlank() || content.isBlank()) return ResponseEntity.badRequest().build();

        Post post = new Post();
        post.setAuthor(me);
        post.setType((String) body.getOrDefault("type", "activity"));
        post.setTitle(title.trim());
        post.setContent(content.trim());
        post.setTag((String) body.getOrDefault("tag", null));
        post.setBadge((String) body.getOrDefault("badge", null));
        post.setPhotosJson((String) body.getOrDefault("photosJson", null));
        post.setPrsJson((String) body.getOrDefault("prsJson", null));
        post.setRouteJson((String) body.getOrDefault("routeJson", null));

        Post saved = postRepository.save(post);
        return ResponseEntity.ok(toPostMap(saved, me.getId(), false));
    }

    // ── Feed ─────────────────────────────────────────────────────────────────

    @GetMapping("/api/social/feed")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getFeed(
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        List<Post> posts = postRepository.findFeedForUser(me.getId());
        List<Map<String, Object>> result = posts.stream()
                .limit(50)
                .map(p -> toPostMap(p, me.getId(), likeRepository.existsByUserIdAndPostId(me.getId(), p.getId())))
                .toList();

        return ResponseEntity.ok(result);
    }

    // ── Get posts by user ─────────────────────────────────────────────────────

    @GetMapping("/api/users/{userId}/posts")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getUserPosts(
            @PathVariable UUID userId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        UUID myId = me != null ? me.getId() : null;

        List<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> result = posts.stream()
                .map(p -> toPostMap(p, myId, myId != null && likeRepository.existsByUserIdAndPostId(myId, p.getId())))
                .toList();
        return ResponseEntity.ok(result);
    }

    // ── Like / Unlike ─────────────────────────────────────────────────────────

    @PostMapping("/api/posts/{postId}/like")
    @Transactional
    public ResponseEntity<Map<String, Object>> likePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));

        if (!likeRepository.existsByUserIdAndPostId(me.getId(), postId)) {
            PostLike like = new PostLike();
            like.setUser(me);
            like.setPost(post);
            likeRepository.save(like);

            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);

            // Notify post author (if not self-like)
            if (!post.getAuthor().getId().equals(me.getId())) {
                AppNotification notif = new AppNotification();
                notif.setRecipient(post.getAuthor());
                notif.setType("like");
                notif.setMessage(me.getDisplayName() + " liked your post: " + post.getTitle());
                notif.setFromUserId(me.getId().toString());
                notif.setFromUserName(me.getDisplayName());
                notif.setRelatedPostId(postId.toString());
                notificationRepository.save(notif);
            }
        }

        return ResponseEntity.ok(Map.of("likeCount", post.getLikeCount(), "liked", true));
    }

    @DeleteMapping("/api/posts/{postId}/like")
    @Transactional
    public ResponseEntity<Map<String, Object>> unlikePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));

        if (likeRepository.existsByUserIdAndPostId(me.getId(), postId)) {
            likeRepository.deleteByUserIdAndPostId(me.getId(), postId);
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            postRepository.save(post);
        }

        return ResponseEntity.ok(Map.of("likeCount", post.getLikeCount(), "liked", false));
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    @PostMapping("/api/posts/{postId}/comments")
    @Transactional
    public ResponseEntity<Map<String, Object>> addComment(
            @PathVariable UUID postId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        String content = body.getOrDefault("content", "").trim();
        if (content.isBlank()) return ResponseEntity.badRequest().build();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found"));

        PostComment comment = new PostComment();
        comment.setAuthor(me);
        comment.setPost(post);
        comment.setContent(content);
        comment.setParentComment(null);
        PostComment saved = commentRepository.save(comment);

        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        // Notify post author (if not self-comment)
        if (!post.getAuthor().getId().equals(me.getId())) {
            AppNotification notif = new AppNotification();
            notif.setRecipient(post.getAuthor());
            notif.setType("comment");
            notif.setMessage(me.getDisplayName() + " commented on your post: \"" + truncate(content, 40) + "\"");
            notif.setFromUserId(me.getId().toString());
            notif.setFromUserName(me.getDisplayName());
            notif.setRelatedPostId(postId.toString());
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(toCommentMap(saved, me.getId()));
    }

    @PostMapping("/api/comments/{commentId}/replies")
    @Transactional
    public ResponseEntity<Map<String, Object>> addReply(
            @PathVariable UUID commentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        String content = body.getOrDefault("content", "").trim();
        if (content.isBlank()) return ResponseEntity.badRequest().build();

        PostComment parent = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        Post post = parent.getPost();

        PostComment reply = new PostComment();
        reply.setAuthor(me);
        reply.setPost(post);
        reply.setParentComment(parent);
        reply.setContent(content);

        PostComment saved = commentRepository.save(reply);

        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        if (!parent.getAuthor().getId().equals(me.getId())) {
            AppNotification notif = new AppNotification();
            notif.setRecipient(parent.getAuthor());
            notif.setType("comment_reply");
            notif.setMessage(me.getDisplayName() + " replied to your comment");
            notif.setFromUserId(me.getId().toString());
            notif.setFromUserName(me.getDisplayName());
            notif.setRelatedPostId(post.getId().toString());
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(toCommentMap(saved, me.getId()));
    }

    @PostMapping("/api/comments/{commentId}/like")
    @Transactional
    public ResponseEntity<Map<String, Object>> likeComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        PostComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        if (!commentLikeRepository.existsByUserIdAndCommentId(me.getId(), commentId)) {
            PostCommentLike like = new PostCommentLike();
            like.setUser(me);
            like.setComment(comment);
            commentLikeRepository.save(like);

            if (!comment.getAuthor().getId().equals(me.getId())) {
                AppNotification notif = new AppNotification();
                notif.setRecipient(comment.getAuthor());
                notif.setType("comment_like");
                notif.setMessage(me.getDisplayName() + " liked your comment");
                notif.setFromUserId(me.getId().toString());
                notif.setFromUserName(me.getDisplayName());
                notif.setRelatedPostId(comment.getPost().getId().toString());
                notificationRepository.save(notif);
            }
        }

        return ResponseEntity.ok(Map.of(
                "likeCount", commentLikeRepository.countByCommentId(commentId),
                "liked", true));
    }

    @DeleteMapping("/api/comments/{commentId}/like")
    @Transactional
    public ResponseEntity<Map<String, Object>> unlikeComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        commentRepository.findById(commentId)
            .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        if (commentLikeRepository.existsByUserIdAndCommentId(me.getId(), commentId)) {
            commentLikeRepository.deleteByUserIdAndCommentId(me.getId(), commentId);
        }

        return ResponseEntity.ok(Map.of(
                "likeCount", commentLikeRepository.countByCommentId(commentId),
                "liked", false));
    }

    @GetMapping("/api/posts/{postId}/comments")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getComments(
            @PathVariable UUID postId,
            @AuthenticationPrincipal String subject) {
        FitnessUser me = userController.resolveUser(subject);
        UUID viewerId = me != null ? me.getId() : null;

        List<Map<String, Object>> result = commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream().map(c -> toCommentMap(c, viewerId)).toList();
        return ResponseEntity.ok(result);
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    @GetMapping("/api/notifications")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getNotifications(
            @AuthenticationPrincipal String subject) {

        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        List<Map<String, Object>> result = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(me.getId())
                .stream().limit(50)
                .map(this::toNotifMap)
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/notifications/mark-read")
    @Transactional
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal String subject) {
        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();
        notificationRepository.markAllReadForUser(me.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/notifications/unread-count")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> unreadCount(@AuthenticationPrincipal String subject) {
        FitnessUser me = userController.resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of(
                "count", notificationRepository.countByRecipientIdAndReadFalse(me.getId())));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toPostMap(Post p, UUID viewerUserId, boolean liked) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId().toString());
        m.put("authorId", p.getAuthor().getId().toString());
        m.put("author", p.getAuthor().getDisplayName());
        m.put("username", p.getAuthor().getUsername() != null ? p.getAuthor().getUsername() : "");
        m.put("profileImage", p.getAuthor().getProfileImageDataUrl() != null ? p.getAuthor().getProfileImageDataUrl() : null);
        String name = p.getAuthor().getDisplayName();
        String initials = Arrays.stream(name.split(" "))
                .filter(s -> !s.isBlank())
                .map(s -> String.valueOf(s.charAt(0)).toUpperCase())
                .limit(2)
                .reduce("", String::concat);
        m.put("initials", initials.isEmpty() ? "?" : initials);
        m.put("type", p.getType());
        m.put("title", p.getTitle());
        m.put("content", p.getContent());
        m.put("tag", p.getTag());
        m.put("badge", p.getBadge());
        m.put("photosJson", p.getPhotosJson());
        m.put("prsJson", p.getPrsJson());
        m.put("routeJson", p.getRouteJson());
        m.put("likes", p.getLikeCount());
        m.put("comments", p.getCommentCount());
        m.put("liked", liked);
        m.put("time", timeAgo(p.getCreatedAt()));
        m.put("createdAt", p.getCreatedAt().toString());
        return m;
    }

    private Map<String, Object> toCommentMap(PostComment c, UUID viewerUserId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId().toString());
        m.put("authorId", c.getAuthor().getId().toString());
        m.put("author", c.getAuthor().getDisplayName());
        m.put("username", c.getAuthor().getUsername() != null ? c.getAuthor().getUsername() : "");
        m.put("profileImage", c.getAuthor().getProfileImageDataUrl() != null ? c.getAuthor().getProfileImageDataUrl() : null);
        String name = c.getAuthor().getDisplayName();
        String initials = Arrays.stream(name.split(" "))
                .filter(s -> !s.isBlank())
                .map(s -> String.valueOf(s.charAt(0)).toUpperCase())
                .limit(2)
                .reduce("", String::concat);
        m.put("initials", initials.isEmpty() ? "?" : initials);
        m.put("content", c.getContent());
        m.put("parentCommentId", c.getParentComment() != null ? c.getParentComment().getId().toString() : null);
        m.put("likeCount", commentLikeRepository.countByCommentId(c.getId()));
        m.put("liked", viewerUserId != null && commentLikeRepository.existsByUserIdAndCommentId(viewerUserId, c.getId()));
        m.put("replyCount", commentRepository.countByParentCommentId(c.getId()));
        m.put("time", timeAgo(c.getCreatedAt()));
        m.put("createdAt", c.getCreatedAt().toString());
        return m;
    }

    private Map<String, Object> toNotifMap(AppNotification n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.getId().toString());
        m.put("type", n.getType());
        m.put("message", n.getMessage());
        m.put("fromUserId", n.getFromUserId());
        m.put("fromUserName", n.getFromUserName());
        m.put("relatedPostId", n.getRelatedPostId());
        m.put("relatedRequestId", n.getRelatedRequestId());
        m.put("read", n.isRead());
        m.put("time", n.getCreatedAt().toEpochMilli());
        m.put("createdAt", n.getCreatedAt().toString());
        return m;
    }

    private String timeAgo(Instant instant) {
        long seconds = ChronoUnit.SECONDS.between(instant, Instant.now());
        if (seconds < 60) return "Just now";
        if (seconds < 3600) return (seconds / 60) + "m ago";
        if (seconds < 86400) return (seconds / 3600) + "h ago";
        long days = seconds / 86400;
        if (days == 1) return "1d ago";
        if (days < 7) return days + "d ago";
        return DateTimeFormatter.ofPattern("MMM d").withZone(ZoneOffset.UTC).format(instant);
    }

    private String truncate(String s, int maxLen) {
        return s.length() <= maxLen ? s : s.substring(0, maxLen) + "...";
    }
}
