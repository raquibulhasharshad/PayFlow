package com.payflow.notification.service;

import com.payflow.auth.event.UserCreatedEvent;
import com.payflow.rewards.event.RewardEarnedEvent;
import com.payflow.transaction.event.TransactionInitiatedEvent;
import com.payflow.wallet.event.TransactionProcessedEvent;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class KafkaConsumerServiceTest {

    private final KafkaConsumerService service = new KafkaConsumerService();

    @Test
    void testConsumeUserCreated() {
        UserCreatedEvent event = new UserCreatedEvent(1L, "alice", "alice@example.com", "1234567890");
        assertDoesNotThrow(() -> service.consumeUserCreated(event));
    }

    @Test
    void testConsumeTransactionInitiated() {
        TransactionInitiatedEvent event = new TransactionInitiatedEvent("tx-123", 1L, "alice", "bob", new BigDecimal("100.00"));
        assertDoesNotThrow(() -> service.consumeTransactionInitiated(event));
    }

    @Test
    void testConsumeTransactionProcessed_Success() {
        TransactionInitiatedEvent init = new TransactionInitiatedEvent("tx-123", 1L, "alice", "bob", new BigDecimal("100.00"));
        service.consumeTransactionInitiated(init);

        TransactionProcessedEvent processed = new TransactionProcessedEvent("tx-123", "SUCCESS", null);
        assertDoesNotThrow(() -> service.consumeTransactionProcessed(processed));
    }

    @Test
    void testConsumeTransactionProcessed_Failed() {
        TransactionInitiatedEvent init = new TransactionInitiatedEvent("tx-123", 1L, "alice", "bob", new BigDecimal("100.00"));
        service.consumeTransactionInitiated(init);

        TransactionProcessedEvent processed = new TransactionProcessedEvent("tx-123", "FAILED", "INSUFFICIENT_FUNDS");
        assertDoesNotThrow(() -> service.consumeTransactionProcessed(processed));
    }

    @Test
    void testConsumeRewardEarned() {
        RewardEarnedEvent event = new RewardEarnedEvent(1L, "alice", "tx-123", new BigDecimal("100.00"), new BigDecimal("10.00"), LocalDateTime.now());
        assertDoesNotThrow(() -> service.consumeRewardEarned(event));
    }
}
