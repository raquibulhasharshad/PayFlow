package com.payflow.wallet.service;

import com.payflow.wallet.model.Wallet;
import com.payflow.wallet.repository.WalletRepository;
import com.payflow.transaction.event.TransactionInitiatedEvent;
import com.payflow.wallet.event.TransactionProcessedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public void createWalletForUser(Long userId, String username) {
        if (walletRepository.findByUserId(userId).isPresent()) {
            log.warn("Wallet already exists for user ID: {}", userId);
            return;
        }

        Wallet wallet = Wallet.builder()
                .userId(userId)
                .username(username)
                .balance(new BigDecimal("1000.00")) // Give default starting balance of 1000 for testing
                .build();

        walletRepository.save(wallet);
        log.info("Created new wallet for user: {}, initial balance: $1000.00", username);
    }

    @Transactional
    public void processTransaction(TransactionInitiatedEvent event) {
        log.info("Processing transaction {} from {} to {} of amount {}", 
                event.getTransactionId(), event.getFromUsername(), event.getToUsername(), event.getAmount());

        String status = "FAILED";
        String failureReason = null;

        try {
            // Lock sender first, then lock receiver (prevent deadlocks by sorting locked keys if they are user IDs/usernames,
            // but for simplicity, we lock sender first. In a production environment, order locking to prevent deadlocks!)
            String sender = event.getFromUsername();
            String receiver = event.getToUsername();

            if (sender.equals(receiver)) {
                failureReason = "CANNOT_TRANSFER_TO_SELF";
            } else {
                Optional<Wallet> senderWalletOpt = walletRepository.findByUsernameWithLock(sender);
                Optional<Wallet> receiverWalletOpt = walletRepository.findByUsernameWithLock(receiver);

                if (senderWalletOpt.isEmpty()) {
                    failureReason = "SENDER_WALLET_NOT_FOUND";
                } else if (receiverWalletOpt.isEmpty()) {
                    failureReason = "RECEIVER_WALLET_NOT_FOUND";
                } else {
                    Wallet senderWallet = senderWalletOpt.get();
                    Wallet receiverWallet = receiverWalletOpt.get();

                    if (senderWallet.getBalance().compareTo(event.getAmount()) < 0) {
                        failureReason = "INSUFFICIENT_FUNDS";
                    } else {
                        senderWallet.setBalance(senderWallet.getBalance().subtract(event.getAmount()));
                        receiverWallet.setBalance(receiverWallet.getBalance().add(event.getAmount()));

                        walletRepository.save(senderWallet);
                        walletRepository.save(receiverWallet);

                        status = "SUCCESS";
                        log.info("Successfully transferred {} from {} to {}. Tx ID: {}", 
                                event.getAmount(), sender, receiver, event.getTransactionId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing transaction {}: {}", event.getTransactionId(), e.getMessage(), e);
            failureReason = "INTERNAL_SERVER_ERROR";
        }

        // Publish result event
        TransactionProcessedEvent processedEvent = new TransactionProcessedEvent(
                event.getTransactionId(),
                status,
                failureReason
        );

        try {
            kafkaTemplate.send("transaction-processed", event.getTransactionId(), processedEvent);
            log.info("Published TransactionProcessedEvent to Kafka for transaction: {}", event.getTransactionId());
        } catch (Exception e) {
            log.error("Failed to publish TransactionProcessedEvent to Kafka", e);
        }
    }

    @Transactional
    public Wallet getWalletByUsername(String username) {
        return walletRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Wallet not found for username: " + username));
    }

    @Transactional
    public Wallet creditWallet(String username, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUsernameWithLock(username)
                .orElseThrow(() -> new RuntimeException("Wallet not found for username: " + username));
        
        wallet.setBalance(wallet.getBalance().add(amount));
        Wallet savedWallet = walletRepository.save(wallet);
        log.info("Credited wallet for user: {} with amount: {}, new balance: {}", username, amount, savedWallet.getBalance());
        return savedWallet;
    }
}
