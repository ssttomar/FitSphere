package com.fitsphere.api.repository;

import com.fitsphere.api.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("SELECT p FROM Post p WHERE p.author.id IN " +
           "(SELECT f.following.id FROM Follow f WHERE f.follower.id = :userId) " +
           "OR p.author.id = :userId ORDER BY p.createdAt DESC")
    List<Post> findFeedForUser(@Param("userId") UUID userId);

    List<Post> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
}
