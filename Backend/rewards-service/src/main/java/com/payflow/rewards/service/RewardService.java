package com.payflow.rewards.service;

import com.payflow.rewards.event.RewardEarnedEvent;
import com.payflow.rewards.model.Reward;
import com.payflow.rewards.model.RewardTransaction;
import com.payflow.rewards.repository.RewardRepository;
import com.payflow.rewards.repository.RewardTransactionRepository;
import com.payflow.transaction.event.TransactionInitiatedEvent;
import com.payflow.wallet.event.TransactionProcessedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RewardService {

    private final RewardRepository rewardRepository;
    private final RewardTransactionRepository rewardTransactionRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional(readOnly = true)
    public Reward getRewardByUsername(String username) {
        return rewardRepository.findByUsername(username)
                .orElseGet(() -> Reward.builder()
                        .username(username)
                        .userId(0L)
                        .balance(BigDecimal.ZERO)
                        .updatedAt(LocalDateTime.now())
                        .build());
    }

    @Transactional(readOnly = true)
    public List<RewardTransaction> getRewardHistory(String username) {
        return rewardTransactionRepository.findByUsername(username);
    }

    @Transactional
    public void handleTransactionInitiated(TransactionInitiatedEvent event) {
        log.info("Rewards service: processing initiated transaction: {}", event.getTransactionId());
        
        // Check if transaction already processed/initiated
        if (rewardTransactionRepository.findByTransactionId(event.getTransactionId()).isPresent()) {
            log.warn("Reward transaction already initiated or processed for ID: {}", event.getTransactionId());
            return;
        }

        // Calculate reward points (10% of transaction amount)
        BigDecimal pointsEarned = event.getAmount().multiply(new BigDecimal("0.10"));

        RewardTransaction rewardTx = RewardTransaction.builder()
                .userId(event.getFromUserId())
                .username(event.getFromUsername())
                .transactionId(event.getTransactionId())
                .transactionAmount(event.getAmount())
                .pointsEarned(pointsEarned)
                .earnedAt(LocalDateTime.now())
                .build();

        rewardTransactionRepository.save(rewardTx);
        log.info("Saved pending reward transaction for user: {} of points: {}", event.getFromUsername(), pointsEarned);
    }

    @Transactional
    public void handleTransactionProcessed(TransactionProcessedEvent event) {
        log.info("Rewards service: processing transaction status update for ID: {} status: {}", 
                event.getTransactionId(), event.getStatus());

        Optional<RewardTransaction> rewardTxOpt = rewardTransactionRepository.findByTransactionId(event.getTransactionId());
        if (rewardTxOpt.isEmpty()) {
            log.warn("No initiated reward transaction found for ID: {}", event.getTransactionId());
            return;
        }

        RewardTransaction rewardTx = rewardTxOpt.get();

        if ("SUCCESS".equalsIgnoreCase(event.getStatus())) {
            // Update Reward balance for the user
            Reward reward = rewardRepository.findByUsername(rewardTx.getUsername())
                    .orElseGet(() -> Reward.builder()
                            .userId(rewardTx.getUserId())
                            .username(rewardTx.getUsername())
                            .balance(BigDecimal.ZERO)
                            .updatedAt(LocalDateTime.now())
                            .build());

            reward.setBalance(reward.getBalance().add(rewardTx.getPointsEarned()));
            reward.setUpdatedAt(LocalDateTime.now());
            rewardRepository.save(reward);

            log.info("Credited reward balance for user: {} with {} points. New balance: {}", 
                    reward.getUsername(), rewardTx.getPointsEarned(), reward.getBalance());

            // Publish RewardEarnedEvent to Kafka
            RewardEarnedEvent earnedEvent = new RewardEarnedEvent(
                    rewardTx.getUserId(),
                    rewardTx.getUsername(),
                    rewardTx.getTransactionId(),
                    rewardTx.getTransactionAmount(),
                    rewardTx.getPointsEarned(),
                    LocalDateTime.now()
            );

            try {
                kafkaTemplate.send("reward-earned", rewardTx.getTransactionId(), earnedEvent);
                log.info("Published RewardEarnedEvent to Kafka for user: {} and transaction: {}", 
                        rewardTx.getUsername(), rewardTx.getTransactionId());
            } catch (Exception e) {
                log.error("Failed to publish RewardEarnedEvent to Kafka", e);
            }
        } else {
            // Transaction failed, remove the reward transaction so it's not shown as credited
            rewardTransactionRepository.delete(rewardTx);
            log.info("Removed reward transaction ID: {} because transaction failed", event.getTransactionId());
        }
    }
}
