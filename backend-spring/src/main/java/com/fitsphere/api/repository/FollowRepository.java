package com.fitsphere.api.repository;

import com.fitsphere.api.model.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface FollowRepository extends JpaRepository<Follow, UUID> {

    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    @Transactional
    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    long countByFollowingId(UUID followingId);

    long countByFollowerId(UUID followerId);

    @Query("SELECT f FROM Follow f JOIN FETCH f.follower WHERE f.following.id = :userId")
    List<Follow> findFollowersByUserId(@Param("userId") UUID userId);

    @Query("SELECT f FROM Follow f JOIN FETCH f.following WHERE f.follower.id = :userId")
    List<Follow> findFollowingByUserId(@Param("userId") UUID userId);
}
