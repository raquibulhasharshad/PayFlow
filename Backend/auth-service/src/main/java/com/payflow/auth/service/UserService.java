package com.payflow.auth.service;

import com.payflow.auth.model.User;
import com.payflow.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ResponseEntity<?> getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", user.getId());
                    details.put("username", user.getUsername());
                    details.put("email", user.getEmail());
                    details.put("fullName", user.getFullName());
                    return ResponseEntity.ok(details);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<?> searchUser(String by, String query) {
        log.info("Search request for user by: {} with query: {}", by, query);
        
        List<User> users;
        
        if ("username".equalsIgnoreCase(by)) {
            users = userRepository.findByUsernameContainingIgnoreCaseAndActiveTrue(query.trim());
        } else if ("email".equalsIgnoreCase(by)) {
            users = userRepository.findByEmailContainingIgnoreCaseAndActiveTrue(query.trim());
        } else if ("mobileNumber".equalsIgnoreCase(by) || "mobile".equalsIgnoreCase(by)) {
            users = userRepository.findByMobileNumberContainingAndActiveTrue(query.trim());
        } else if ("fullName".equalsIgnoreCase(by) || "name".equalsIgnoreCase(by)) {
            users = userRepository.findByFullNameContainingIgnoreCaseAndActiveTrue(query.trim());
        } else {
            return ResponseEntity.badRequest().body("Invalid search criteria. Allowed values are: username, email, mobileNumber, fullName");
        }
        
        List<Map<String, Object>> response = users.stream().map(user -> {
            Map<String, Object> details = new HashMap<>();
            details.put("id", user.getId());
            details.put("username", user.getUsername());
            details.put("email", user.getEmail());
            details.put("fullName", user.getFullName());
            details.put("mobileNumber", user.getMobileNumber());
            return details;
        }).toList();
        
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<Boolean> verifyPin(String username, String pin) {
        log.info("Verifying transaction PIN for user: {}", username);
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(false);
        }
        boolean matches = passwordEncoder.matches(pin, userOpt.get().getTransactionPin());
        return ResponseEntity.ok(matches);
    }
}
