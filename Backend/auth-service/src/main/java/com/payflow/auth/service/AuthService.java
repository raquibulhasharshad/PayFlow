package com.payflow.auth.service;

import com.payflow.auth.dto.AuthResponse;
import com.payflow.auth.dto.LoginRequest;
import com.payflow.auth.dto.RegisterRequest;
import com.payflow.auth.event.UserCreatedEvent;
import com.payflow.auth.model.User;
import com.payflow.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ResponseEntity<?> register(RegisterRequest request) {
        Optional<User> existingUsername = userRepository.findByUsernameIgnoreCase(request.getUsername());
        if (existingUsername.isPresent()) {
            User existing = existingUsername.get();
            if (!existing.isActive()) {
                return ResponseEntity.badRequest().body("An account with username '" + request.getUsername() + "' is deactivated. You can reactivate your account.");
            }
            return ResponseEntity.badRequest().body("Username is already taken");
        }

        if (request.getPassword() == null || request.getPassword().length() < 8) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters long");
        }

        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        Optional<User> existingEmail = userRepository.findByEmailIgnoreCase(request.getEmail().trim());
        if (existingEmail.isPresent()) {
            User existing = existingEmail.get();
            if (!existing.isActive()) {
                return ResponseEntity.badRequest().body("An account with email '" + request.getEmail() + "' is deactivated. You can reactivate your account.");
            }
            return ResponseEntity.badRequest().body("Email is already taken");
        }

        if (request.getMobileNumber() == null || request.getMobileNumber().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Mobile number is required");
        }
        if (!request.getMobileNumber().trim().matches("\\d{10}")) {
            return ResponseEntity.badRequest().body("Mobile number must be a valid 10-digit number");
        }
        Optional<User> existingMobile = userRepository.findByMobileNumber(request.getMobileNumber().trim());
        if (existingMobile.isPresent()) {
            User existing = existingMobile.get();
            if (!existing.isActive()) {
                return ResponseEntity.badRequest().body("An account with mobile number '" + request.getMobileNumber() + "' is deactivated. You can reactivate your account.");
            }
            return ResponseEntity.badRequest().body("Mobile number is already taken");
        }

        if (request.getTransactionPin() == null || !request.getTransactionPin().trim().matches("\\d{4,6}")) {
            return ResponseEntity.badRequest().body("Transaction PIN must be a 4 to 6 digit number");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .mobileNumber(request.getMobileNumber())
                .transactionPin(passwordEncoder.encode(request.getTransactionPin().trim()))
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());

        // Publish event to Kafka
        UserCreatedEvent event = new UserCreatedEvent(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getMobileNumber()
        );
        try {
            kafkaTemplate.send("user-created", savedUser.getUsername(), event);
            log.info("Published UserCreatedEvent to Kafka for user: {}", savedUser.getUsername());
        } catch (Exception e) {
            log.error("Failed to publish UserCreatedEvent to Kafka", e);
        }

        String token = jwtService.generateToken(savedUser.getUsername(), Map.of("userId", savedUser.getId()));

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .username(savedUser.getUsername())
                .build());
    }

    public ResponseEntity<?> login(LoginRequest request) {
        User user = userRepository.findByUsernameOrMobileNumber(request.getUsername(), request.getUsername())
                .or(() -> userRepository.findByEmailIgnoreCase(request.getUsername().trim()))
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid username or password");
        }

        if (!user.isActive()) {
            return ResponseEntity.badRequest().body("Account is deactivated. You can reactivate your account.");
        }

        String token = jwtService.generateToken(user.getUsername(), Map.of("userId", user.getId()));

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .build());
    }
}
