#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"

# 讀 GH_TOKEN
if [ -f "$ENV_FILE" ]; then
  GH_TOKEN=$(grep -E "^GH_TOKEN=" "$ENV_FILE" | cut -d= -f2-)
fi

if [ -z "$GH_TOKEN" ]; then
  echo "❌ GH_TOKEN not found in .env.local" >&2
  exit 1
fi

REPO_URL="https://${GH_TOKEN}@github.com/crealizellc/crealize-site.git"

echo "▶ Building static export..."
cd "$REPO_ROOT"
pnpm export

echo "▶ Copying CNAME..."
cp -f public/CNAME out/CNAME 2>/dev/null || true

echo "▶ Deploying to gh-pages..."
./node_modules/.bin/gh-pages -d out -b gh-pages -t -r "$REPO_URL"

echo "✅ Deployed to crealize.llc"
