---
name: product-card
description: 為 crealize.llc 的 Selected Work 新增或重做一張產品卡（AI 底圖 + 程式動態層 + 官方 icon + 三語文案）。使用者說「加一個新產品到官網」「重做 XX 那張卡」「Selected Work 要加 XX」時使用。
---

# Selected Work 產品卡 — 固定流程

官網是**美術與技術的展示頁**，不是型錄。所以每張卡都是混合的：
AI 負責它擅長的（材質、光線、景深），程式負責它擅長的（會動、向量清晰、字不會爛）。

```
底層  site/assets/kv/<slug>.webp      ← AI 生成的品牌氛圍底圖（靜態）
上層  work-v3.js 的 motif             ← 程式即時渲染的動態 SVG，取自該產品真實機制
角落  site/assets/icons/<slug>.webp   ← 該產品官方 app icon，統一尺寸與位置
文字  docs/design-system/work-copy.json ← 三語各自撰寫，統一字體字級，**不燒進圖裡**
```

## 為什麼是這個分工（踩過的坑，別重蹈）

| 做法 | 結果 |
|---|---|
| 純幾何 SVG | 「太幾何了，有點像公家機關」—— 沒材質、沒光線、沒景深 |
| AI prompt 寫「photographed still life / 紙、墨、黃銅、柔光」 | 「跟飯店的廣告一樣」—— 那是精品飯店 DM 的配方 |
| 手機外框裝產品截圖 | 「故意放個手機是 10 年前的設計」。**永遠不要放裝置外框** |
| 純文字 prompt 生圖 | 成品與產品識別毫無關係。**一定要上傳官方 icon 當參考** |
| 把英文 slogan 燒進圖裡 | 日文/中文頁會出現「圖上英文 + 下面本地化文案」的重複 |
| 把 1600×1200 橫向圖塞進直立框 | `object-fit:cover` 把字裁一半，看起來像破圖 |

## 步驟

底圖有兩個來源，`build-kv-assets.mjs` 會**優先用 AI 版，沒有就退回程式版**：
`site-assets/kv-ai/`（ChatGPT 生成）→ 沒有 → `site-assets/kv-gen/`（程式生成）。
這是刻意的備援 —— 額度會用完、生成會失敗，但站台不能因此開天窗。

### 1. 備素材

```
site-assets/icons/<slug>.png    官方 app icon（App Store 1024px / Play / repo 內）
site-assets/shots/<slug>.png    真實產品畫面（當 AI 的第二張參考圖）
```

到 `docs/design-system/product-palette.json` 加一筆：品牌色（**附 `$evidence` file:line**，不准憑印象填）、
tone、provenance。這個檔是 AI prompt 的唯一色彩來源。

### 2. AI 生成底圖

```bash
bash ~/.claude/scripts/automation-chrome.sh 0          # 固定 profile，別另開 Chrome
node scripts/gen-kv-chatgpt.mjs --only <slug>          # → site-assets/kv-ai/<slug>.png
node scripts/gen-kv-chatgpt.mjs --print --only <slug>  # 只看 prompt 不動 Chrome
```

先確認登入狀態（帳號換過會靜默沿用舊的）：

```bash
node -e "import('./scripts/lib/cdp.mjs').then(async({listPages,attach})=>{const t=(await listPages()).filter(p=>p.url.startsWith('https://chatgpt.com')).pop();const s=await attach(t);console.log(await s.evaluate(async()=>(await (await fetch('/api/auth/session',{credentials:'include'})).json())?.user?.email));s.close()})"
```

**額度用完會是這個訊息**：`You've hit the Free plan limit for image generations requests`。
換帳號要使用者本人登入 —— agent 不輸入密碼。等不了就先用程式版底圖（步驟 3）頂著。

prompt 的硬約束已寫在腳本裡，改動時**不要拿掉**這幾條：
無文字/logo · 無手機或任何裝置 · 非實體工藝靜物 · 非扁平幾何/資訊圖表。

### 2b. 文案（Yves 特別在意這塊）

`docs/design-system/work-copy.json` 加一筆，三語各三段，順序固定：

1. **這是什麼** —— 一句人話，不是技術規格
2. **解決誰的什麼問題** —— 具體到那個人在哪個時刻卡住
3. **特別在哪** —— 別人少見、而我們做得好的那一點

寫的時候問自己：這段話有沒有講出「為什麼是我們做得比較好」？
只描述功能不算。**三語各自撰寫，不是互相翻譯** —— 日文不要英式語序，中文不要日式漢語。

### 3. 程式動態層

在 `scripts/build-kv-code.mjs` 的 `P` 加一筆：`ink/a/b/c` 四個品牌色、`slogan`、`motif`。
注意 `build-kv-code.mjs` 預設**只出底圖**（不含 motif、不含 icon 與 slogan）——
那三層是頁面上即時疊的，底圖再畫一次會出現殘影。`--with-motif` / `--with-text` 只用於單張比稿。
**motif 必須來自該產品真實的核心動作**（Fudeto 是一筆畫的螺旋、Tendo 是逐點亮起的
Hamiltonian path、Kichitto 是收據落下變成帳上一列），不是隨便找個幾何形。

同一份 motif 定義也要進 `scripts/gen-work-v3.mjs`，那才是線上會動的那一層。

備援：AI 拿不到圖時，`node scripts/build-kv-code.mjs --only <slug>` 可以純程式產出整張底圖。

### 4. 轉資產 + 接進站台

```bash
node scripts/build-kv-assets.mjs      # kv-ai/ + icons/ → site/assets/{kv,icons}/*.webp
node scripts/gen-work-v3.mjs          # 重生 site/js/work-v3.js
node scripts/build-site.mjs           # 三語頁
```

`site/js/i18n/{en,ja,zh}.js` 的 `CRZ_I18N.work` 要同步加一筆（產品數與 modal 索引的真相源）。
三語的 `p`（定位句）與 `b`（說明）**各自撰寫，不是互相翻譯** —— 每個語言寫成該語言會有的樣子。

### 5. 驗收（全綠才算完成）

```bash
npm run check:work     # AC-1..AC-8，見 .claude/ac.md
npm run check:kv       # 母版規格 + 三語對帳 + 品質不變式
npm run check:design   # token 漂移
```

再用 Chrome headless 三語各拍一張目視。**不要只看 gate 綠燈就宣告完成** ——
2026-08-09 的獨立驗收證明過，七條 AC 裡有四條在該紅時仍會綠。

### 6. 上線

`npm run deploy:gh`。**發佈前一定要 Yves 看過截圖**：版面美感是他的判斷，不是我的。
