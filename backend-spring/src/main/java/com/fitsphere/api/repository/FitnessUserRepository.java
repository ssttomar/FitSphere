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

    @Query("SELECT u FROM FitnessUser u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.displayName) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<FitnessUser> searchByUsernameOrDisplayName(@Param("q") String q);
}
