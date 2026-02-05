#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Stopping containers and removing volumes..."
docker-compose down -v

echo "Starting postgres container..."
docker-compose up -d postgres

echo "Running e2e tests..."
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5433/keynection?schema=public" \
  npm run test:e2e
