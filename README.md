# 🎬 Async Media Generation Queue

A full-stack microservices platform that demonstrates **asynchronous, event-driven architecture** using Node.js, RabbitMQ, Redis, WebSockets, and Docker.

---

## 🏗️ Architecture

```
Browser ──► Job Service (REST API)
                │
                ├──► Redis        (stores job status instantly)
                │
                └──► RabbitMQ     (pushes job to queue)
                          │
                          ▼
                    Worker Service (processes job in background)
                          │
                          ├──► Redis        (updates status to "done")
                          │
                          └──► RabbitMQ     (publishes completion event)
                                    │
                                    ▼
                          Notification Service
                                    │
                                    └──► WebSocket ──► Browser
                                         (real-time push — no polling)
```

---

## ✨ Features

- **Non-blocking job submission** — API responds instantly with a job ID, never waits for processing to finish
- **Real-time browser notifications** via WebSockets — the page updates automatically when a job completes
- **Message queue architecture** using RabbitMQ — decouples job submission from job processing
- **Fast status cache** using Redis — any service can check job status in milliseconds
- **Fully containerized** — entire platform starts with a single `docker-compose up` command
- **Graceful fallback** — `GET /jobs/:id` polling endpoint available if WebSocket fails

---

## 🧱 Services

| Service | Port | Responsibility |
|---|---|---|
| `job-service` | 3000 | Accepts job submissions, saves to Redis, pushes to RabbitMQ |
| `worker-service` | — | Listens to queue, processes jobs, updates Redis, publishes completion |
| `notification-service` | 4000 | Listens for completions, pushes WebSocket events to browser |
| `frontend` | — | Plain HTML/JS UI — submits jobs and receives real-time updates |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API and service logic |
| **RabbitMQ (CloudAMQP)** | Message broker — decouples services asynchronously |
| **Redis (Redis Cloud)** | Fast in-memory cache for job status |
| **Socket.io** | WebSocket library for real-time browser push |
| **Docker + Docker Compose** | Containerization and orchestration |
| **amqplib** | Node.js RabbitMQ client |
| **ioredis** | Node.js Redis client |

---

## 🚀 Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A free [Redis Cloud](https://redis.io/try-free) account
- A free [CloudAMQP](https://www.cloudamqp.com) account

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/media-queue-project.git
cd media-queue-project
```

### 2. Set up environment variables

Create a `.env` file inside each service folder (`job-service`, `worker-service`, `notification-service`):

```env
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
RABBITMQ_URL=your-cloudamqp-url
```

### 3. Start everything

```bash
docker-compose up --build
```

This starts all three services automatically.

### 4. Open the frontend

Open `frontend/index.html` in your browser. Type a prompt, submit, and watch the real-time notification arrive.

---

## 📡 API Endpoints

### Submit a Job
```
POST http://localhost:3000/jobs
Content-Type: application/json

{
  "prompt": "a cinematic portrait of a futuristic city"
}
```
**Response:**
```json
{
  "jobId": "a3f2c1d4-...",
  "status": "pending"
}
```

### Check Job Status
```
GET http://localhost:3000/jobs/:jobId
```
**Response:**
```json
{
  "status": "done",
  "prompt": "a cinematic portrait of a futuristic city",
  "resultUrl": "https://placeholder.com/result-abc123.png"
}
```

---

## 💡 Why This Architecture?

### The Problem
Traditional web apps handle long tasks synchronously — the server blocks, the user waits, and under high traffic everything slows down or crashes.

### The Solution
This platform solves that with three key patterns:

**1. Async job queue** — The API instantly saves the job and responds to the user. The heavy work happens separately in the background.

**2. Message broker** — RabbitMQ decouples the submission service from the worker. They never talk directly — if the worker crashes, messages wait safely in the queue and are retried automatically.

**3. WebSockets** — Instead of the browser repeatedly asking "is it done yet?" (polling), the server pushes a single notification the moment the job completes.

---

## 📁 Project Structure

```
media-queue-project/
├── docker-compose.yml
├── job-service/
│   ├── Dockerfile
│   ├── index.js
│   ├── redis.js
│   ├── rabbitmq.js
│   └── package.json
├── worker-service/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── notification-service/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
└── frontend/
    └── index.html
```

---

## 🔮 Future Improvements

- Add JWT authentication to the API Gateway
- Replace simulated work with a real AI image generation API (e.g. Stable Diffusion, DALL-E)
- Add a database (PostgreSQL) for permanent job history
- Deploy to AWS/GCP using Kubernetes for auto-scaling
- Add a dead letter queue for failed jobs
- Convert frontend to React with proper state management

---

## 👩‍💻 Author

Built as a portfolio project to demonstrate microservices, async architecture, and event-driven systems.
