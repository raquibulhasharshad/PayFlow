package com.payflow.rewards.controller;

import com.payflow.rewards.model.Reward;
import com.payflow.rewards.model.RewardTransaction;
import com.payflow.rewards.service.RewardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
@Slf4j
public class RewardController {

    private final RewardService rewardService;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Fetching rewards balance for user: {}", username);
        
        try {
            Reward reward = rewardService.getRewardByUsername(username);
            Map<String, Object> response = new HashMap<>();
            response.put("username", reward.getUsername());
            response.put("balance", reward.getBalance());
            response.put("updatedAt", reward.getUpdatedAt());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch rewards balance for user: {}", username, e);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Fetching rewards history for user: {}", username);
        
        try {
            List<RewardTransaction> history = rewardService.getRewardHistory(username);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Failed to fetch rewards history for user: {}", username, e);
            return ResponseEntity.badRequest().body("Failed to fetch rewards history: " + e.getMessage());
        }
    }
}
