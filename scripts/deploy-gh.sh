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

echo "▶ Key-visual audit (母版規格 + 三語 registry 對帳)..."
node scripts/audit-kv.mjs
node scripts/audit-kv-registry.mjs

# 我們用 -t/--dotfiles 是因為 GitHub Pages 需要 .nojekyll。代價是 site/ 裡任何
# dotfile 都會被公開發佈。2026-08-08 發現 gh-pages 上殘留 .cursorrules（8229 bytes，
# 公司內部開發規範）與 .gitignore，兩者皆 HTTP 200 可公開讀取。
# 白名單以外的 dotfile 一律中止部署。
echo "▶ Dotfile allowlist（-t 會公開發佈 site/ 內所有 dotfile）..."
UNEXPECTED=$(find site -name ".*" -type f ! -name ".nojekyll" | head -20)
if [ -n "$UNEXPECTED" ]; then
  echo "❌ site/ 內有未列入白名單的 dotfile，部署會把它們公開：" >&2
  echo "$UNEXPECTED" >&2
  echo "   → 移除它們，或確認可公開後加進本腳本的白名單" >&2
  exit 1
fi
[ -f site/.nojekyll ] || { echo "❌ 缺 site/.nojekyll（GitHub Pages 需要）" >&2; exit 1; }

echo "▶ Deploying site/ to gh-pages..."
# --remove '**' 讓 gh-pages 先清掉目的地既有檔案，否則歷史殘留（如上述 .cursorrules）
# 會永遠留在分支上 —— 預設的 --remove '.' 清不掉它們，這正是外洩持續存在的原因。
./node_modules/.bin/gh-pages -d site -b gh-pages -t --remove '**' -r "$REPO_URL"

echo "▶ Post-deploy verification（部署成功 ≠ 上線成功）..."
sleep 5
fail=0
for path in "" "ja/" "zh/"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://crealize.llc/$path")
  [ "$code" = "200" ] || { echo "❌ https://crealize.llc/$path → HTTP $code" >&2; fail=1; }
done
# 外洩檔必須是 404
for leak in .cursorrules .gitignore; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://crealize.llc/$leak")
  if [ "$code" = "200" ]; then
    echo "❌ https://crealize.llc/$leak 仍可公開讀取（HTTP 200）" >&2; fail=1
  else
    echo "   ✓ /$leak → HTTP $code"
  fi
done
[ "$fail" = "0" ] || { echo "❌ 上線驗證失敗 —— 請 rollback 或 forward-fix" >&2; exit 1; }

echo "✅ Deployed to crealize.llc（三語 200；.cursorrules / .gitignore 已不可讀）"
