package com.payflow.transaction.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionInitiatedEvent {
    private String transactionId;
    private Long fromUserId;
    private String fromUsername;
    private String toUsername;
    private BigDecimal amount;
}
