package com.payflow.wallet.service;

import com.payflow.auth.event.UserCreatedEvent;
import com.payflow.transaction.event.TransactionInitiatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final WalletService walletService;

    @KafkaListener(topics = "user-created", groupId = "wallet-group")
    public void consumeUserCreated(UserCreatedEvent event) {
        log.info("Received UserCreatedEvent from Kafka for user: {}", event.getUsername());
        try {
            walletService.createWalletForUser(event.getUserId(), event.getUsername());
        } catch (Exception e) {
            log.error("Failed to process UserCreatedEvent for user: {}", event.getUsername(), e);
        }
    }

    @KafkaListener(topics = "transaction-initiated", groupId = "wallet-group")
    public void consumeTransactionInitiated(TransactionInitiatedEvent event) {
        log.info("Received TransactionInitiatedEvent from Kafka for transaction ID: {}", event.getTransactionId());
        try {
            walletService.processTransaction(event);
        } catch (Exception e) {
            log.error("Failed to process TransactionInitiatedEvent for transaction: {}", event.getTransactionId(), e);
        }
    }
}
