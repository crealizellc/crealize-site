# Crealize Corporate Site

線上：**https://crealize.llc** — 三語（`/` en · `/ja/` · `/zh/`），Tokyo product studio 形象站。

---

## 先讀這段：repo 裡有兩套程式碼，只有一套會上線

| | 上線的 | 已停用的 |
|---|---|---|
| 路徑 | `site/`（手工靜態站，66 檔） | `src/` `pages/` `components/` `i18n/` `middleware.ts.bak` |
| 技術 | 純 HTML + CSS + vanilla JS | Next.js 14 + React + next-intl |
| 最後改動 | 2026-08-09 | **2025-09-10** |
| 上線路徑 | `site/` → `gh-pages` 分支 → GitHub Pages → crealize.llc | 無 |

**驗證方式（隨時可重跑）**

```bash
# 1) crealize.llc 由哪個分支服務
gh api repos/crealizellc/crealize-site/pages   # → source.branch=gh-pages, cname=crealize.llc

# 2) 線上內容 = 本機 site/（三語逐 byte 相同）
for p in "" ja/ zh/; do
  echo "$p $(curl -sL https://crealize.llc/$p | shasum -a256 | cut -d' ' -f1)"
  echo "  local $(shasum -a256 site/${p}index.html | cut -d' ' -f1)"
done

# 3) 建置鏈完全不碰 Next.js 那套
grep -cE "src/|pages/" scripts/build-site.mjs   # → 0
```

`package.json` 仍留著 `next` / `react` / `framer-motion` 依賴與 `build`、`dev` 腳本 —— 它們對應的是
已停用的那套，**跑了不會改變線上任何東西**。要改網站請改 `site/` 與其上游（見下）。

> `docs/_legacy-README-nextjs.md` 是這份 README 的前一版，整份在描述 Next.js 架構。留檔備查，
> 但它描述的不是現在的線上站。

---

## 建置與部署鏈

```
docs/design-system/source/claude-design-export/Crealize Corporate Site.html   ← 輸入 1：DOM 結構
site/js/i18n/en.js（CRZ_I18N.work）                                           ← 輸入 2：產品清單（16 個）
      │
      ├─ scripts/gen-work-v3.mjs      → site/js/work-v3.js
      ├─ scripts/build-site.mjs       → site/{index,ja/index,zh/index}.html + sitemap.xml + llms.txt
      └─ scripts/prerender-work.mjs   → 把 16 張卡片預渲染進靜態 HTML（給不執行 JS 的 AI 爬蟲）
      │
      └─ scripts/deploy-gh.sh → gh-pages 分支 → crealize.llc
```

**順序不可換**：`build-site` 每次整份重寫 `index.html`，所以 `prerender-work` 必須排在它之後。
`deploy-gh.sh` 已把順序寫死，直接跑它即可。

```bash
npm run deploy:gh          # 建置 + 部署 + 部署後驗證（需 .env.local 內的 GH_TOKEN）
bash scripts/rollback-gh.sh --dry-run   # 先看退回哪一版
bash scripts/rollback-gh.sh             # 退回 gh-pages 前一個 commit
```

`deploy-gh.sh` 部署**後**會自己驗三件事，任一失敗即 exit 非 0：
gh-pages 上除 `.nojekyll` 外無 dotfile 外洩 · 三語 HTTP 200 且線上 sha256 = 本次 build 產物 · 主視覺資產位元相同。

**手工維護、builder 不產生的 8 個檔**：`site/css/{sections,site,tokens,work-modal}.css` 與
`site/js/{atmosphere,hero,site,work-modal}.js`（同目錄的 `site/js/work-v3.js` 是 `gen-work-v3.mjs`
的產物，不算手工檔）。8 個之中 7 個已與 design export 分岔，只有 `site/js/atmosphere.js` 仍與
export 逐 byte 相同。**不要整包覆蓋 `site/js/`** —— 會毀掉手工的 hero / site / work-modal / i18n。

---

## 稽核

```bash
npm run check:kv         # 主視覺母版規格 + 三語 registry 對帳
npm run check:work       # Selected Work v3 資料完整性
npm run check:nav        # 三語 × 窄/寬視口導覽
npm run check:prerender  # 不執行 JS 的原始 HTML 必須含完整 16 張卡片與正文
npm run check:mobile     # 390×844 真手機模擬：modal 關得掉、動態看得到、reduce-motion 正確
npm run check:design     # design token drift lint（色系家族 + 字體白名單）
npm run check:perf       # 關鍵渲染路徑：Google Fonts 不得擋住首次繪製
```

`npm run check:all` 會把上面全部加上 `check:todo`、`check:rules` 一起跑。

