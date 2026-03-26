package com.fitsphere.api.controller;

import com.fitsphere.api.model.FitnessUser;
import com.fitsphere.api.model.Follow;
import com.fitsphere.api.repository.FitnessUserRepository;
import com.fitsphere.api.repository.FollowRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final FitnessUserRepository userRepository;
    private final FollowRepository followRepository;

    public UserController(FitnessUserRepository userRepository, FollowRepository followRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }

    // ── Search ────────────────────────────────────────────────────────────────

    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam String q) {
        if (q == null || q.isBlank() || q.length() < 2) return List.of();
        return userRepository.searchByUsernameOrDisplayName(q.trim())
                .stream().limit(20).map(this::toSummary).toList();
    }

    // ── Public profile ────────────────────────────────────────────────────────

    @GetMapping("/{targetId}/profile")
    public ResponseEntity<Map<String, Object>> getPublicProfile(
            @PathVariable UUID targetId,
            @AuthenticationPrincipal String subject) {

        FitnessUser target = userRepository.findById(targetId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        FitnessUser me = resolveUser(subject);

        boolean isFollowing = me != null &&
                followRepository.existsByFollowerIdAndFollowingId(me.getId(), targetId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", target.getId().toString());
        result.put("username", target.getUsername() != null ? target.getUsername() : "");
        result.put("displayName", target.getDisplayName());
        result.put("profileImageDataUrl", target.getProfileImageDataUrl() != null ? target.getProfileImageDataUrl() : "");
        result.put("coverImageDataUrl", target.getCoverImageDataUrl() != null ? target.getCoverImageDataUrl() : "");
        result.put("experienceLevel", target.getExperienceLevel() != null ? target.getExperienceLevel() : "");
        result.put("preferredCategory", target.getPreferredCategory() != null ? target.getPreferredCategory() : "");
        result.put("fitnessGoal", target.getFitnessGoal() != null ? target.getFitnessGoal() : "");
        result.put("notes", target.getNotes() != null ? target.getNotes() : "");
        result.put("followerCount", followRepository.countByFollowingId(targetId));
        result.put("followingCount", followRepository.countByFollowerId(targetId));
        result.put("isFollowing", isFollowing);
        result.put("isSelf", me != null && me.getId().equals(targetId));
        return ResponseEntity.ok(result);
    }

    // ── Follow / Unfollow ─────────────────────────────────────────────────────

    @PostMapping("/{targetId}/follow")
    public ResponseEntity<Map<String, Object>> follow(
            @PathVariable UUID targetId,
            @AuthenticationPrincipal String subject) {
        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();
        if (me.getId().equals(targetId)) return ResponseEntity.badRequest().build();

        FitnessUser target = userRepository.findById(targetId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (!followRepository.existsByFollowerIdAndFollowingId(me.getId(), targetId)) {
            Follow follow = new Follow();
            follow.setFollower(me);
            follow.setFollowing(target);
            followRepository.save(follow);
        }

        return ResponseEntity.ok(Map.of(
                "followerCount", followRepository.countByFollowingId(targetId),
                "isFollowing", true));
    }

    @DeleteMapping("/{targetId}/follow")
    public ResponseEntity<Map<String, Object>> unfollow(
            @PathVariable UUID targetId,
            @AuthenticationPrincipal String subject) {
        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        followRepository.deleteByFollowerIdAndFollowingId(me.getId(), targetId);

        return ResponseEntity.ok(Map.of(
                "followerCount", followRepository.countByFollowingId(targetId),
                "isFollowing", false));
    }

    // ── Followers / Following lists ───────────────────────────────────────────

    @GetMapping("/{targetId}/followers")
    public ResponseEntity<List<Map<String, Object>>> getFollowers(@PathVariable UUID targetId) {
        return ResponseEntity.ok(
                followRepository.findFollowersByUserId(targetId)
                        .stream().map(f -> toSummary(f.getFollower())).toList());
    }

    @GetMapping("/{targetId}/following")
    public ResponseEntity<List<Map<String, Object>>> getFollowing(@PathVariable UUID targetId) {
        return ResponseEntity.ok(
                followRepository.findFollowingByUserId(targetId)
                        .stream().map(f -> toSummary(f.getFollowing())).toList());
    }

    // ── My counts ─────────────────────────────────────────────────────────────

    @GetMapping("/me/counts")
    public ResponseEntity<Map<String, Object>> myCounts(@AuthenticationPrincipal String subject) {
        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of(
                "followerCount", followRepository.countByFollowingId(me.getId()),
                "followingCount", followRepository.countByFollowerId(me.getId())));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toSummary(FitnessUser u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId().toString());
        m.put("username", u.getUsername() != null ? u.getUsername() : "");
        m.put("displayName", u.getDisplayName() != null ? u.getDisplayName() : "");
        m.put("experienceLevel", u.getExperienceLevel() != null ? u.getExperienceLevel() : "");
        m.put("preferredCategory", u.getPreferredCategory() != null ? u.getPreferredCategory() : "");
        m.put("profileImageDataUrl", u.getProfileImageDataUrl() != null ? u.getProfileImageDataUrl() : "");
        return m;
    }

    private FitnessUser resolveUser(String subject) {
        if (subject == null) return null;
        if (subject.contains("@")) return userRepository.findByEmail(subject).orElse(null);
        if (subject.startsWith("+")) return userRepository.findByPhoneNumber(subject).orElse(null);
        return userRepository.findByGoogleId(subject).orElse(null);
    }
}
