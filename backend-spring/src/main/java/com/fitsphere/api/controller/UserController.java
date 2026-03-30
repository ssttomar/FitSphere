package com.fitsphere.api.controller;

import com.fitsphere.api.model.AppNotification;
import com.fitsphere.api.model.FitnessUser;
import com.fitsphere.api.model.Follow;
import com.fitsphere.api.model.FollowRequest;
import com.fitsphere.api.repository.AppNotificationRepository;
import com.fitsphere.api.repository.FitnessUserRepository;
import com.fitsphere.api.repository.FollowRepository;
import com.fitsphere.api.repository.FollowRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final FitnessUserRepository userRepository;
    private final FollowRepository followRepository;
    private final FollowRequestRepository followRequestRepository;
    private final AppNotificationRepository notificationRepository;

    public UserController(FitnessUserRepository userRepository,
                          FollowRepository followRepository,
                          FollowRequestRepository followRequestRepository,
                          AppNotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.followRequestRepository = followRequestRepository;
        this.notificationRepository = notificationRepository;
    }

    // ── Search ────────────────────────────────────────────────────────────────

    @GetMapping("/search")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> search(@RequestParam String q,
                                            @AuthenticationPrincipal String subject) {
        if (q == null || q.isBlank()) return List.of();

        String qRaw = q.trim().toLowerCase(Locale.ROOT).replaceFirst("^@", "");
        String qSpaced = qRaw.replaceAll("[._-]+", " ").replaceAll("\\s+", " ").trim();
        String qCompact = compactSearchKey(qRaw);
        String qSpacedForQuery = qSpaced.isBlank() ? qRaw : qSpaced;

        // Keep a short-query guard, but apply it to normalized forms.
        int bestLen = Math.max(qRaw.length(), Math.max(qSpaced.length(), qCompact.length()));
        if (bestLen < 2) return List.of();
        if (qSpacedForQuery.isBlank() && qCompact.isBlank()) return List.of();

        List<FitnessUser> dbResults = new ArrayList<>(
            userRepository.searchByUsernameOrDisplayNameFlexible(qRaw, qSpacedForQuery, qCompact)
                        .stream()
                        .limit(20)
                        .toList());

        // Exact username match as fallback (handles LIKE failures for special chars like _)
        userRepository.findByUsernameIgnoreCase(qRaw).ifPresent(exact -> {
            if (dbResults.stream().noneMatch(u -> u.getId().equals(exact.getId()))) {
                dbResults.add(0, exact);
            }
        });

        // Compact username match fallback (sumit123 should match sumit_123 / sumit.123)
        if (!qCompact.isBlank()) {
            userRepository.findByUsernameCompact(qCompact).forEach(exact -> {
                if (dbResults.stream().noneMatch(u -> u.getId().equals(exact.getId()))) {
                    dbResults.add(0, exact);
                }
            });
        }

        // Include the requesting user if they match and aren't already in the list.
        // Covers cases where their username is null in DB or newly set.
        FitnessUser me = tryResolveUser(subject);
        if (me != null) {
            String meUsername = me.getUsername() != null ? me.getUsername().toLowerCase(Locale.ROOT) : "";
            String meDisplay = me.getDisplayName() != null ? me.getDisplayName().toLowerCase(Locale.ROOT) : "";

            boolean meMatches = meUsername.contains(qRaw)
                    || meDisplay.contains(qSpaced)
                    || compactSearchKey(meUsername).contains(qCompact)
                    || compactSearchKey(meDisplay).contains(qCompact);
            boolean alreadyPresent = dbResults.stream().anyMatch(u -> u.getId().equals(me.getId()));
            if (meMatches && !alreadyPresent) {
                dbResults.add(0, me);
            }
        }

        return dbResults.stream().map(this::toSummary).toList();
    }

    // ── Suggested users ───────────────────────────────────────────────────────

    @GetMapping("/suggested")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSuggestedUsers(@AuthenticationPrincipal String subject) {
        FitnessUser me = resolveUser(subject);
        if (me == null) {
            return userRepository.findAll(PageRequest.of(0, 10)).stream()
                    .map(this::toSummary).toList();
        }
        return userRepository.findSuggestedUsersExcluding(me.getId(), PageRequest.of(0, 10))
                .stream()
                .filter(u -> !followRepository.existsByFollowerIdAndFollowingId(me.getId(), u.getId()))
                .map(this::toSummary)
                .toList();
    }

    // ── Public profile ────────────────────────────────────────────────────────

    @GetMapping("/{targetId}/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPublicProfile(
            @PathVariable UUID targetId,
            @AuthenticationPrincipal String subject) {

        FitnessUser target = userRepository.findById(targetId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        FitnessUser me = resolveUser(subject);

        String followState = "none";
        if (me != null && !me.getId().equals(targetId)) {
            if (followRepository.existsByFollowerIdAndFollowingId(me.getId(), targetId)) {
                followState = "following";
            } else if (followRequestRepository.existsByFromUserIdAndToUserId(me.getId(), targetId)) {
                followState = "requested";
            }
        }

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
        result.put("followState", followState);
        result.put("isFollowing", "following".equals(followState));
        result.put("isSelf", me != null && me.getId().equals(targetId));
        return ResponseEntity.ok(result);
    }

    // ── Follow Request (Send) ─────────────────────────────────────────────────

    @PostMapping("/{targetId}/follow")
    @Transactional
    public ResponseEntity<Map<String, Object>> follow(
            @PathVariable UUID targetId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();
        if (me.getId().equals(targetId)) return ResponseEntity.badRequest().build();

        FitnessUser target = userRepository.findById(targetId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Already following → no-op
        if (followRepository.existsByFollowerIdAndFollowingId(me.getId(), targetId)) {
            return ResponseEntity.ok(Map.of(
                    "followerCount", followRepository.countByFollowingId(targetId),
                    "followState", "following",
                    "isFollowing", true));
        }

        // Already requested → no-op
        if (followRequestRepository.existsByFromUserIdAndToUserId(me.getId(), targetId)) {
            return ResponseEntity.ok(Map.of(
                    "followerCount", followRepository.countByFollowingId(targetId),
                    "followState", "requested",
                    "isFollowing", false));
        }

        // Create follow request
        FollowRequest req = new FollowRequest();
        req.setFromUser(me);
        req.setToUser(target);
        FollowRequest saved = followRequestRepository.save(req);

        // Notify target user
        AppNotification notif = new AppNotification();
        notif.setRecipient(target);
        notif.setType("follow_request");
        notif.setMessage(me.getDisplayName() + " sent you a follow request");
        notif.setFromUserId(me.getId().toString());
        notif.setFromUserName(me.getDisplayName());
        notif.setRelatedRequestId(saved.getId().toString());
        notificationRepository.save(notif);

        return ResponseEntity.ok(Map.of(
                "followerCount", followRepository.countByFollowingId(targetId),
            "followState", "requested",
            "isFollowing", false));
    }

    // ── Unfollow / Cancel Request ─────────────────────────────────────────────

    @DeleteMapping("/{targetId}/follow")
    @Transactional
    public ResponseEntity<Map<String, Object>> unfollow(
            @PathVariable UUID targetId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        // Remove direct follow if exists
        followRepository.deleteByFollowerIdAndFollowingId(me.getId(), targetId);

        // Cancel pending request if exists
        followRequestRepository.deleteByFromUserIdAndToUserId(me.getId(), targetId);

        return ResponseEntity.ok(Map.of(
                "followerCount", followRepository.countByFollowingId(targetId),
            "followState", "none",
            "isFollowing", false));
    }

    // ── My Pending Follow Requests ────────────────────────────────────────────

    @GetMapping("/me/follow-requests")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getMyFollowRequests(
            @AuthenticationPrincipal String subject) {

        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        List<Map<String, Object>> result = followRequestRepository
                .findByToUserIdOrderByCreatedAtDesc(me.getId())
                .stream()
                .map(req -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("requestId", req.getId().toString());
                    m.put("fromUserId", req.getFromUser().getId().toString());
                    m.put("fromUserName", req.getFromUser().getDisplayName());
                    m.put("fromUsername", req.getFromUser().getUsername() != null ? req.getFromUser().getUsername() : "");
                    m.put("fromUserImage", req.getFromUser().getProfileImageDataUrl() != null ? req.getFromUser().getProfileImageDataUrl() : "");
                    m.put("createdAt", req.getCreatedAt().toString());
                    return m;
                })
                .toList();

        return ResponseEntity.ok(result);
    }

    // ── Accept Follow Request ─────────────────────────────────────────────────

    @PostMapping("/me/follow-requests/{requestId}/accept")
    @Transactional
    public ResponseEntity<Void> acceptFollowRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        FollowRequest req = followRequestRepository.findById(requestId).orElse(null);
        if (req == null || !req.getToUser().getId().equals(me.getId())) {
            return ResponseEntity.notFound().build();
        }

        FitnessUser requester = req.getFromUser();

        // Create the Follow relationship
        if (!followRepository.existsByFollowerIdAndFollowingId(requester.getId(), me.getId())) {
            Follow follow = new Follow();
            follow.setFollower(requester);
            follow.setFollowing(me);
            followRepository.save(follow);
        }

        // Delete the request
        followRequestRepository.delete(req);

        // Clean up the original follow_request notification
        notificationRepository.deleteByRelatedRequestId(requestId.toString());

        // Notify requester their request was accepted
        AppNotification notif = new AppNotification();
        notif.setRecipient(requester);
        notif.setType("follow_accepted");
        notif.setMessage(me.getDisplayName() + " accepted your follow request");
        notif.setFromUserId(me.getId().toString());
        notif.setFromUserName(me.getDisplayName());
        notificationRepository.save(notif);

        return ResponseEntity.ok().build();
    }

    // ── Reject Follow Request ─────────────────────────────────────────────────

    @DeleteMapping("/me/follow-requests/{requestId}")
    @Transactional
    public ResponseEntity<Void> rejectFollowRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal String subject) {

        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();

        FollowRequest req = followRequestRepository.findById(requestId).orElse(null);
        if (req != null && req.getToUser().getId().equals(me.getId())) {
            followRequestRepository.delete(req);
            notificationRepository.deleteByRelatedRequestId(requestId.toString());
        }

        return ResponseEntity.ok().build();
    }

    // ── Followers / Following lists ───────────────────────────────────────────

    @GetMapping("/{targetId}/followers")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getFollowers(@PathVariable UUID targetId) {
        return ResponseEntity.ok(
                followRepository.findFollowersByUserId(targetId)
                        .stream().map(f -> toSummary(f.getFollower())).toList());
    }

    @GetMapping("/{targetId}/following")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getFollowing(@PathVariable UUID targetId) {
        return ResponseEntity.ok(
                followRepository.findFollowingByUserId(targetId)
                        .stream().map(f -> toSummary(f.getFollowing())).toList());
    }

    // ── My counts ─────────────────────────────────────────────────────────────

    @GetMapping("/me/counts")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> myCounts(@AuthenticationPrincipal String subject) {
        FitnessUser me = resolveUser(subject);
        if (me == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of(
                "followerCount", followRepository.countByFollowingId(me.getId()),
                "followingCount", followRepository.countByFollowerId(me.getId()),
                "pendingRequests", followRequestRepository.findByToUserIdOrderByCreatedAtDesc(me.getId()).size()));
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

    FitnessUser resolveUser(String subject) {
        if (subject == null) return null;
        if (subject.contains("@")) return userRepository.findByEmail(subject).orElse(null);
        if (subject.startsWith("+")) return userRepository.findByPhoneNumber(subject).orElse(null);
        // Try UUID lookup (in case token subject is user ID)
        try {
            UUID id = UUID.fromString(subject);
            return userRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException ignored) {}
        return userRepository.findByGoogleId(subject).orElse(null);
    }

    private FitnessUser tryResolveUser(String subject) {
        try {
            return resolveUser(subject);
        } catch (Exception ignored) {
            // Search should still work even if principal-to-user resolution fails.
            return null;
        }
    }

    private String compactSearchKey(String value) {
        if (value == null) return "";
        return value.toLowerCase(Locale.ROOT).replaceAll("[\\s._-]+", "");
    }
}
