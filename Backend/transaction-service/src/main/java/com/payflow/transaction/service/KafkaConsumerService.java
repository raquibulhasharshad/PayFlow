package com.payflow.transaction.service;

import com.payflow.wallet.event.TransactionProcessedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final TransactionService transactionService;

    @KafkaListener(topics = "transaction-processed", groupId = "transaction-group")
    public void consumeTransactionProcessed(TransactionProcessedEvent event) {
        log.info("Received TransactionProcessedEvent from Kafka for transaction: {} with status: {}", 
                event.getTransactionId(), event.getStatus());
        try {
            transactionService.updateTransactionStatus(
                    event.getTransactionId(), 
                    event.getStatus(), 
                    event.getFailureReason()
            );
        } catch (Exception e) {
            log.error("Failed to update transaction status for ID: {}", event.getTransactionId(), e);
        }
    }
}
