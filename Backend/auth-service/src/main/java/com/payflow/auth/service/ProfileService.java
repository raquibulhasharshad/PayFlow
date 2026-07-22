package com.payflow.auth.service;

import com.payflow.auth.dto.ProfileResponse;
import com.payflow.auth.dto.UpdateProfileRequest;
import com.payflow.auth.model.User;
import com.payflow.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ResponseEntity<?> getProfile(String tokenHeader) {
        log.info("Request to get user profile details");
        try {
            if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
            }
            String token = tokenHeader.substring(7);
            String username = jwtService.extractUsername(token);
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            ProfileResponse profile = ProfileResponse.builder()
                    .username(user.getUsername())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .mobileNumber(user.getMobileNumber())
                    .build();
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Failed to verify user profile token", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }

    public ResponseEntity<?> updateProfile(String tokenHeader, UpdateProfileRequest request) {
        log.info("Request to update user profile details");
        try {
            if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
            }
            String token = tokenHeader.substring(7);
            String username = jwtService.extractUsername(token);
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            User user = userOpt.get();
            
            // Name Update
            if (request.getFullName() != null) {
                if (request.getFullName().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Full name cannot be empty");
                }
                user.setFullName(request.getFullName().trim());
            }
            
            // Email Update
            if (request.getEmail() != null) {
                String newEmail = request.getEmail().trim();
                if (newEmail.isEmpty()) {
                    return ResponseEntity.badRequest().body("Email cannot be empty");
                }
                // Check if email changed and is taken
                if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                    if (userRepository.existsByEmail(newEmail)) {
                        return ResponseEntity.badRequest().body("Email is already taken");
                    }
                }
                user.setEmail(newEmail);
            }
            
            // Mobile Number Update
            if (request.getMobileNumber() != null) {
                String newMobile = request.getMobileNumber().trim();
                if (newMobile.isEmpty()) {
                    return ResponseEntity.badRequest().body("Mobile number cannot be empty");
                }
                if (!newMobile.matches("\\d{10}")) {
                    return ResponseEntity.badRequest().body("Mobile number must be a valid 10-digit number");
                }
                // Check if mobile changed and is taken
                if (!newMobile.equals(user.getMobileNumber())) {
                    if (userRepository.existsByMobileNumber(newMobile)) {
                        return ResponseEntity.badRequest().body("Mobile number is already taken");
                    }
                }
                user.setMobileNumber(newMobile);
            }
            
            // Password Update
            boolean isPasswordChangeRequested = (request.getNewPassword() != null && !request.getNewPassword().isEmpty())
                    || (request.getConfirmNewPassword() != null && !request.getConfirmNewPassword().isEmpty());

            if (isPasswordChangeRequested) {
                if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()
                        || request.getNewPassword() == null || request.getNewPassword().isEmpty()
                        || request.getConfirmNewPassword() == null || request.getConfirmNewPassword().isEmpty()) {
                    return ResponseEntity.badRequest().body("Current password, new password, and confirm password are required to change password");
                }
                
                // Verify current password
                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                    return ResponseEntity.badRequest().body("Current password does not match");
                }
                
                // Validate new password format
                if (request.getNewPassword().length() < 8) {
                    return ResponseEntity.badRequest().body("New password must be at least 8 characters long");
                }
                
                // Verify new password matches confirmation
                if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
                    return ResponseEntity.badRequest().body("New password and confirm password do not match");
                }
                
                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            }
            
            // Transaction PIN Update
            boolean isPinChangeRequested = (request.getNewTransactionPin() != null && !request.getNewTransactionPin().isEmpty())
                    || (request.getConfirmNewTransactionPin() != null && !request.getConfirmNewTransactionPin().isEmpty());

            if (isPinChangeRequested) {
                if (request.getCurrentTransactionPin() == null || request.getCurrentTransactionPin().isEmpty()
                        || request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()
                        || request.getNewTransactionPin() == null || request.getNewTransactionPin().isEmpty()
                        || request.getConfirmNewTransactionPin() == null || request.getConfirmNewTransactionPin().isEmpty()) {
                    return ResponseEntity.badRequest().body("Current account password, current transaction PIN, new transaction PIN, and confirm transaction PIN are required to change PIN");
                }
                
                // Verify current password (account password)
                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                    return ResponseEntity.badRequest().body("Current account password does not match");
                }
                
                // Verify current transaction PIN
                if (!passwordEncoder.matches(request.getCurrentTransactionPin().trim(), user.getTransactionPin())) {
                    return ResponseEntity.badRequest().body("Current transaction PIN does not match");
                }
                
                // Validate new PIN format
                String newPin = request.getNewTransactionPin().trim();
                if (!newPin.matches("\\d{4,6}")) {
                    return ResponseEntity.badRequest().body("New transaction PIN must be a 4 to 6 digit number");
                }
                
                // Verify new PIN matches confirmation
                if (!newPin.equals(request.getConfirmNewTransactionPin().trim())) {
                    return ResponseEntity.badRequest().body("New transaction PIN and confirm PIN do not match");
                }
                
                user.setTransactionPin(passwordEncoder.encode(newPin));
            }
            
            User updatedUser = userRepository.save(user);
            log.info("Profile updated successfully for user: {}", updatedUser.getUsername());
            
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
        } catch (Exception e) {
            log.error("Failed to update user profile", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }
}
