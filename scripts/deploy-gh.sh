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

echo "▶ Generating Selected Work v3 (site/js/work-v3.js)..."
cd "$REPO_ROOT"
node scripts/gen-work-v3.mjs

echo "▶ Building trilingual static site (site/)..."
node scripts/build-site.mjs

# 順序不可換：build-site 每次都整份重寫 index.html（回到 #work-cards 的
# 佔位註解），所以 prerender 必須在它「之後」跑，才不會被下一次 build 蓋掉。
# 2026-08-09 起：#work-cards 原本只有一行註解，16 個產品與全部文案要等
# work-v3.js 在瀏覽器裡跑完才生出來——GPTBot / ClaudeBot 這類不執行 JS 的
# AI 爬蟲讀到的只有 JSON-LD 摘要，看不到真正內容。
echo "▶ Prerendering Selected Work cards into static HTML (for AI crawlers)..."
node scripts/prerender-work.mjs

echo "▶ Sanity checks..."
for f in site/index.html site/ja/index.html site/zh/index.html site/404.html site/CNAME site/robots.txt site/sitemap.xml site/llms.txt site/assets/og.png site/assets/crealize-mark.webp site/assets/crealize-mark.png; do
  [ -f "$f" ] || { echo "❌ missing $f" >&2; exit 1; }
done
grep -q "application/ld+json" site/index.html || { echo "❌ JSON-LD missing" >&2; exit 1; }

# 關鍵渲染路徑：Google Fonts 不得擋住首次繪製。放這裡（build 之後、部署之前）
# 是因為 head 由 build-site.mjs 的字串模板產生 —— 任何一次重新 export 或
# 「把兩條 link 合回一條」都會把 5 秒 FCP 加回去，而其他 gate 測的是執行 JS
# 之後的 DOM，那時字體早載完了，一道都不會紅。set -e 會讓它的 exit 2 中止部署。
echo "▶ Critical-path audit (Google Fonts 非阻擋)..."
node scripts/audit-critical-path.mjs

# 無障礙：skip link / lang="ja" / aria-current / 語言選單 visibility / aria-invalid / 選單按鈕名稱。
# 與 critical-path 同理 —— head 與 nav 都是 builder 字串模板，re-export 會靜靜還原。
echo "▶ A11y audit（skip link · lang=ja · aria-current · langmenu visibility）..."
node scripts/audit-a11y.mjs

# 產品對外連結：逐一打真實 URL，200 且本文含產品名。需網路，只在部署前跑。
echo "▶ Links audit（13 個產品頁 200 + 含產品名）..."
node scripts/audit-links.mjs

echo "▶ Key-visual audit (母版規格 + 三語 registry 對帳)..."
node scripts/audit-kv.mjs
node scripts/audit-kv-registry.mjs
node scripts/audit-kv-quality.mjs
node scripts/audit-kv-variants.mjs

echo "▶ Selected Work v3 驗收 (AC 見 .claude/ac.md)..."
node scripts/audit-work-v3.mjs

echo "▶ 窄視口導覽驗收（桌面導覽在 ≤1080px 被隱藏，必須有可用的替代入口）..."
node scripts/audit-nav.mjs

echo "▶ 爬蟲可見性驗收（不執行 JS 的原始 HTML 必須含完整內容）..."
node scripts/audit-prerender.mjs

# 前面每一道都在 1440px 或「390px 寬的 iframe」裡量 —— 那量不到真手機：
# iframe 的高度是我們自己給的（測不出 modal 溢出把關閉鈕推出畫面），
# 而且 iframe 永遠是 hover:hover（測不出觸控裝置看不到卡片動畫）。
# 2026-08-09 兩個上線缺陷都是從這個盲區溜出去的。
echo "▶ 真手機模擬驗收（390×844 mobile=true：modal 關得掉、動態看得到）..."
node scripts/audit-mobile-modal.mjs

