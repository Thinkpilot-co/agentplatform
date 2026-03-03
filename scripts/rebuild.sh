#!/usr/bin/env bash
set -euo pipefail

# rebuild.sh — Sync from OpenClaw source, build Docker image, redeploy container
#
# Usage:
#   ./scripts/rebuild.sh                    # full rebuild + deploy
#   ./scripts/rebuild.sh --no-sync          # skip sync, just rebuild + deploy
#   ./scripts/rebuild.sh --no-deploy        # sync + build image, but don't restart
#   ./scripts/rebuild.sh --sync-only        # just sync, no Docker
#
# Environment:
#   OPENCLAW_SRC    Path to OpenClaw source (default: ../openclaw)
#   IMAGE_NAME      Docker image name (default: agentplatform)
#   CONTAINER_NAME  Docker container name (default: agentplatform)
#   PORT            Host port mapping (default: 4000)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

OPENCLAW_SRC="${OPENCLAW_SRC:-$(realpath "$PROJECT_DIR/../openclaw" 2>/dev/null || echo "../openclaw")}"
IMAGE_NAME="${IMAGE_NAME:-agentplatform}"
CONTAINER_NAME="${CONTAINER_NAME:-agentplatform}"
PORT="${PORT:-4000}"

NO_SYNC=false
NO_DEPLOY=false
SYNC_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --no-sync) NO_SYNC=true ;;
    --no-deploy) NO_DEPLOY=true ;;
    --sync-only) SYNC_ONLY=true ;;
    --help|-h)
      echo "Usage: $0 [--no-sync] [--no-deploy] [--sync-only]"
      echo ""
      echo "  --no-sync     Skip OpenClaw source sync"
      echo "  --no-deploy   Build image but don't restart container"
      echo "  --sync-only   Only run sync (no Docker build/deploy)"
      echo ""
      echo "Environment:"
      echo "  OPENCLAW_SRC=$OPENCLAW_SRC"
      echo "  IMAGE_NAME=$IMAGE_NAME"
      echo "  CONTAINER_NAME=$CONTAINER_NAME"
      echo "  PORT=$PORT"
      exit 0
      ;;
  esac
done

cd "$PROJECT_DIR"

# ── Step 1: Sync from OpenClaw source ──

if [ "$NO_SYNC" = false ]; then
  echo "==> Syncing from OpenClaw source: $OPENCLAW_SRC"

  if [ ! -d "$OPENCLAW_SRC/src" ]; then
    echo "    ERROR: OpenClaw source not found at $OPENCLAW_SRC"
    echo "    Set OPENCLAW_SRC=/path/to/openclaw and try again"
    exit 1
  fi

  npx tsx scripts/sync-openclaw.ts "$OPENCLAW_SRC"
  echo ""
fi

if [ "$SYNC_ONLY" = true ]; then
  echo "==> Sync complete (--sync-only)"
  exit 0
fi

# ── Step 2: Build Docker image ──

echo "==> Building Docker image: $IMAGE_NAME"

# Tag with timestamp for rollback
TAG="$(date +%Y%m%d-%H%M%S)"
docker build -t "$IMAGE_NAME:$TAG" -t "$IMAGE_NAME:latest" .

echo "    Tagged: $IMAGE_NAME:$TAG"
echo "    Tagged: $IMAGE_NAME:latest"
echo ""

if [ "$NO_DEPLOY" = true ]; then
  echo "==> Build complete (--no-deploy)"
  echo "    Run manually: docker run -d --name $CONTAINER_NAME -p $PORT:3000 -v /var/run/docker.sock:/var/run/docker.sock:ro $IMAGE_NAME:latest"
  exit 0
fi

# ── Step 3: Redeploy container ──

echo "==> Deploying container: $CONTAINER_NAME"

# Stop and remove existing container (if running)
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "    Stopping existing container..."
  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# Run new container
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$PORT:3000" \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v "$PROJECT_DIR/instances.json:/app/instances.json" \
  --restart unless-stopped \
  "$IMAGE_NAME:latest"

echo ""
echo "==> Deployed successfully!"
echo "    Container: $CONTAINER_NAME"
echo "    Image:     $IMAGE_NAME:$TAG"
echo "    URL:       http://localhost:$PORT"
echo ""

# ── Step 4: Health check ──

echo "==> Waiting for health..."
for i in $(seq 1 10); do
  if curl -sf "http://localhost:$PORT" > /dev/null 2>&1; then
    echo "    Ready at http://localhost:$PORT"
    exit 0
  fi
  sleep 1
done

echo "    WARNING: Container started but not responding yet. Check logs:"
echo "    docker logs $CONTAINER_NAME"
