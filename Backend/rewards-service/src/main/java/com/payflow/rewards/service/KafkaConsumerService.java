package com.payflow.rewards.service;

import com.payflow.transaction.event.TransactionInitiatedEvent;
import com.payflow.wallet.event.TransactionProcessedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final RewardService rewardService;

    @KafkaListener(topics = "transaction-initiated", groupId = "rewards-group")
    public void consumeTransactionInitiated(TransactionInitiatedEvent event) {
        log.info("Received TransactionInitiatedEvent from Kafka for transaction: {}", event.getTransactionId());
        try {
            rewardService.handleTransactionInitiated(event);
        } catch (Exception e) {
            log.error("Failed to process transaction initiation in rewards service for ID: {}", event.getTransactionId(), e);
        }
    }

    @KafkaListener(topics = "transaction-processed", groupId = "rewards-group")
    public void consumeTransactionProcessed(TransactionProcessedEvent event) {
        log.info("Received TransactionProcessedEvent from Kafka for transaction: {} with status: {}", 
                event.getTransactionId(), event.getStatus());
        try {
            rewardService.handleTransactionProcessed(event);
        } catch (Exception e) {
            log.error("Failed to process transaction status in rewards service for ID: {}", event.getTransactionId(), e);
        }
    }
}
