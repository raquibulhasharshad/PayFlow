package com.payflow.rewards.service;

import com.payflow.rewards.event.RewardEarnedEvent;
import com.payflow.rewards.model.Reward;
import com.payflow.rewards.model.RewardTransaction;
import com.payflow.rewards.repository.RewardRepository;
import com.payflow.rewards.repository.RewardTransactionRepository;
import com.payflow.transaction.event.TransactionInitiatedEvent;
import com.payflow.wallet.event.TransactionProcessedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private RewardTransactionRepository rewardTransactionRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private RewardService rewardService;

    private TransactionInitiatedEvent initiatedEvent;
    private RewardTransaction rewardTransaction;

    @BeforeEach
    void setUp() {
        initiatedEvent = new TransactionInitiatedEvent("tx-123", 1L, "alice", "bob", new BigDecimal("100.00"));
        rewardTransaction = RewardTransaction.builder()
                .userId(1L)
                .username("alice")
                .transactionId("tx-123")
                .transactionAmount(new BigDecimal("100.00"))
                .pointsEarned(new BigDecimal("10.00"))
                .build();
    }

    @Test
    void testHandleTransactionInitiated_NewTransaction() {
        when(rewardTransactionRepository.findByTransactionId("tx-123")).thenReturn(Optional.empty());

        rewardService.handleTransactionInitiated(initiatedEvent);

        verify(rewardTransactionRepository, times(1)).save(any(RewardTransaction.class));
    }

    @Test
    void testHandleTransactionInitiated_ExistingTransaction() {
        when(rewardTransactionRepository.findByTransactionId("tx-123")).thenReturn(Optional.of(rewardTransaction));

        rewardService.handleTransactionInitiated(initiatedEvent);

        verify(rewardTransactionRepository, never()).save(any());
    }

    @Test
    void testHandleTransactionProcessed_Success() {
        TransactionProcessedEvent processedEvent = new TransactionProcessedEvent("tx-123", "SUCCESS", null);
        when(rewardTransactionRepository.findByTransactionId("tx-123")).thenReturn(Optional.of(rewardTransaction));
        when(rewardRepository.findByUsername("alice")).thenReturn(Optional.empty());

        rewardService.handleTransactionProcessed(processedEvent);

        ArgumentCaptor<Reward> rewardCaptor = ArgumentCaptor.forClass(Reward.class);
        verify(rewardRepository, times(1)).save(rewardCaptor.capture());
        assertEquals("alice", rewardCaptor.getValue().getUsername());
        assertEquals(new BigDecimal("10.00"), rewardCaptor.getValue().getBalance());

        verify(kafkaTemplate, times(1)).send(eq("reward-earned"), eq("tx-123"), any(RewardEarnedEvent.class));
    }

    @Test
    void testHandleTransactionProcessed_Failed() {
        TransactionProcessedEvent processedEvent = new TransactionProcessedEvent("tx-123", "FAILED", "INSUFFICIENT_FUNDS");
        when(rewardTransactionRepository.findByTransactionId("tx-123")).thenReturn(Optional.of(rewardTransaction));

        rewardService.handleTransactionProcessed(processedEvent);

        verify(rewardTransactionRepository, times(1)).delete(rewardTransaction);
        verify(rewardRepository, never()).save(any());
        verify(kafkaTemplate, never()).send(any(), any(), any());
    }
}
