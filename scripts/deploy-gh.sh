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
node scripts/audit-kv-quality.mjs --template docs/design-system/source/kv-posters.html

echo "▶ Selected Work v3 驗收 (AC 見 .claude/ac.md)..."
node scripts/audit-work-v3.mjs

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
# 註：不要期待 gh-pages 的 --remove 能清掉目的地的 dotfile —— 2026-08-08 實測
# `--remove '**'` 對 .cursorrules / .gitignore 完全無效（glob 預設不匹配 dotfile，
# 與 token-drift-lint 正則漏掉引號是同一類缺陷）。目的地殘留只能靠下方的
# 分支層檢查抓出來，再用 git 直接移除。
./node_modules/.bin/gh-pages -d site -b gh-pages -t -r "$REPO_URL"

echo "▶ Post-deploy verification（部署成功 ≠ 上線成功）..."
fail=0

# 1) 分支層：gh-pages 上除 .nojekyll 外不得有任何 dotfile。
#    這是通用檢查 —— 比逐一 curl 已知檔名可靠，能抓到未來新增的殘留。
git fetch -q "$REPO_URL" gh-pages
STRAY=$(git ls-tree -r FETCH_HEAD --name-only | grep '^\.' | grep -v '^\.nojekyll$' || true)
if [ -n "$STRAY" ]; then
  echo "❌ gh-pages 上有會被公開發佈的 dotfile：" >&2
  echo "$STRAY" >&2
  echo "   → 於 gh-pages 分支 git rm 後重推（gh-pages 工具的 --remove 清不掉 dotfile）" >&2
  fail=1
else
  echo "   ✓ gh-pages 無多餘 dotfile"
fi

# 2) HTTP 層：三語可達，且線上內容確實是本次 build 的產物
sleep 5
for path in "" "ja/" "zh/"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://crealize.llc/$path")
  [ "$code" = "200" ] || { echo "❌ https://crealize.llc/$path → HTTP $code" >&2; fail=1; }
done
LIVE=$(curl -s https://crealize.llc/ | shasum -a256 | cut -d' ' -f1)
LOCAL=$(shasum -a256 site/index.html | cut -d' ' -f1)
if [ "$LIVE" = "$LOCAL" ]; then
  echo "   ✓ 線上內容 = 本次 build 產物（${LIVE:0:16}…）"
else
  echo "⚠️  線上 sha256 與本地 build 不同（CDN 可能尚未失效）" >&2
  echo "    live=${LIVE:0:16}…  local=${LOCAL:0:16}…" >&2
  echo "    30 秒後重試一次…" >&2
  sleep 30
  LIVE=$(curl -s https://crealize.llc/ | shasum -a256 | cut -d' ' -f1)
  [ "$LIVE" = "$LOCAL" ] || { echo "❌ 仍不一致 —— 部署未真正生效" >&2; fail=1; }
fi

# 3) 資產層：主視覺的線上位元必須等於本地。
#    2026-08-08 踩到 —— 原本只比對 index.html 雜湊，圖換了但 CDN 還吐舊版時仍報綠燈。
#    「部署成功 ≠ 上線成功」對資產同樣成立。
echo "▶ 圖片資產比對（主視覺 + 手機縮圖；CDN 可能落後，最多重試 6 次）..."
for attempt in 1 2 3 4 5 6; do
  stale=""
  for f in site/assets/kv/*.webp site/assets/shots/*.webp; do
    rel="${f#site/}"
    lh=$(curl -s -H "Cache-Control: no-cache" "https://crealize.llc/$rel" | shasum -a256 | cut -d' ' -f1)
    bh=$(shasum -a256 "$f" | cut -d' ' -f1)
    [ "$lh" = "$bh" ] || stale="$stale $rel"
  done
  [ -z "$stale" ] && { echo "   ✓ $(ls site/assets/kv/*.webp site/assets/shots/*.webp | wc -l | tr -d ' ') 張圖片線上位元一致"; break; }
  [ "$attempt" = "6" ] && { echo "❌ CDN 未更新：$stale" >&2; fail=1; break; }
  sleep 20
done

[ "$fail" = "0" ] || { echo "❌ 上線驗證失敗 —— 請 rollback 或 forward-fix" >&2; exit 1; }

echo "✅ Deployed to crealize.llc（三語 200；gh-pages 無多餘 dotfile；內容雜湊相符）"
