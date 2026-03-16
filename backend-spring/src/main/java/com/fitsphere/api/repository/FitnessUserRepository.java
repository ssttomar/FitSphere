package com.fitsphere.api.repository;

import com.fitsphere.api.model.FitnessUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FitnessUserRepository extends JpaRepository<FitnessUser, UUID> {

    Optional<FitnessUser> findByEmail(String email);

    boolean existsByEmail(String email);
}
