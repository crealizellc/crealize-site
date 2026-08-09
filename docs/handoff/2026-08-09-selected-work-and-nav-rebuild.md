# 交接文件 — Selected Work 重做 + 導覽修復 + 爬蟲可見性

**日期**：2026-08-09（本 session 開自 MacBook Air）
**分支**：`public-main`（12 commits，已推送並部署到 `crealize.llc`）
**狀態**：已上線，生產環境獨立複驗通過

> 這份文件記錄「做了什麼、為什麼、怎麼驗證的」，給下一個接手的人（可能是未來的
> 我自己）不用重新爬一次 12 個 commit message 才搞懂現況。

---

## 一句話總結

Yves 實際點開網站發現兩個真缺陷（導覽在筆電寬度被誤收進選單、modal 點開內容比
卡片還少），修正過程中另外查出「AI 爬蟲讀不到任何產品內容」與「XunNi icon 用錯」
兩個獨立問題，一併修掉。gate 從 5 道加到 7 道，各自都做過負面測試證明真的擋得住。

---

## 修了什麼（依對外可見程度排序）

### 1. 導覽斷點錯誤：1080px → 860px（真缺陷，Yves 截圖抓到）

**症狀**：筆電寬度（800–1080px）下，桌面導覽被隱藏，精簡選單的按鈕還沒做出來
（那次 push 的版本），四個區塊完全無法跳轉。

**根因**：`site/css/site.css` 的斷點是猜的，沒有量過。CDP 實測三語 nav 在不隱藏
`.nav__links` 時只需要 en 765 / ja 791 / zh 680 px。

**修法**：斷點改 860px（791+餘裕）；精簡選單面板字級從 `--fs-lead`（27px）降到
`--fs-body`；加捲動即關閉（面板是 `position:fixed`，不會自己收）。

**驗證**：`scripts/audit-nav.mjs`（新增）三語 × 390px（該有選單）× 900px（不該有
選單）共 21 項斷言，負面測試把斷點退回 1080 → exit 2 精準指出「訂得比實需寬」。

### 2. Modal 點開內容比卡片還少（真缺陷，Yves 直接問「那還有必要打開嗎」）

**症狀**：卡片把整段正文印在外面，modal 只印 registry 的一句 line + stack chips。

**修法**：倒過來——卡片變成鉤子（主視覺 + 名稱 + 定位句 + 「看完整說明→」），
完整正文搬進 modal。正文同時放進卡片 DOM 的 `.card__detail`（`hidden` 屬性，不是
`display:none`），這樣 modal 與（後面會提到的）爬蟲吃的是同一份字串，不可能分岔。

**驗證**：新增 AC-2b，逐張卡比對「卡片外顯字數」對「modal 顯示字數」，三語最低
3.2×～4.5×。負面測試：把正文塞回卡片重現原缺陷 → 48 張全數被抓出。

### 3. Modal 打開的圖沒有循環動態演示（Yves 主動要求）

卡片本來就有一套「底圖 + 會動的向量 motif + 官方 icon」的三層混合系統。做法是
把卡片的 `.stage` 節點整組複製進 modal，而不是重新做一套——保證兩邊畫的是同一個
東西。過程中連續踩到三層問題（modal 掛在 `<body>` 外、不在 `#work` 容器內，卡片
的結構層與動畫規則全部鎖死 `#work` 祖先），修完後也順手補上被我一開始漏掉的
`prefers-reduced-motion: reduce` 支援（modal 的 `is-looping` 覆寫原本會反過來蓋掉
關閉規則，讓暈動症使用者關不掉動畫）。

**驗證**：新增 AC-9，用 Web Animations API 量 `currentTime` 真的在前進（不是只有
CSS 宣告但沒生效），三張間隔 900ms 的截圖雜湊三個都不同，`--force-prefers-reduced-motion`
模擬下 modal 內 0 個元素在動。負面測試：拿掉 `is-looping` 覆寫 → exit 1。

### 4. AI 爬蟲讀不到任何產品內容（實查發現，非 Yves 指出）

**症狀**：`#work-cards` 在原始 HTML 裡只有一行註解
`<!-- 12 product cards injected by work-v3.js -->`（那個「12」還是舊數字）。
16 個產品、全部文案都是 `work-v3.js` 在瀏覽器裡才生出來的。Google 會執行 JS 還
索引得到，但 **GPTBot / ClaudeBot / PerplexityBot 這類 AI 爬蟲通常不執行 JS**——
對它們來說整個作品集只剩 JSON-LD 與 llms.txt 的一句摘要。

**修法**：新增 `scripts/prerender-work.mjs`，用 headless Chrome 載入 build 完的
頁面、等 `work-v3.js` 跑完，把 `#work-cards` 的 `innerHTML` 取回寫回檔案。**模板
只有一份**——靜態版與動態版由同一段 `cardHTML`（`scripts/gen-work-v3.mjs`）產生。

**管線順序是硬約束**：`build-site.mjs` 每次都整份重寫 `index.html`（打回佔位
註解），`prerender-work.mjs` 必須在它「之後」跑。`deploy-gh.sh` 原本沒有呼叫
`gen-work-v3` 也沒有 `prerender-work`，已補上完整順序：
`gen-work-v3 → build-site → prerender-work`。

