package com.payflow.transaction.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "auth-service")
public interface AuthClient {

    @PostMapping("/api/auth/users/verify-pin")
    ResponseEntity<Boolean> verifyPin(@RequestParam("username") String username, @RequestParam("pin") String pin);
}
