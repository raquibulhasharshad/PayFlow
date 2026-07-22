package com.payflow.notification.service;

import com.payflow.auth.event.UserCreatedEvent;
import com.payflow.rewards.event.RewardEarnedEvent;
import com.payflow.transaction.event.TransactionInitiatedEvent;
import com.payflow.wallet.event.TransactionProcessedEvent;
import com.payflow.notification.controller.NotificationController;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class KafkaConsumerService {

    @Autowired
    private NotificationController notificationController;

    // In-memory cache for correlating transaction events without a database
    private final Map<String, TransactionInitiatedEvent> pendingTransactions = new ConcurrentHashMap<>();

    @KafkaListener(topics = "user-created", groupId = "notification-group")
    public void consumeUserCreated(UserCreatedEvent event) {
        log.info("\n=================================================="
                + "\n[NOTIFICATION - WELCOME]"
                + "\nTo: {} ({}) [Mobile: {}]"
                + "\nMessage: Welcome to PayFlow! Your user registration was successful. A default wallet with a starting balance of $1000.00 has been set up for you."
                + "\n==================================================",
                event.getUsername(), event.getEmail(), event.getMobileNumber());

        try {
            notificationController.sendNotification(
                event.getUsername(), 
                "Welcome to PayFlow!", 
                "Your registration was successful. A default wallet with a starting balance of ₹1000.00 has been set up for you.", 
                "WELCOME"
            );
        } catch (Exception e) {
            log.error("Failed to send welcome notification for user: {}", event.getUsername(), e);
        }
    }

    @KafkaListener(topics = "transaction-initiated", groupId = "notification-group")
    public void consumeTransactionInitiated(TransactionInitiatedEvent event) {
        pendingTransactions.put(event.getTransactionId(), event);
        
        log.info("\n=================================================="
                + "\n[NOTIFICATION - TRANSACTION INITIATED]"
                + "\nTo: {}"
                + "\nMessage: Your transfer of ${} to user '{}' has been initiated and is being processed."
                + "\nTransaction ID: {}"
                + "\n==================================================",
                event.getFromUsername(), event.getAmount(), event.getToUsername(), event.getTransactionId());

        try {
            notificationController.sendNotification(
                event.getFromUsername(),
                "Transaction Initiated",
                String.format("Your transfer of ₹%s to @%s has been initiated.", event.getAmount(), event.getToUsername()),
                "INFO"
            );
        } catch (Exception e) {
            log.error("Failed to send transaction initiated notification", e);
        }
    }

    @KafkaListener(topics = "transaction-processed", groupId = "notification-group")
    public void consumeTransactionProcessed(TransactionProcessedEvent event) {
        TransactionInitiatedEvent initiated = pendingTransactions.remove(event.getTransactionId());

        if (initiated != null) {
            if ("SUCCESS".equalsIgnoreCase(event.getStatus())) {
                // Notify Sender
                log.info("\n=================================================="
                        + "\n[NOTIFICATION - TRANSACTION SUCCESS (SENDER)]"
                        + "\nTo: {}"
                        + "\nMessage: Your transfer of ${} to user '{}' was successful!"
                        + "\nTransaction ID: {}"
                        + "\n==================================================",
                        initiated.getFromUsername(), initiated.getAmount(), initiated.getToUsername(), event.getTransactionId());

                // Notify Receiver
                log.info("\n=================================================="
                        + "\n[NOTIFICATION - TRANSACTION RECEIVED (RECEIVER)]"
                        + "\nTo: {}"
                        + "\nMessage: You have received ${} from user '{}'!"
                        + "\nTransaction ID: {}"
                        + "\n==================================================",
                        initiated.getToUsername(), initiated.getAmount(), initiated.getFromUsername(), event.getTransactionId());

                try {
                    notificationController.sendNotification(
                        initiated.getFromUsername(),
                        "Transfer Successful",
                        String.format("Your transfer of ₹%s to @%s was successful!", initiated.getAmount(), initiated.getToUsername()),
                        "SUCCESS"
                    );

                    notificationController.sendNotification(
                        initiated.getToUsername(),
                        "Payment Received",
                        String.format("You have received ₹%s from @%s!", initiated.getAmount(), initiated.getFromUsername()),
                        "SUCCESS"
                    );
                } catch (Exception e) {
                    log.error("Failed to send transaction success notification", e);
                }
            } else {
                // Notify Sender of Failure
                log.info("\n=================================================="
                        + "\n[NOTIFICATION - TRANSACTION FAILED]"
                        + "\nTo: {}"
                        + "\nMessage: Your transfer of ${} to user '{}' failed. Reason: {}"
                        + "\nTransaction ID: {}"
                        + "\n==================================================",
                        initiated.getFromUsername(), initiated.getAmount(), initiated.getToUsername(), 
                        event.getFailureReason() != null ? event.getFailureReason() : "UNKNOWN_ERROR", 
                        event.getTransactionId());

                try {
                    notificationController.sendNotification(
                        initiated.getFromUsername(),
                        "Transfer Failed",
                        String.format("Your transfer of ₹%s to @%s failed. Reason: %s", 
                            initiated.getAmount(), initiated.getToUsername(), 
                            event.getFailureReason() != null ? event.getFailureReason() : "UNKNOWN_ERROR"),
                        "ERROR"
                    );
                } catch (Exception e) {
                    log.error("Failed to send transaction failed notification", e);
                }
            }
        } else {
            log.info("\n=================================================="
                    + "\n[NOTIFICATION - TRANSACTION STATUS UPDATE]"
                    + "\nTransaction ID: {} status changed to {}"
                    + "\nFailure Reason: {}"
                    + "\n==================================================",
                    event.getTransactionId(), event.getStatus(), event.getFailureReason());
        }
    }

    @KafkaListener(topics = "reward-earned", groupId = "notification-group")
    public void consumeRewardEarned(RewardEarnedEvent event) {
        log.info("\n=================================================="
                + "\n[NOTIFICATION - REWARDS EARNED]"
                + "\nTo: {}"
                + "\nMessage: Congratulations! You earned {} reward points from your transaction of ${} (Tx ID: {})."
                + "\n==================================================",
                event.getUsername(), event.getPointsEarned(), event.getAmount(), event.getTransactionId());

        try {
            notificationController.sendNotification(
                event.getUsername(),
                "Points Credited",
                String.format("Congratulations! You earned %s reward points from your transfer of ₹%s.", event.getPointsEarned(), event.getAmount()),
                "REWARD"
            );
        } catch (Exception e) {
            log.error("Failed to send reward earned notification", e);
        }
    }
}
