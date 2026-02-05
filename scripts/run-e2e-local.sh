#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting postgres container..."
docker-compose up -d postgres

echo "Waiting for postgres to be ready..."
READY=0
for i in {1..30}; do
  if docker-compose exec -T postgres pg_isready -U postgres -d keynection >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  echo "Postgres did not become ready in time."
  exit 1
fi

echo "Running e2e tests..."
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5433/keynection?schema=public" \
  npm run test:e2e
