package com.fitsphere.api.repository;

import com.fitsphere.api.model.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {

    List<PostComment> findByPostIdOrderByCreatedAtAsc(UUID postId);

    long countByParentCommentId(UUID parentCommentId);
}
