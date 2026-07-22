package com.payflow.auth.controller;

import com.payflow.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping("/users/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username);
    }

    @GetMapping("/users/search")
    public ResponseEntity<?> searchUser(@RequestParam String by, @RequestParam String query) {
        return userService.searchUser(by, query);
    }

    @PostMapping("/users/verify-pin")
    public ResponseEntity<Boolean> verifyPin(@RequestParam String username, @RequestParam String pin) {
        return userService.verifyPin(username, pin);
    }
}
