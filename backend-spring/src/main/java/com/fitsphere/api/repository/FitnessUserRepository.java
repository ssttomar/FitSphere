package com.fitsphere.api.repository;

import com.fitsphere.api.model.FitnessUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FitnessUserRepository extends JpaRepository<FitnessUser, UUID> {

    Optional<FitnessUser> findByEmail(String email);
    Optional<FitnessUser> findByUsername(String username);
    Optional<FitnessUser> findByPhoneNumber(String phoneNumber);
    Optional<FitnessUser> findByGoogleId(String googleId);
    Optional<FitnessUser> findByPasswordResetToken(String passwordResetToken);

    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByPhoneNumber(String phoneNumber);

    @Query("""
        SELECT u FROM FitnessUser u
        WHERE (
            u.username IS NOT NULL AND (
                LOWER(u.username) LIKE LOWER(CONCAT('%', :qRaw, '%'))
                OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(u.username, '_', ''), '.', ''), '-', ''), ' ', ''))
                   LIKE LOWER(CONCAT('%', :qCompact, '%'))
            )
        )
        OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :qSpaced, '%'))
        OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(u.displayName, '_', ''), '.', ''), '-', ''), ' ', ''))
           LIKE LOWER(CONCAT('%', :qCompact, '%'))
        OR (u.email IS NOT NULL AND LOWER(u.email) LIKE LOWER(CONCAT('%', :qRaw, '%')))
        """)
    List<FitnessUser> searchByUsernameOrDisplayNameFlexible(
            @Param("qRaw") String qRaw,
            @Param("qSpaced") String qSpaced,
            @Param("qCompact") String qCompact);

    @Query("""
        SELECT u FROM FitnessUser u
        WHERE u.username IS NOT NULL
          AND LOWER(REPLACE(REPLACE(REPLACE(REPLACE(u.username, '_', ''), '.', ''), '-', ''), ' ', '')) = LOWER(:qCompact)
        """)
    List<FitnessUser> findByUsernameCompact(@Param("qCompact") String qCompact);

    Optional<FitnessUser> findByUsernameIgnoreCase(String username);

    @Query("SELECT u FROM FitnessUser u WHERE u.id <> :excludeId ORDER BY u.createdAt DESC")
    List<FitnessUser> findSuggestedUsersExcluding(@Param("excludeId") UUID excludeId, org.springframework.data.domain.Pageable pageable);
}
