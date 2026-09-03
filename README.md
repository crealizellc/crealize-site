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

### 效能基線（2026-09-04，Lighthouse 12.8.2 · mobile）

**先看這個警告**：同一份改動，換一種節流方法，結論從「+37 分」變成「+1 分」。
所以下面四組數字全列，不挑好看的。

| | 模擬節流（Lighthouse 預設）| 實際節流（`--throttling-method=devtools`）|
|---|---|---|
| 本機 before | 60 · FCP 6.5 s | 85 · FCP 3.3 s |
| 本機 after | 97 · FCP 1.7 s | 92 · FCP 2.7 s |
| 線上 before | 61 · FCP 6.4 s | 未測（部署後已覆蓋）|
| **線上 after** | **62 · FCP 6.2 s** | **98 · FCP 2.0 s** |

**跨方法一致、可以當結論的**（皆為線上實測）：
`render-blocking-resources` **5,112 ms → 0 ms**、`unsized-images` **50 → 100**、
`modern-image-formats` **0 → 100**、CLS 0.003 → 0.002。

**不能當結論的**：線上模擬節流的 FCP 只從 6.4 s 動到 6.2 s，即使同一份報告說
render-blocking 已是 0 ms。實際節流（2.0 s）與 Lighthouse 自己的 filmstrip 觀測
（1943 ms 那格出現內容）互相印證，但與模擬值差三倍。**哪個更接近真實使用者，
現有證據判定不了** —— 需要 CrUX field data，尚未取得。詳見
`docs/perf-evidence/2026-09-04/README.md`。

**改了什麼** —— 字體：Google Fonts 一條 `rel="stylesheet"` 綁五個家族，其中
**Noto Sans JP 一家就是 344 KB CSS / 372 個 `@font-face`**（其餘四家合計 15 KB），
連英文頁都得等它 372 條 unicode-range 解析完。拆成兩條、都以 `media="print"` +
`onload` 移出關鍵路徑，`<noscript>` 保留無 JS fallback。字體最終仍全部載入
（改前改後 `document.fonts` 都是 405 faces / 5 個家族 / 各元素 computed
font-family 逐項相同）。Logo：兩處 `<img>` 指向 480×383 的 41 KB PNG 卻只畫成
21 / 26 px，換成 120×96 的 WebP（1,940 B，-95.3%）並補上 `width`/`height`；
`favicon` / `apple-touch-icon` / JSON-LD 仍用 PNG（Safari 的 apple-touch-icon 不吃 WebP）。

⚠️ 本機 `python -m http.server` 沒有 gzip，它的 Lighthouse 會報「Enable text
compression 910 ms」。**那是假象** —— 線上 GitHub Pages 實測三個資源都回
`content-encoding: gzip`，`uses-text-compression` 在線上是滿分。同理
`uses-long-cache-ttl` 的 `max-age=600` 是 GitHub Pages 固定值，改不了。

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