# 我們用 -t/--dotfiles 是因為 GitHub Pages 需要 .nojekyll。代價是 site/ 裡任何
# dotfile 都會被公開發佈。2026-08-08 發現 gh-pages 上殘留 .cursorrules（8229 bytes，
# 公司內部開發規範）與 .gitignore，兩者皆 HTTP 200 可公開讀取。
# 白名單以外的 dotfile 一律中止部署。
# 2026-08-09：dotfile 白名單擋不到**非** dotfile 的殘留物。獨立驗收實測，
# audit-work-v3 的暫存頁 site/__audit-work-v3.html 就這樣被 auto-save cron
# commit 進公開 repo。gh-pages 的預設 src 是 '**/*' 且不讀 .gitignore，
# 所以只要檔案在 site/ 下就會被發佈。
echo "▶ 非 dotfile 殘留物檢查（gh-pages 會把 site/ 下所有檔案發佈出去）..."
STRAY_TMP=$(find site -name "__*" -o -name "*.tmp" -o -name "*.bak" | head -20)
if [ -n "$STRAY_TMP" ]; then
  echo "❌ site/ 內有暫存／備份檔，部署會把它們公開：" >&2
  echo "$STRAY_TMP" >&2
  exit 1
fi

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
# 2026-08-09（第二次同類缺口）：css/ 與 js/ 也不在任何比對裡。
# 版面與互動的改動幾乎都只動這兩類檔，index.html 由 builder 產生、內容不變，
# 於是「線上內容 = 本次 build 產物」照樣綠燈 —— 對這類改動等於完全沒驗。
echo "▶ 樣式與腳本比對（版面／互動改動只會動到這兩類檔）..."
for attempt in 1 2 3; do
  stale=""
  for f in site/css/*.css site/js/*.js site/js/i18n/*.js; do
    rel="${f#site/}"
    lh=$(curl -s -H "Cache-Control: no-cache" "https://crealize.llc/$rel" | shasum -a256 | cut -d' ' -f1)
    bh=$(shasum -a256 "$f" | cut -d' ' -f1)
    [ "$lh" = "$bh" ] || stale="$stale $rel"
  done
  [ -z "$stale" ] && { echo "   ✓ $(ls site/css/*.css site/js/*.js site/js/i18n/*.js | wc -l | tr -d ' ') 個樣式／腳本線上位元一致"; break; }
  [ "$attempt" = "3" ] && { echo "❌ CDN 未更新：$stale" >&2; fail=1; break; }
  sleep 20
done

# 2026-08-09：icons/ 原本不在這個迴圈裡。XunNi 換 icon 那次，部署腳本從頭到尾
# 報綠燈，卻**一張 icon 都沒驗** —— 只能靠人手動 curl 才知道有沒有真的上線。
# 覆蓋面不足的驗證，比沒有驗證更危險，因為它會產生「已驗過」的錯覺。
echo "▶ 圖片資產比對（主視覺 + 產品 icon + 手機縮圖；CDN 可能落後，最多重試 6 次）..."
for attempt in 1 2 3 4 5 6; do
  stale=""
  for f in site/assets/kv/*.webp site/assets/icons/*.webp site/assets/shots/*.webp; do
    rel="${f#site/}"
    lh=$(curl -s -H "Cache-Control: no-cache" "https://crealize.llc/$rel" | shasum -a256 | cut -d' ' -f1)
    bh=$(shasum -a256 "$f" | cut -d' ' -f1)
    [ "$lh" = "$bh" ] || stale="$stale $rel"
  done
  [ -z "$stale" ] && { echo "   ✓ $(ls site/assets/kv/*.webp site/assets/icons/*.webp site/assets/shots/*.webp | wc -l | tr -d ' ') 張圖片線上位元一致"; break; }
  [ "$attempt" = "6" ] && { echo "❌ CDN 未更新：$stale" >&2; fail=1; break; }
  sleep 20
done

[ "$fail" = "0" ] || { echo "❌ 上線驗證失敗 —— 請 rollback 或 forward-fix" >&2; exit 1; }

echo "✅ Deployed to crealize.llc（三語 200；gh-pages 無多餘 dotfile；內容雜湊相符）"
