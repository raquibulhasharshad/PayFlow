package com.payflow.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", r -> r.path("/api/auth/**")
                        .uri("lb://AUTH-SERVICE"))
                .route("wallet-service", r -> r.path("/api/wallets/**")
                        .uri("lb://WALLET-SERVICE"))
                .route("transaction-service", r -> r.path("/api/transactions/**")
                        .uri("lb://TRANSACTION-SERVICE"))
                .route("rewards-service", r -> r.path("/api/rewards/**")
                        .uri("lb://REWARDS-SERVICE"))
                .route("notification-service", r -> r.path("/api/notifications/**")
                        .uri("lb://NOTIFICATION-SERVICE"))
                .build();
    }
}
