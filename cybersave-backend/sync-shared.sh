#!/bin/bash
# sync-shared.sh — run after any change to cybersave-backend/shared/src/
# Builds the shared package and copies dist/ into all service node_modules.
# Usage: bash sync-shared.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/shared"
SERVICES_DIR="$SCRIPT_DIR/services"

echo "→ Building @cybersave/shared..."
cd "$SHARED_DIR"
npm run build

echo "→ Syncing dist/ to all services..."
for SERVICE_DIR in "$SERVICES_DIR"/*/; do
  TARGET="$SERVICE_DIR/node_modules/@cybersave/shared"
  if [ -d "$TARGET" ]; then
    rm -rf "$TARGET/dist"
    cp -r "$SHARED_DIR/dist" "$TARGET/"
    echo "  ✓ Synced: $(basename $SERVICE_DIR)"
  fi
done

echo "✅ Shared package synced."
