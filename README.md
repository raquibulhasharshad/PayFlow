# PayFlow | Premium Digital Wallet & Payments Portal

PayFlow is a high-performance, microservices-based digital wallet and peer-to-peer payments portal. It features a modern, responsive React frontend (styled with custom CSS glassmorphism) and a Spring Boot microservices backend communicating via Apache Kafka.

---

## 🌟 Key Features & Functionality

* **💳 Instant P2P Money Transfers**: Securely send money to any user instantly using their Name, Username, Email, or Mobile Number.
* **🔒 Secure PIN Protection**: Every transaction requires verification via a secure 4-to-6 digit Transaction PIN to protect user funds.
* **📈 Real-Time Balance Updates**: Deposit funds into your wallet using a digital top-up modal with immediate reflection on your dashboard.
* **📋 Transaction Ledger History**: A clean, filterable transaction list showing detailed incoming (credit) and outgoing (debit) histories with statuses (Success, Pending, Failed) and receipt popups.
* **🏆 Loyalty Rewards System**: Automatically earn reward points for every rupee spent, unlocking membership tiers (Bronze, Silver, Gold, Platinum) with exclusive privileges (e.g. zero transfer fees, cashback).
* **🔔 Transaction Notifications**: Immediate status popups and notifications triggered via Kafka when transactions occur.
* **⚙️ Profile Settings & Security**: Manage user profiles, update credentials, change passwords, reset transaction PINs, or safely deactivate accounts.

---

## 🏗️ Architecture & Technology Stack

```
                                  [ Public Traffic ]
                                          │
                                          ▼
                                   [ Ingress / ALB ]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [ Frontend (Nginx) ]                            [ API Gateway (8080) ]
         Port: 3000 (80 inside container)                        │
                                                                 ▼
                                                      [ Discovery Server (8761) ]
                                                                 │
                  ┌──────────────┬──────────────┬────────────────┴──────────────┐
                  ▼              ▼              ▼                               ▼
            [ Auth Service ] [ Wallet Service ] [ Transaction Service ] [ Rewards Service ]
               Port: 8081      Port: 8082          Port: 8083              Port: 8084
                  │              │              │                               │
                  └──────────────┼──────────────┼───────────────────────────────┘
                                 ▼              ▼
                        [ Kafka Broker ] ──► [ Notification Service ]
                          Port: 9092             Port: 8085
```

### Frontend
* **React SPA (Vite)**: Clean, interactive single-page application.
* **Vanilla CSS**: Premium responsive glassmorphism styles with mobile sidebar support.
* **Nginx**: Lightweight containerized web server serving static assets and proxying `/api` requests to the gateway.

### Backend Microservices (Spring Boot & Cloud)
* **API Gateway**: Entry point (port `8080`) that routes client requests to backend services.
* **Discovery Server (Eureka)**: Registry (port `8761`) allowing microservices to discover each other dynamically.
* **Auth Service**: Manages users, security configs, and JWT tokens (port `8081`).
* **Wallet Service**: Handles deposits, transfers, and wallet balance records (port `8082`).
* **Transaction Service**: Records transactions and retrieves user ledger histories (port `8083`).
* **Rewards Service**: Tracks membership levels (Bronze, Silver, Gold, Platinum) and loyalty points (port `8084`).
* **Notification Service**: Listens for transaction events via Kafka and triggers notifications (port `8085`).
* **Apache Kafka**: Event streaming bus for async message communication.
* **PostgreSQL (Neon Cloud)**: Relational databases for transaction and user accounts storage.

---

## 🚀 Running the Project Locally

### 1. Prerequisites
Ensure you have **Docker Desktop** installed and running on your machine.

### 2. Startup Command
Navigate to your project root folder and build/run the entire containerized stack:
```bash
docker compose up --build
```
* *To run in background (detached mode):* `docker compose up -d`
* *To stop the application:* `docker compose down`

### 3. Verify Local Services
Once started, you can access:
* **Frontend Web App**: `http://localhost:3000`
* **Eureka Discovery Dashboard**: `http://localhost:8761`
* **API Gateway (Public Endpoint)**: `http://localhost:8080`

---

## ☁️ Cloud Deployment Architecture (AWS + K8s + Jenkins)

For hosting this project on the cloud for **100% free**, the following setup is configured:

### 1. Virtual Machine (AWS EC2)
* We utilize a free-tier **EC2 instance (`t2.micro` / `t3.micro`)** running Linux in the AWS cloud. 
* There is no local server installation required. All tools run on this cloud instance.

### 2. Lightweight Kubernetes (K3s)
* K3s is installed inside the EC2 instance. It acts as our production Kubernetes cluster.
* Applying the deployment manifest launches all 9 containers (services, databases, Kafka, and frontend):
  ```bash
  kubectl apply -f k8s-deployment.yaml
  ```

### 3. CI/CD Pipeline (Jenkins)
* A Jenkins server runs inside the EC2 instance.
* Upon pushing code to GitHub, Jenkins reads the [Jenkinsfile](file:///d:/Payment%20Project/Jenkinsfile), builds the microservices, uploads the Docker containers to **Amazon ECR** (Elastic Container Registry), and updates the Kubernetes pods automatically.

---

## 🛠️ Developer Commands Reference

### Push Code to GitHub manually
Run these commands in your VS Code terminal to save and push your changes:
```bash
git add .
git commit -m "Add responsive sidebar, Docker configurations, Kubernetes manifests, and Jenkins pipeline"
git push
```
