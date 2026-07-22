package com.payflow.rewards.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RewardEarnedEvent {
    private Long userId;
    private String username;
    private String transactionId;
    private BigDecimal amount;
    private BigDecimal pointsEarned;
    private LocalDateTime earnedAt;
}
