# Real-Time Chat Application

A scalable real-time chat system built with TypeScript, NestJS, GraphQL, PostgreSQL, Redis, and React. Supports multiple backend instances with live message delivery via GraphQL subscriptions.

## Architecture

```
┌─────────────┐        ┌──────────────────────────────────────────┐
│   React     │  HTTP   │              Nginx (port 8080)           │
│   Frontend  │◄──────►│         Load Balancer (ip_hash)          │
│  (port 3000)│  WS    │                                          │
└─────────────┘        └────────┬─────────────────┬───────────────┘
                                │                 │
                    ┌───────────▼──────┐ ┌────────▼──────────┐
                    │  User Service    │ │  Chat Service      │
                    │  (2 instances)   │ │  (2 instances)     │
                    │  :3001           │ │  :3002             │
                    │  GraphQL API     │ │  GraphQL API +     │
                    │  - Create users  │ │    Subscriptions   │
                    │  - List users    │ │  - Create chats    │
                    └────────┬─────────┘ │  - Send messages   │
                             │           │  - Real-time events│
                             │           └────────┬───────────┘
                             │                    │
                    ┌────────▼────────────────────▼───────────┐
                    │           PostgreSQL (port 5432)         │
                    │           Database: chat                 │
                    └─────────────────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │           Redis (port 6379)              │
                    │     PubSub for cross-instance messages   │
                    └─────────────────────────────────────────┘
```

### Services

- **User Service** — Manages user creation and lookup. Exposes GraphQL queries (`users`, `user`) and a `createUser` mutation.
- **Chat Service** — Manages chats, membership, and messages. Exposes queries, mutations, and a `messageSent` subscription for real-time delivery.
- **Nginx** — Reverse proxy and load balancer. Routes `/user-service` and `/chat-service` to their respective upstream pools using `ip_hash` for sticky sessions (required for WebSocket connections).
- **PostgreSQL** — Shared relational database for both services.
- **Redis** — PubSub broker that ensures messages published by one chat-service instance are delivered to subscribers on all instances.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Redis PubSub** for subscriptions | Ensures real-time messages reach all clients regardless of which backend instance they're connected to. Without this, a message sent to instance A would never reach clients subscribed via instance B. |
| **Nginx `ip_hash`** sticky sessions | WebSocket connections must stay on the same upstream server for the duration of the connection. `ip_hash` ensures consistent routing. |
| **Separate Apollo Clients** in frontend | User and Chat services are independent GraphQL APIs with separate schemas. Using two Apollo Client instances avoids schema conflicts and keeps concerns separated. |
| **Message deduplication** in frontend | Both the mutation response and the subscription event can deliver the same message. The frontend tracks seen message IDs with a `Set` to prevent duplicates. |
| **Cursor-based pagination** for message history | Messages are fetched in `DESC` order by `createdAt` with an optional `before` cursor, then reversed to chronological order. This scales better than offset-based pagination. |
| **TypeORM `synchronize: true`** | Auto-creates tables from entities in development. In production, this should be replaced with migrations. |

## Prerequisites

- **Docker** and **Docker Compose** installed
- Ports 3000, 5432, 6379, 8080 available

## Quick Start

```bash
# Clone the repo and start all services
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- 2x User Service instances (internal ports 3001)
- 2x Chat Service instances (internal ports 3002)
- Nginx load balancer on port 8080
- React frontend on port 3000

Open **http://localhost:3000** in your browser.

### Usage

1. **Create a user** or select an existing one on the login screen.
2. **Create a chat** using the "+ New Chat" button in the sidebar.
3. **Send messages** — they appear in real-time for all participants.
4. Open a second browser tab/window, log in as a different user, join the same chat, and observe real-time message delivery.

## Project Structure

```
coding-challenge/
├── backend/
│   ├── user-service/          # NestJS user management service
│   │   ├── src/
│   │   │   ├── user/          # User entity, resolver, service, DTO
│   │   │   ├── app.module.ts  # GraphQL + TypeORM config
│   │   │   └── main.ts        # Bootstrap with CORS
│   │   ├── Dockerfile
│   │   └── package.json
│   └── chat-service/          # NestJS chat + real-time service
│       ├── src/
│       │   ├── chat/
│       │   │   ├── entities/  # Chat, ChatMember, Message entities
│       │   │   ├── dto/       # Input types
│       │   │   ├── chat.service.ts
│       │   │   ├── chat.resolver.ts
│       │   │   ├── chat.module.ts
│       │   │   ├── pubsub.provider.ts  # Redis PubSub
│       │   │   └── chat.service.spec.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── Dockerfile
│       └── package.json
├── frontend/                  # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/        # Login, ChatLayout, ChatList, ChatRoom
│   │   ├── graphql/           # Apollo Client setup, queries/mutations
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf             # Load balancer config
├── docker-compose.yml
└── README.md
```

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

### Manual Testing

1. Start the system: `docker-compose up --build`
2. Open http://localhost:3000 in two browser windows
3. Create two users (one per window)
4. Create a chat in window 1, join it from window 2
5. Send messages from both windows — verify they appear in real-time in both

## Tech Stack

- **Backend**: TypeScript, NestJS, GraphQL (code-first), TypeORM, PostgreSQL
- **Real-time**: GraphQL Subscriptions, Redis PubSub, graphql-ws
- **Frontend**: React, Vite, Apollo Client, TailwindCSS
- **Infrastructure**: Docker, Docker Compose, Nginx

## AI Usage

Code generated with AI assistance is marked with `// AI-generated:` comments explaining the rationale. Key AI-assisted areas include:
- Redis PubSub provider setup
- Apollo Client split link configuration
- ChatRoom subscription integration with deduplication logic
- Nginx load balancer configuration
- Unit test scaffolding
