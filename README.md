# AgentPlatform

**Multi-instance OpenClaw control plane** — connect to, monitor, and manage deployed OpenClaw agent instances from a single web GUI.

## Features

- **Instance Management** — Connect to multiple OpenClaw gateways over WebSocket RPC
- **Docker Monitoring** — Auto-discover and manage local OpenClaw Docker containers
- **Agent CRUD** — Create, update, delete agents with model selection and persona config
- **Channel Status** — Monitor channel connections in real-time
- **Skill Browser** — Browse and toggle skills with search/filter
- **Swarm Topology** — Visual drag-and-drop agent topology editor (React Flow)
- **Log Viewer** — Real-time streaming logs with search and level filter
- **Session Browser** — Browse chat sessions with previews
- **Usage Tracking** — Token usage and cost estimates
- **Config Editor** — Auto-generated forms from JSON Schema + raw JSON editor
- **Health Monitoring** — Periodic health checks with status badges

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding Instances

1. Click "Add Instance" in the sidebar
2. Enter the OpenClaw gateway WebSocket URL (e.g., `ws://localhost:18789`)
3. Optionally provide an auth token
4. The platform connects and shows instance health, agents, channels, etc.

## Docker Auto-Discovery

If Docker is running, the platform automatically discovers OpenClaw containers by:
- Image name containing "openclaw"
- Label `com.openclaw.instance=true`
- Containers exposing port 18789

Discovered containers appear on the dashboard and can be started/stopped/restarted.

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** (dark theme)
- **TanStack Query** for server state
- **Zustand** for client state
- **ws** for WebSocket RPC
- **dockerode** for Docker Engine API
- **@xyflow/react** for topology editor
- **lucide-react** for icons

## Architecture

```
Core Service (Next.js)
├── Web GUI (localhost:3000)
├── Instance Manager (WebSocket RPC connections)
├── Docker Monitor (Docker Engine API)
├── Health Monitor (periodic health checks)
└── Event Bus (SSE for real-time updates)
     │
     ├── OpenClaw Instance 1 (ws://...)
     ├── OpenClaw Instance 2 (ws://...)
     └── Docker containers (local)
```

## License

MIT
