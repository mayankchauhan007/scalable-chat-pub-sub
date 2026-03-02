
## Problem Statement

Build a real-time chat application where:
- Users can create and join chat rooms
- Messages are delivered instantly to all participants
- The system scales horizontally with multiple backend instances
- Real-time updates work across all instances using Redis PubSub

## Prerequisites

- **Docker** and **Docker Compose** installed
- Ports 3000, 5432, 6379, 8080 available

## Getting Started

### Prerequisites

- Docker Desktop installed and running
- Ports 3000, 5432, 6379, 8080 available on your machine

### Starting the Application

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```

   This command will:
   - Build Docker images for all services
   - Start PostgreSQL database (port 5432)
   - Start Redis for PubSub (port 6379)
   - Start 2 User Service instances (internal port 3001)
   - Start 2 Chat Service instances (internal port 3002)
   - Start Nginx load balancer (port 8080)
   - Start React frontend (port 3000)

2. **Access the application:**
   - Open your browser to **http://localhost:3000**

3. **Test real-time messaging:**
   - Create or select a user on the login screen
   - Click "+ New Chat" to create a chat room
   - Open a second browser window/tab (or use a different browser)
   - Log in as a different user in the second window
   - Join the same chat room
   - Send messages from either window and observe real-time delivery in both

### Stopping the Application

```bash
# Stop all services
docker-compose down

## Testing

### Unit Tests

The chat-service includes unit tests for the core business logic:

```bash
# Run chat-service tests
cd backend/chat-service
npm test
```

Tests cover:
- **Chat creation** — verifies a chat is created and the creator is auto-joined as a member.
- **Join chat** — verifies error on nonexistent chat, idempotent join, and new membership creation.
- **Send message** — verifies non-members cannot send messages and members can.
- **Message ordering** — verifies messages are returned in chronological order.

The user-service uses the NestJS default test setup:

```bash
cd backend/user-service
npm test
```

### Testing Approach

| Layer | Strategy |
|---|---|
| **Unit tests** | Mock TypeORM repositories to test service logic in isolation (chat creation, membership, message sending, ordering). |
| **Integration tests** | Can be added using NestJS `Test.createTestingModule` with a real test database to verify full resolver → service → DB flows. |
| **Multi-instance testing** | With `docker-compose up`, open two browser tabs as different users. Send messages and verify real-time delivery across both tabs — this exercises the Redis PubSub cross-instance path. |
| **Load testing** | Could use tools like `k6` or `artillery` to simulate concurrent WebSocket connections and message throughput. |

## AI-Generated Components

The following components were generated with AI assistance:

### Infrastructure
- **docker-compose.yml** - Structure for multi-service orchestration with health checks
- **nginx/nginx.conf** - Load balancer configuration with WebSocket support as I've mostly worked with AWS ELB and API Gateway.

### Frontend
- **Complete React application** including:
  - Apollo Client setup with split HTTP/WebSocket links
  - Login, ChatLayout, ChatList, and ChatRoom components
  - Real-time subscription handling with deduplication
  - TailwindCSS styling

### Backend
- **Basic CRUD operations** in both services:
  - User creation and retrieval
  - Chat creation and membership management
  - Message sending and history retrieval

### Unit tests

### And Readme file rephrasing 😅
