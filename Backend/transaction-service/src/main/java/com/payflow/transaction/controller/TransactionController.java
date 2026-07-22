package com.payflow.transaction.controller;

import com.payflow.transaction.dto.TransferRequest;
import com.payflow.transaction.model.Transaction;
import com.payflow.transaction.security.UserPrincipal;
import com.payflow.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import com.payflow.transaction.client.AuthClient;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;
    private final AuthClient authClient;

    @PostMapping
    public ResponseEntity<?> transferMoney(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TransferRequest request) {
        
        log.info("Money transfer request by: {} to: {}, amount: {}", 
                principal.getUsername(), request.getToUsername(), request.getAmount());

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Transfer amount must be greater than zero");
        }

        if (principal.getUsername().equals(request.getToUsername())) {
            return ResponseEntity.badRequest().body("Cannot transfer money to yourself");
        }

        if (request.getTransactionPin() == null || request.getTransactionPin().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Transaction PIN is required");
        }

        try {
            Boolean isPinValid = authClient.verifyPin(principal.getUsername(), request.getTransactionPin().trim()).getBody();
            if (isPinValid == null || !isPinValid) {
                return ResponseEntity.badRequest().body("Invalid transaction PIN");
            }
        } catch (Exception e) {
            log.error("Failed to verify transaction PIN with auth-service", e);
            return ResponseEntity.internalServerError().body("Error validating transaction PIN. Please try again.");
        }

        try {
            Transaction transaction = transactionService.createTransaction(
                    principal.getId(),
                    principal.getUsername(),
                    request.getToUsername(),
                    request.getAmount()
            );
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            log.error("Failed to initiate transfer", e);
            return ResponseEntity.badRequest().body("Failed to initiate transfer: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getTransactionHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Fetching transaction history for user: {}", principal.getUsername());
        List<Transaction> history = transactionService.getTransactionHistory(principal.getUsername());
        return ResponseEntity.ok(history);
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> depositMoney(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam BigDecimal amount) {
        
        log.info("Deposit transaction by: {}, amount: {}", principal.getUsername(), amount);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Deposit amount must be greater than zero");
        }

        try {
            Transaction transaction = transactionService.createDepositTransaction(
                    principal.getId(),
                    principal.getUsername(),
                    amount
            );
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            log.error("Failed to record deposit transaction", e);
            return ResponseEntity.badRequest().body("Failed to record deposit: " + e.getMessage());
        }
    }
}
