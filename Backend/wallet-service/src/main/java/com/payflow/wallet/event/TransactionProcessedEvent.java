package com.payflow.wallet.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionProcessedEvent {
    private String transactionId;
    private String status;
    private String failureReason;
}
