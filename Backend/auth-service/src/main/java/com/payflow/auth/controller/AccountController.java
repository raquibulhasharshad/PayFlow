package com.payflow.auth.controller;

import com.payflow.auth.dto.DeactivateRequest;
import com.payflow.auth.dto.ReactivateRequest;
import com.payflow.auth.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/deactivate")
    public ResponseEntity<?> deactivateAccount(@RequestBody DeactivateRequest request) {
        return accountService.deactivateAccount(request);
    }

    @PostMapping("/reactivate")
    public ResponseEntity<?> reactivateAccount(@RequestBody ReactivateRequest request) {
        return accountService.reactivateAccount(request);
    }
}
