package com.payflow.auth.controller;

import com.payflow.auth.dto.UpdateProfileRequest;
import com.payflow.auth.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader(value = "Authorization", required = false) String tokenHeader) {
        return profileService.getProfile(tokenHeader);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String tokenHeader,
            @RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(tokenHeader, request);
    }
}
