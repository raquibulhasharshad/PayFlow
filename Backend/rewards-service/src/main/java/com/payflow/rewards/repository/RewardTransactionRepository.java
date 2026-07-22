package com.payflow.rewards.repository;

import com.payflow.rewards.model.RewardTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RewardTransactionRepository extends JpaRepository<RewardTransaction, Long> {
    List<RewardTransaction> findByUsername(String username);
    Optional<RewardTransaction> findByTransactionId(String transactionId);
}
