package com.payflow.rewards.repository;

import com.payflow.rewards.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RewardRepository extends JpaRepository<Reward, Long> {
    Optional<Reward> findByUserId(Long userId);
    Optional<Reward> findByUsername(String username);
}
