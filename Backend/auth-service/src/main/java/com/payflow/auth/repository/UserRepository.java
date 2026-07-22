package com.payflow.auth.repository;

import com.payflow.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    List<User> findByUsernameContainingIgnoreCaseAndActiveTrue(String username);
    boolean existsByUsername(String username);
    boolean existsByMobileNumber(String mobileNumber);
    boolean existsByEmail(String email);
    Optional<User> findByUsernameOrMobileNumber(String username, String mobileNumber);
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByEmailContainingIgnoreCaseAndActiveTrue(String email);
    Optional<User> findByMobileNumber(String mobileNumber);
    List<User> findByMobileNumberContainingAndActiveTrue(String mobileNumber);
    List<User> findByFullNameContainingIgnoreCaseAndActiveTrue(String fullName);
}
