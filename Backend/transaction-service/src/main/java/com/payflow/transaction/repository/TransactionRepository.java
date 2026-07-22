package com.payflow.transaction.repository;

import com.payflow.transaction.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByFromUsernameOrToUsernameOrderByCreatedAtDesc(String fromUsername, String toUsername);
}
