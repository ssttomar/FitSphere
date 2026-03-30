package com.fitsphere.api.repository;

import com.fitsphere.api.model.FollowRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FollowRequestRepository extends JpaRepository<FollowRequest, UUID> {

    boolean existsByFromUserIdAndToUserId(UUID fromUserId, UUID toUserId);

    @Transactional
    void deleteByFromUserIdAndToUserId(UUID fromUserId, UUID toUserId);

    List<FollowRequest> findByToUserIdOrderByCreatedAtDesc(UUID toUserId);

    Optional<FollowRequest> findByFromUserIdAndToUserId(UUID fromUserId, UUID toUserId);
}
