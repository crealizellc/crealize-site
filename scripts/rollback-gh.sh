#!/bin/bash
# rollback-gh.sh — 把線上站退回 gh-pages 的前一個 commit。
#
# 為什麼需要它：delivery-gate 對 deploy-prod 要求「已驗證的回退路徑」。
# 先前登記草案寫的是 `cat .gh-pages-rollback`，但那個檔不存在 —— 依賴不存在檔案的
# rollback_cmd 是假指標，出事那天才會發現退不回去。這支改成從 gh-pages 自己的
# 歷史取前一版，不依賴任何外部狀態。
#
# 用法：
#   bash scripts/rollback-gh.sh --dry-run   # 只印會做什麼，不推
#   bash scripts/rollback-gh.sh             # 真的退回
#
# 注意：gh-pages 是 gh-pages 工具產生的分支，每次部署一個 commit，
# 所以 HEAD~1 就是「上一個部署版本」。

set -e
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

GH_TOKEN=$(grep -E "^GH_TOKEN=" .env.local 2>/dev/null | cut -d= -f2-)
[ -n "$GH_TOKEN" ] || { echo "❌ .env.local 缺 GH_TOKEN" >&2; exit 1; }
REPO_URL="https://${GH_TOKEN}@github.com/crealizellc/crealize-site.git"
redact() { sed -E 's#https://[^@]*@#https://***@#g'; }

git fetch -q "$REPO_URL" gh-pages
CUR=$(git rev-parse FETCH_HEAD)
PREV=$(git rev-parse FETCH_HEAD~1 2>/dev/null) || { echo "❌ gh-pages 只有一個 commit，無前一版可退" >&2; exit 1; }

echo "目前線上 gh-pages : $CUR"
echo "將退回到          : $PREV"
echo "  $(git log -1 --format='%s' "$PREV")"

if [ "$DRY" = "1" ]; then
  echo "（--dry-run，未推送）"
  exit 0
fi

git push "$REPO_URL" "+${PREV}:refs/heads/gh-pages" 2>&1 | redact

echo "▶ 驗證回退是否真的生效..."
EXPECT=$(git show "$PREV:index.html" | shasum -a256 | cut -d' ' -f1)
for attempt in 1 2 3 4 5 6; do
  sleep 10
  LIVE=$(curl -s -H "Cache-Control: no-cache" https://crealize.llc/ | shasum -a256 | cut -d' ' -f1)
  [ "$LIVE" = "$EXPECT" ] && { echo "✅ 已退回（線上 = ${EXPECT:0:16}…）"; exit 0; }
done
echo "❌ 推送成功但線上內容仍不是 $PREV —— CDN 未失效或回退未生效" >&2
exit 1