**驗證**：新增 `scripts/audit-prerender.mjs`，不執行 JS、直接讀原始 HTML（模擬
`curl`），驗三語都有 ≥16 張卡、≥16 段完整正文、純文字擷取讀得到完整內容而不只是
JSON-LD 摘要。**生產環境獨立複驗**：`curl https://crealize.llc/ | grep "reads the
label and tells you"` 有輸出——線上是真的生效，不只是本地測試綠燈。

### 5. XunNi icon 用錯（Yves 指出）

站上原本是一個藍色幾何 X 加網格底，跟 XunNi 產品本體的任何資產都對不上。改用
產品 repo（`/Users/yves/Downloads/XunNi-APP`）的向量母版 `logo_opt_rmbg.svg` 渲染，
沒有照著參考圖重畫。母版、去背版、原生 app 商店 icon 三份落檔到
`docs/design-system/source/harvested/xunni/`，附 `PROVENANCE.md`。

### 6. 其餘較小的修正（本次一併處理）

- `404.html` 硬寫了不在契約內的色碼（早期色板孤兒），改吃 `tokens.css`。
- PurityLens 的 icon（玻璃光圈，本身低對比）在淺色底圖上融掉，補髮絲外框。
- 部署後驗證的覆蓋面：`icons/`（27→43 張）、`css/js`（原本 0 個檔）都補進去了——
  這兩個都是「整條部署腳本綠燈，實際上完全沒驗到本次改動」的真缺口。
- `audit-work-v3.mjs` 的 AC-6（390px 斷言）原本卡在固定 2500ms 抓一次 iframe
  結果的競態，改成輪詢。

---

## Gate 現況：5 道 → 7 道

```bash
npm run check:all
# check:todo → check:rules → check:kv（3支）→ check:work（9個AC）
# → check:nav（新）→ check:prerender（新）→ check:design
```

新增兩道都做過**真實路徑的負面測試**（不是紙上談兵）：

| Gate | 負面測試 | 結果 |
|---|---|---|
| `audit-nav.mjs` | 斷點退回 1080 / 拿掉選單按鈕 | exit 2，訊息精準指出成因 |
| `audit-prerender.mjs` | 重跑 build-site 打回佔位符 | exit 2，訊息精準指出成因 |
| AC-2b（work-v3 內建）| 正文塞回卡片重現原缺陷 | 48 張全數被抓出 |
| AC-9（work-v3 內建）| 拿掉 modal 的 `is-looping` 覆寫 | exit 1，精準指出「沒有 infinite」 |

---

## 部署管線（更新後）

```
scripts/gen-work-v3.mjs      # canvas export + work-copy.json → site/js/work-v3.js
  ↓
scripts/build-site.mjs        # design export HTML + i18n → 三語 index.html（整份重寫）
  ↓
scripts/prerender-work.mjs    # headless Chrome 把卡片固化進原始 HTML（給爬蟲看）
  ↓
七道 check:all
  ↓
gh-pages -d site -b gh-pages  # 實際部署
  ↓
post-deploy verify：dotfile 白名單 / index.html 雜湊 / 12 個 css+js / 43 張圖
```

全部包在 `npm run deploy:gh`（`scripts/deploy-gh.sh`）裡，**手動跑三支 node 腳本的
順序不能顛倒**——顛倒了本機看起來沒事（六道 gate 都測執行 JS 後的 DOM），實際上
爬蟲會看到空的。

---

## 已知未盡事項（誠實列出，不是藏起來）

1. **`idokuta` 文案裡的「Five languages」數字未經驗證。** 本地 `/Users/yves/Projects/idokuta`
   是空目錄，查不到來源。iDokuta 狀態是 `wip`（尚未上線），這是規格宣稱不是已驗證
   事實。低優先——不影響已上線的 shipped 產品，但下次有 idokuta 的真實 spec 時該
   回頭核對。
2. **未做隱私權政策 / 使用條款頁面。** 上一輪已提過：聯絡表單是純 `mailto:`，網站
   本身不收集也不儲存任何資料，工程上沒有非放不可的理由；要不要放是商業/法務
   決策，不是我該替 Yves 做的判斷。
3. **本地 git 憑證對 `crealizellc/crealize-site` 是 403**（帳號 `hanamizukikabukijou`
   無權限）。目前一律用 `.env.local` 的 `GH_TOKEN` 組 token URL 繞過，沒有動使用者
   的 git 帳號設定——這是刻意的，帳號層設定不歸我改。

---

## 回退

```bash
bash scripts/rollback-gh.sh --dry-run   # 先看會做什麼
bash scripts/rollback-gh.sh             # 真的退回 gh-pages 前一版，推完自動 curl 複驗
```

`git rev-parse origin/gh-pages` 目前指向本次部署（`npm run deploy:gh` 的最後一次
執行）。`public-main` 上的 12 個 commit 各自獨立、可個別 revert。

---

## 相關檔案索引

- `scripts/audit-nav.mjs` — 導覽可用性（新增）
- `scripts/audit-prerender.mjs` — 爬蟲可見性（新增）
- `scripts/prerender-work.mjs` — 卡片靜態固化（新增）
- `scripts/rollback-gh.sh` — 生產環境回退（新增）
- `scripts/audit-work-v3.mjs` — AC-2b（modal 內容量）、AC-9（循環動畫）為本次新增
- `docs/design-system/source/harvested/xunni/PROVENANCE.md` — XunNi 素材出處
