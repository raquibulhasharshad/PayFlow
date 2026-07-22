# PayFlow

PayFlow is a premium digital wallet and payments portal built using a high-performance Spring Boot microservices backend and a modern React frontend.

## Architecture Overview

PayFlow is composed of the following services:
* **API Gateway**: Entry point for routing requests.
* **Discovery Server**: Eureka server for service registration.
* **Auth Service**: Manages user registration, login, profile updates, and JWT sessions.
* **Wallet Service**: Handles wallet balance operations, deposits, and transfers.
* **Transaction Service**: Records transactions and builds transaction histories.
* **Notification Service**: Listens for transaction events via Kafka and dispatches notifications.
* **Rewards Service**: Calculates and keeps track of user loyalty tier progress and rewards.
* **Frontend**: React SPA using Vite, styled with custom premium CSS rules.

## Local Setup

### Running with Docker Compose
To build and start the entire stack including Apache Kafka:
```bash
docker compose up --build
```
Once started, the frontend will be served at `http://localhost:5173`.
