package com.fitsphere.api.repository;

import com.fitsphere.api.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    @Transactional
    void deleteByUserIdAndPostId(UUID userId, UUID postId);
}
