package com.fitsphere.api.repository;

import com.fitsphere.api.model.PostCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface PostCommentLikeRepository extends JpaRepository<PostCommentLike, UUID> {

    boolean existsByUserIdAndCommentId(UUID userId, UUID commentId);

    long countByCommentId(UUID commentId);

    @Transactional
    void deleteByUserIdAndCommentId(UUID userId, UUID commentId);
}
