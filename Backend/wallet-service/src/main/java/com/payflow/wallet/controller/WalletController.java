package com.payflow.wallet.controller;

import com.payflow.wallet.model.Wallet;
import com.payflow.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
@Slf4j
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Fetching wallet balance for user: {}", username);
        
        try {
            Wallet wallet = walletService.getWalletByUsername(username);
            Map<String, Object> response = new HashMap<>();
            response.put("username", wallet.getUsername());
            response.put("balance", wallet.getBalance());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch balance for user: {}", username, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/credit")
    public ResponseEntity<?> creditWallet(@RequestParam BigDecimal amount) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Request to credit wallet for user: {} with amount: {}", username, amount);

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Credit amount must be greater than zero");
        }

        try {
            Wallet wallet = walletService.creditWallet(username, amount);
            Map<String, Object> response = new HashMap<>();
            response.put("username", wallet.getUsername());
            response.put("creditedAmount", amount);
            response.put("newBalance", wallet.getBalance());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to credit wallet for user: {}", username, e);
            return ResponseEntity.badRequest().body("Failed to credit wallet: " + e.getMessage());
        }
    }
}