### 效能基線（2026-09-04 實測，Lighthouse 12.8.2 · mobile · 同機同本機 server）

|  | 原始 | 字體修正 | ＋圖片修正 |
|---|---|---|---|
| Performance | 60 | 93 | **97** |
| First Contentful Paint | 6.5 s | 1.7 s | **1.7 s** |
| Largest Contentful Paint | 7.4 s | 2.9 s | **2.4 s** |
| Total Blocking Time | 0 ms | 130 ms | **0 ms** |
| CLS | 0.002 | 0.002 | **0** |

**字體**：根因是 Google Fonts 那條 `rel="stylesheet"` 擋住渲染，而其中 **Noto Sans JP
一家就是 344 KB CSS / 372 個 `@font-face`**（其餘四個家族合計 15 KB），瀏覽器得把 372 條
unicode-range 全解析完才畫得出第一個字。現在拆成兩條、都以 `media="print"` + `onload`
移出關鍵路徑，`<noscript>` 保留無 JS fallback。字體最終仍全部載入（改前改後
`document.fonts` 都是 405 faces / 5 個家族 / 各元素 computed font-family 逐項相同）。

**Logo**：兩處 `<img>` 都指向 480×383 的 PNG（41,366 B），但只畫成 21 px（nav）與
26 px（footer）高 —— 像素密度 18x / 15x。換成 120×96 的 WebP（1,940 B，**-95.3%**）
並補上 `width`/`height`：密度降到 4.6x / 3.7x（仍高於 3x retina 所需），渲染尺寸只差
0.07 px。`favicon` / `apple-touch-icon` / JSON-LD 的 logo 仍用 PNG，刻意不動 —— Safari
的 apple-touch-icon 不吃 WebP。

⚠️ 本機 `python -m http.server` 沒有 gzip，所以它的 Lighthouse 會報「Enable text
compression 910 ms」。**那是假象** —— 線上 GitHub Pages 實測三個資源都回
`content-encoding: gzip`，`uses-text-compression` 在線上是滿分。同理
`uses-long-cache-ttl` 的 `max-age=600` 是 GitHub Pages 的固定值，改不了。

`check:perf` 與 `deploy-gh.sh` 都會擋住這兩件事回歸，兩項檢查都做過真實路徑的反向測試
（把修正還原 → `exit 2`；改回來 → `exit 0`）。

⚠️ **`check:rules` 是假紅燈，不要照著它修**。它檢查的是已停用 Next.js 架構的目錄結構
（`scripts/check-rules.js` 要求 `src/types` 存在）。它唯一的紅燈與線上站無關 ——
`src/` 底下的東西沒有任何一行會上線。同理 `scripts/dev-guide.js` 也只認得那套舊架構。

---

## 設計系統

真相源：`docs/design-system/tokens/crealize.tokens.json`（DTCG，自 `tokens.css` 機械萃取）。
Claude Design canvas：https://claude.ai/design/p/dbbc5234-c185-49b2-97b2-09bf8b59aaf0

送任何 Claude Design brief 前先把契約原文嵌進 brief 開頭並明令延用；改完視覺檔跑
`npm run check:design` 與 `npm run check:kv`。細節見 `CLAUDE.md`。

---

## 文檔

| 路徑 | 內容 |
|---|---|
| `CLAUDE.md` | **動手前必讀** —— 架構真相、五個踩坑、DesignSync 取件法、設計系統契約 |
| `docs/architecture/` | 技術棧、程式碼規範、文檔關係 |
| `docs/design-system/` | 設計系統（210 檔，含 Claude Design export 原始碼） |
| `docs/deployment/` | GitHub Pages 部署說明 |
| `docs/development/` | 開發計畫 |
| `docs/handoff/`、`handoffs/` | 跨 session / 跨 agent 交接包 |
| `docs/website-content.md` | 站內文案 |
| `docs/CHANGELOG.md` | 變更紀錄 |

---

## 分支

| 分支 | 狀態 |
|---|---|
| `main` | 開發真相源 |
| `gh-pages` | 部署產物，由 `deploy-gh.sh` 寫入，**不要手改** |
| `public-main` | 與 `main` 完全一致（雙向 0 commit 差異），無需合併 |
| `fix/security-and-deploy-config` | **死分支** —— 2026-04 的 Next.js 時代產物，落後 `main` 83 個 commit，7 個 commit 改的 23 個檔全在已停用的 `src/`/`pages/`/`public/`，對線上站零影響。它帶的 `public/llms.txt` 是手工舊版，已被 builder 生成的 `site/llms.txt`（16 產品）取代。**合併它沒有價值，只會攪亂死碼路徑。** 其對應的 PR #1 早在 2026-04-14 已 merge。 |
