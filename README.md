# Clawhaus

**Centralized control plane for distributed AI agent fleets** — connect to, monitor, and manage multiple deployed OpenClaw instances from a single web interface.

Clawhaus solves the operational challenge of running AI agents across multiple machines and environments. Instead of SSHing into individual servers or managing agents through scattered CLIs, Clawhaus gives you a unified dashboard with real-time health monitoring, agent lifecycle management, Docker container orchestration, and a full rebuild pipeline.

## Features

### Instance Management
Connect to any number of OpenClaw gateways over WebSocket RPC. Each instance shows real-time connection status, server version, health metrics, and agent/channel counts. Add, remove, and reconnect instances from the UI.

### Agent Lifecycle
Create, update, and delete agents with model selection, persona configuration, skill assignment, and subagent topology. The swarm editor provides a visual drag-and-drop topology view powered by React Flow.

### Docker Integration
Auto-discovers local OpenClaw containers by image name, labels, or exposed ports. Start, stop, and restart containers directly from the dashboard. View container logs, resource stats (CPU/memory), and port mappings.

### Real-time Monitoring
- **Health checks** — Periodic health probes with status badges and uptime tracking
- **Channel status** — Live connection state for all communication channels
- **Log viewer** — Streaming logs with search, level filtering, and auto-scroll
- **Session browser** — Browse chat sessions with message previews
- **Usage tracking** — Token consumption and cost estimates per instance

### Configuration
Auto-generated forms from JSON Schema with grouped fields, validation hints, and a raw JSON editor fallback. Config changes are applied live via RPC.

### Skill Browser
Browse installed skills with search, category filtering, and one-click enable/disable toggles.

### Cron Jobs
Schedule recurring tasks with cron expressions. Create, edit, toggle, and delete scheduled jobs that trigger agent actions on a timer.

