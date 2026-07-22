package com.payflow.auth.service;

import com.payflow.auth.dto.DeactivateRequest;
import com.payflow.auth.dto.ReactivateRequest;
import com.payflow.auth.model.User;
import com.payflow.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ResponseEntity<?> deactivateAccount(DeactivateRequest request) {
        log.info("Request to deactivate account for email: {}", request.getEmail());
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(request.getEmail().trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No account found with this email address");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Incorrect account password");
        }
        user.setActive(false);
        userRepository.save(user);
        log.info("Account deactivated successfully for user: {}", user.getUsername());
        return ResponseEntity.ok(Map.of("message", "Account deactivated successfully"));
    }

    public ResponseEntity<?> reactivateAccount(ReactivateRequest request) {
        log.info("Request to reactivate account for email: {}", request.getEmail());
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().isEmpty() ||
            request.getTransactionPin() == null || request.getTransactionPin().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email, password, and transaction PIN are required");
        }
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(request.getEmail().trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No account found with this email address");
        }
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Incorrect account password");
        }
        if (!passwordEncoder.matches(request.getTransactionPin().trim(), user.getTransactionPin())) {
            return ResponseEntity.badRequest().body("Incorrect transaction PIN");
        }
        user.setActive(true);
        userRepository.save(user);
        log.info("Account reactivated successfully for user: {}", user.getUsername());
        return ResponseEntity.ok(Map.of("message", "Account reactivated successfully. You can now log in."));
    }
}
