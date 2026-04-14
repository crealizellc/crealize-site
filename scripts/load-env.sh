#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC2046
  export $(sed -n 's/^[[:space:]]*\([A-Za-z0-9_][A-Za-z0-9_]*\)[[:space:]]*=[[:space:]]*\(.*\)[[:space:]]*$/\1=\2/p' "$ENV_FILE")
else
  echo ".env.local not found at $ENV_FILE" >&2
  exit 1
fi

echo "Loaded env: GH_OWNER=$GH_OWNER GH_REPO=$GH_REPO BRANCH=$GH_PAGES_BRANCH DOMAIN=$GH_PAGES_DOMAIN"
if [ -n "${GH_TOKEN:-}" ]; then
  echo "GH_TOKEN is present (hidden). gh will use GH_TOKEN for auth in this process."
else
  echo "GH_TOKEN missing. Please set it in .env.local" >&2
  exit 1
fi