### Rebuild Pipeline
Full sync-build-deploy-healthcheck pipeline with real-time streaming logs and step-by-step progress visualization. Sync from OpenClaw source, build Docker images, deploy containers, and verify health — all from the UI.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React 19)                │
│  Dashboard │ Agents │ Channels │ Skills │ Config    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────┴──────────────────────────────┐
│              Next.js 16 (App Router)                │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ API Routes  │  │ RPC Proxy    │  │ SSE Events│  │
│  │ /api/*      │  │ /api/*/rpc   │  │ /api/events│ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                │                │         │
│  ┌──────┴────────────────┴────────────────┴──────┐  │
│  │              Core Services                    │  │
│  │  Instance Manager · Health Monitor            │  │
│  │  Docker Monitor   · Event Bus · Rebuilder     │  │
│  └──────┬───────────────────┬────────────────────┘  │
└─────────┼───────────────────┼────────────────────────┘
          │ WebSocket RPC     │ Docker Engine API
  ┌───────┴───────┐   ┌──────┴──────┐
  │ OpenClaw      │   │ Docker      │
  │ Instance 1..N │   │ Containers  │
  │ (ws://...)    │   │ (local)     │
  └───────────────┘   └─────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Docker** (optional, for container monitoring and rebuild pipeline)
- At least one running OpenClaw instance with gateway enabled

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First Connection

1. Click **"Add Instance"** in the sidebar
2. Enter the OpenClaw gateway WebSocket URL (e.g., `ws://localhost:18789`)
3. Optionally provide an auth token
4. The platform connects via WebSocket RPC with device identity handshake
5. Dashboard populates with agents, channels, health status, and more

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCKER_SOCKET_PATH` | `/var/run/docker.sock` | Path to Docker socket |
| `DOCKER_HOST` | — | Docker host URL (alternative to socket) |
| `PORT` | `3000` | Server port |

### `instances.json`

Persistent instance configuration stored at project root:

```json
{
  "instances": [
    {
      "id": "unique-id",
      "name": "Production",
      "url": "ws://10.0.0.5:18789",
      "token": "optional-auth-token",
      "tags": ["prod", "main"]
    }
  ]
}
```

## Docker Integration

### Auto-Discovery

The platform automatically discovers OpenClaw containers by matching any of:

- **Image name** containing `openclaw`
- **Label** `com.openclaw.instance=true`
- **Exposed port** `18789` (OpenClaw gateway default)

### Container Actions

From the Docker page or dashboard, you can:
- Start / stop / restart containers
- View real-time logs with configurable tail depth
- Monitor CPU and memory usage
- Click through to connect a container as a managed instance

## Rebuild Pipeline

The rebuild pipeline automates the full deployment cycle:

1. **Sync** — Pull latest source from local OpenClaw directory
2. **Build** — Build Docker image with timestamped tags
3. **Deploy** — Stop old container, start new one with volume mounts
4. **Health check** — Poll the new container until it responds

Each step streams logs in real-time via SSE. The pipeline can be configured to skip sync or deploy steps.

## API Reference

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/instances` | List all instances with status |
| `POST` | `/api/instances` | Add a new instance |
| `GET` | `/api/instances/[id]` | Get instance details |
| `DELETE` | `/api/instances/[id]` | Remove instance |
| `POST` | `/api/instances/[id]/reconnect` | Trigger reconnect |
| `POST` | `/api/instances/[id]/rpc` | Proxy RPC to instance |
| `GET` | `/api/docker` | List Docker containers |
| `POST` | `/api/docker/[id]` | Container action (start/stop/restart) |
| `GET` | `/api/docker/[id]/logs` | Container logs |
| `GET` | `/api/events` | SSE event stream |
| `GET` | `/api/rebuild` | Get build state |
| `POST` | `/api/rebuild` | Start rebuild |
| `DELETE` | `/api/rebuild` | Cancel build |

### RPC Proxy

Any OpenClaw RPC method can be called through the proxy:

```bash
curl -X POST http://localhost:3000/api/instances/{id}/rpc \
  -H 'Content-Type: application/json' \
  -d '{"method": "agents.list"}'
```

Available RPC methods include: `health`, `agents.list`, `agents.create`, `agents.update`, `agents.delete`, `channels.status`, `skills.status`, `sessions.list`, `config.get`, `config.patch`, `config.schema`, `cron.list`, `cron.add`, `cron.update`, `cron.remove`, `tools.catalog`, `usage.status`, `logs.tail`, and more.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | App Router, API routes, SSR |
| React | 19 | UI components |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS | 4 | Styling (dark theme) |
| TanStack Query | 5 | Server state + cache |
| Zustand | 5 | Client state |
| Framer Motion | 11 | Animations |
| ws | 8 | WebSocket RPC client |
| dockerode | 4 | Docker Engine API |
| @xyflow/react | 12 | Topology editor |
| Pino | 10 | Structured logging |
| lucide-react | — | Icons |

## Project Structure

```
clawhaus/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/                # REST API endpoints
│   │   ├── docker/         # Docker container management
│   │   ├── events/         # SSE event stream
│   │   ├── instances/      # Instance CRUD + RPC proxy
│   │   └── rebuild/        # Build pipeline control
│   ├── docker/             # Docker containers page
│   ├── instances/[id]/     # Instance detail pages
│   │   ├── agents/         # Agent management
│   │   ├── channels/       # Channel status
│   │   ├── config/         # Configuration editor
│   │   ├── cron/           # Scheduled tasks
│   │   ├── logs/           # Log viewer
│   │   ├── sessions/       # Session browser
│   │   ├── skills/         # Skill browser
│   │   ├── swarm/          # Topology editor
│   │   └── usage/          # Usage & costs
│   └── rebuild/            # Rebuild pipeline UI
├── components/             # React components
│   ├── dashboard/          # Dashboard-level components
│   ├── docker/             # Docker container components
│   └── ui/                 # Shared UI primitives
├── core/                   # Server-side core services
│   ├── docker-monitor.ts   # Docker Engine API integration
│   ├── event-bus.ts        # Internal event system
│   ├── health-monitor.ts   # Periodic health checks
│   ├── instance-manager.ts # WebSocket connection lifecycle
│   ├── instance-store.ts   # Persistent instance config (JSON)
│   ├── openclaw-client.ts  # WebSocket RPC client
│   ├── rebuilder.ts        # Build pipeline orchestration
│   └── types.ts            # Shared type definitions
├── hooks/                  # React hooks
│   ├── use-docker.ts       # Docker query hooks
│   ├── use-events.ts       # SSE event subscription
│   ├── use-instance.ts     # Single instance query
│   └── use-instances.ts    # Instance list + mutations
├── lib/                    # Client utilities
│   ├── rpc.ts              # Client-side RPC helpers
│   └── utils.ts            # Formatting utilities
└── scripts/                # Build & sync scripts
```

## License

MIT
