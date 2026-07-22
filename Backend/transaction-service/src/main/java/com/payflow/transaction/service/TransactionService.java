package com.payflow.transaction.service;

import com.payflow.transaction.event.TransactionInitiatedEvent;
import com.payflow.transaction.model.Transaction;
import com.payflow.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public Transaction createTransaction(Long fromUserId, String fromUsername, String toUsername, BigDecimal amount) {
        log.info("Creating transaction: from {} to {} of amount {}", fromUsername, toUsername, amount);

        if (fromUsername.equals(toUsername)) {
            throw new IllegalArgumentException("Cannot transfer money to yourself");
        }

        String transactionId = UUID.randomUUID().toString();

        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .fromUserId(fromUserId)
                .fromUsername(fromUsername)
                .toUsername(toUsername)
                .amount(amount)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        Transaction savedTx = transactionRepository.save(transaction);

        // Publish to Kafka
        TransactionInitiatedEvent event = new TransactionInitiatedEvent(
                transactionId,
                fromUserId,
                fromUsername,
                toUsername,
                amount
        );

        try {
            kafkaTemplate.send("transaction-initiated", transactionId, event);
            log.info("Published TransactionInitiatedEvent to Kafka for transaction: {}", transactionId);
        } catch (Exception e) {
            log.error("Failed to publish TransactionInitiatedEvent to Kafka for transaction: {}", transactionId, e);
            // In a real-world scenario, we might use the Outbox pattern or transactional producer to guarantee message delivery.
        }

        return savedTx;
    }

    @Transactional
    public void updateTransactionStatus(String transactionId, String status, String failureReason) {
        log.info("Updating transaction {} status to {}, reason: {}", transactionId, status, failureReason);
        transactionRepository.findById(transactionId).ifPresentOrElse(tx -> {
            tx.setStatus(status);
            tx.setFailureReason(failureReason);
            transactionRepository.save(tx);
            log.info("Updated transaction {} successfully", transactionId);
        }, () -> log.error("Transaction not found for ID: {}", transactionId));
    }

    public List<Transaction> getTransactionHistory(String username) {
        return transactionRepository.findByFromUsernameOrToUsernameOrderByCreatedAtDesc(username, username);
    }

    @Transactional
    public Transaction createDepositTransaction(Long userId, String username, BigDecimal amount) {
        log.info("Creating deposit transaction: user {} of amount {}", username, amount);

        String transactionId = UUID.randomUUID().toString();

        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .fromUserId(userId)
                .fromUsername(username)
                .toUsername(username) // self-transfer
                .amount(amount)
                .status("SUCCESS") // direct success
                .createdAt(LocalDateTime.now())
                .build();

        return transactionRepository.save(transaction);
    }
}
