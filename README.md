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

### Containerization & Orchestration
* **Docker**: Packages backend and frontend applications into lightweight, isolated, and immutable container images.
* **K3s (Kubernetes)**: Orchestrates the production containers inside the EC2 instance, managing scaling, resource constraints, self-healing restarts, and internal pod networking.

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

For hosting this project in production with maximum stability and performance, the following cloud infrastructure is configured:

### 1. Virtual Machine (AWS EC2)
* **Instance Type:** `c7i-flex.large` (2 vCPU, 4 GiB Memory) – Free Tier Eligible.
* **Storage:** 30 GB EBS gp3 SSD root volume.
* **Virtual Memory (Swap):** 3.0 GiB Swap space configured to provide **7.0 GiB of total memory**, completely eliminating disk thrashing and server freezes.

### 2. Lightweight Kubernetes (K3s) & Traefik Ingress
* **Orchestration:** K3s running inside the EC2 instance acts as the production Kubernetes cluster.
* **Ingress Routing:** Traefik serves public HTTP traffic on port `80`, routing:
  * `/` (Root) ──► `frontend-service`
  * `/api` (Backend endpoints) ──► `api-gateway-service`
* **Network Resolution:** All microservices register with Eureka using their **internal cluster IP addresses** (`prefer-ip-address=true`) to guarantee instant routing resolution.

### 3. Production CI/CD Pipeline (Jenkins)
* **Local Registry Bypass:** To optimize network bandwidth and storage, Jenkins builds the Docker images locally and imports them directly into the K3s container runtime image store (`k3s ctr images import`) instead of pushing to an external registry.
* **Memory Optimization:**
  * All Spring Boot applications run with optimized JVM parameters: `-Xmx128m -Xms64m -XX:+UseSerialGC`.
  * Kafka broker runs with capped Heap and GC options: `-Xmx256m -Xms128m -XX:+UseSerialGC`.
* **Zero-Downtime Rollout:** The pipeline performs sequential rolling restarts (`kubectl rollout restart`), waiting for each service to be healthy before proceeding to the next, guaranteeing zero downtime.

---

## 🛠️ Deployment & Maintenance Commands Reference

### Triggering a New Build
Whenever you commit and push new code to GitHub:
```bash
git add .
git commit -m "Your commit message"
git push
```
Go to your Jenkins dashboard at `http://YOUR_SERVER_IP:8080` and click **Build Now**. The pipeline will automatically rebuild, test, import, and rollout the updates.

### Monitoring Commands
Run these inside your EC2 terminal to monitor your deployment:
```bash
# Check the status of all pods
sudo kubectl get pods -A

# Check logs for a specific service
sudo kubectl logs deployment/auth-service --tail=100

# Reclaim disk space by cleaning up old Docker build cache (run after builds)
sudo docker system prune -af

# Check memory and disk usage
free -h
df -h
```
