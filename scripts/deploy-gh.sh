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

echo "▶ Building trilingual static site (site/)..."
cd "$REPO_ROOT"
node scripts/build-site.mjs

echo "▶ Sanity checks..."
for f in site/index.html site/ja/index.html site/zh/index.html site/CNAME site/robots.txt site/sitemap.xml site/llms.txt site/assets/og.png; do
  [ -f "$f" ] || { echo "❌ missing $f" >&2; exit 1; }
done
grep -q "application/ld+json" site/index.html || { echo "❌ JSON-LD missing" >&2; exit 1; }

echo "▶ Deploying site/ to gh-pages..."
./node_modules/.bin/gh-pages -d site -b gh-pages -t -r "$REPO_URL"

echo "✅ Deployed to crealize.llc"
