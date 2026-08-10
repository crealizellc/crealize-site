---
name: product-card
description: 為 crealize.llc 的 Selected Work 新增或重做一張產品卡（AI 底圖 + 程式動態層 + 官方 icon + 三語文案 + JSON-LD 中繼資料）。使用者說「加一個新產品到官網」「重做 XX 那張卡」「Selected Work 要加 XX」時使用。
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

## 一張卡有五個真相源，少填一個就會出事

| 檔案 | 管什麼 | 漏了會怎樣 |
|---|---|---|
| `docs/design-system/product-palette.json` | 品牌色（附 `$evidence`） | AI prompt 沒有色彩依據 |
| `docs/design-system/work-copy.json` | 三語 `pos` + `body` | `gen-work-v3.mjs` exit 2 |
| `site/js/i18n/{en,ja,zh}.js` 的 `CRZ_I18N.work` | 卡片 registry（名稱／tag／line／img／stack／status） | 產品數對不上，build 中止 |
| `scripts/build-site.mjs` 的 `PRODUCTS` | JSON-LD + `llms.txt` 的中繼資料 | **交叉驗證會擋下**；漏了搜尋引擎與 AI 爬蟲看不到這個產品 |
| `scripts/gen-work-v3.mjs` 的 `M` | 會動的那層 motif | 卡片只剩靜態底圖 |

⚠️ **`site/js/work-v3.js` 是 `gen-work-v3.mjs` 產生的，永遠不要直接改**
（2026-08-09 踩過：改了它，下一次 build 就無聲蓋掉）。

## 為什麼是這個分工（踩過的坑，別重蹈）

| 做法 | 結果 |
|---|---|
| 純幾何 SVG | 「太幾何了，有點像公家機關」—— 沒材質、沒光線、沒景深 |
| AI prompt 寫「photographed still life / 紙、墨、黃銅、柔光」 | 「跟飯店的廣告一樣」—— 那是精品飯店 DM 的配方 |
| 手機外框裝產品截圖 | 「故意放個手機是 10 年前的設計」。**永遠不要放裝置外框** |
| 純文字 prompt 生圖 | 成品與產品識別毫無關係。**一定要上傳官方 icon 當參考** |
| 把英文 slogan 燒進圖裡 | 日文/中文頁會出現「圖上英文 + 下面本地化文案」的重複 |
| 把 1600×1200 橫向圖塞進直立框 | `object-fit:cover` 把字裁一半，看起來像破圖 |
| 照著參考圖「重畫」一個 icon | 那是捏造。**icon 一律取自產品自己的向量母版** |

## 步驟

底圖有兩個來源，`build-kv-assets.mjs` 會**優先用 AI 版，沒有就退回程式版**：
`site-assets/kv-ai/`（ChatGPT 生成）→ 沒有 → `site-assets/kv-gen/`（程式生成）。
這是刻意的備援 —— 額度會用完、生成會失敗，但站台不能因此開天窗。

### 1. 備素材

```
site-assets/icons/<slug>.png    官方 app icon
site-assets/shots/<slug>.png    真實產品畫面（當 AI 的第二張參考圖）
```

**icon 必須來自該產品自己的向量母版或商店上架資產**，順序：
產品 repo 的 SVG/母版 → App Store 1024px → Play 圖示。
落檔到 `docs/design-system/source/harvested/<slug>/` 並附 `PROVENANCE.md` 寫明取自哪裡。
**不准照著參考圖重畫一個「看起來像」的**（2026-08-09 XunNi：站上那個藍色幾何 X
與產品本體任何資產都對不上，重新從 `logo_opt_rmbg.svg` 渲染才對）。

到 `docs/design-system/product-palette.json` 加一筆：品牌色（**附 `$evidence` file:line**，不准憑印象填）、
tone、provenance。這個檔是 AI prompt 的唯一色彩來源。

### 2. 事實查核（寫任何一個字之前先做）

卡片上的每一句都是公司對外的宣稱。**二手來源一律不算數** —— 專案 memory、
舊 CLAUDE.md、前一個 session 的結論，全部只是訊號。

| 要寫的欄位 | 必須的第一手證據 |
|---|---|
| `status: 'shipped'` | `curl` 商店頁 200 + 含 app 名。iOS：`itunes.apple.com/search?term=…&entity=software` 或 `lookup?bundleId=…`；Android：`play.google.com/store/apps/details?id=…`（順便看有沒有「早期アクセス」標記） |
| `os`（PRODUCTS） | **只寫查得到的平台**。查不到 iOS 就別寫 iOS（Tendo、Mairi 都是這樣收斂的） |
| 任何數字（幾種語言、幾個國家、幾萬用戶） | 產品自己的線上站或商店頁。**先問「這個數字在講什麼」** —— 2026-08-09 iDokuta 的「六」是 app UI 的 locale 數（5 語言 + 日文），被當成「支援六種語言」寫上去 |
| 產品類別 | 不得誇大成受管制類別。iDokuta 曾被寫成 telehealth／オンライン診療，實際是語言工具 —— 而同一個 modal 的正文自己就寫著「這是語言工具，不是醫療建議」。宣稱診療有醫療廣告合規風險 |

`build-site.mjs` 的 `cat`（`applicationCategory`）要用 schema.org 的
**軟體類別**（`HealthApplication` / `GameApplication` / `FinanceApplication` /
`BusinessApplication` / `LifestyleApplication`…）。`MedicalApplication` 是
`MedicalEntity` 的子型別，**不是合法的 applicationCategory**。
不是 App 的案子（客戶品牌案）用 `CreativeWork`，別硬套 `SoftwareApplication`。

### 3. AI 生成底圖

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
換帳號要使用者本人登入 —— agent 不輸入密碼。等不了就先用程式版底圖（步驟 5）頂著。

prompt 的硬約束已寫在腳本裡，改動時**不要拿掉**這幾條：
無文字/logo · 無手機或任何裝置 · 非實體工藝靜物 · 非扁平幾何/資訊圖表。

### 4. 文案 —— 卡片是鉤子，modal 才是內容

`docs/design-system/work-copy.json` 一個 slug 一筆，三語各兩個欄位：

| 欄位 | 去哪裡 | 寫什麼 |
|---|---|---|
| `pos` | 卡片上的定位句（`.card__pos`） | 一句人話說清楚「這是什麼」。不是技術規格 |
| `body` | 點開後的完整正文（`.card__detail` → modal） | 使用者的問題 → 產品怎麼處理 → 一個經證實的重要設計決定 |

**`body` 必須明顯比 `pos` 長 —— gate `AC-2b` 要求 modal 顯示字數 ≥ 卡片外顯字數的 1.5 倍。**
這條是 2026-08-09 加的：當時卡片把整段正文印在外面、modal 只剩一句，Yves 直接問
「那還有必要打開嗎」。現有 16 張的實測比是 3.2×～4.5×。

registry（`i18n/*.js`）另有一個 `line`，會印進 `.work-modal__line`，**在 modal 裡就排在
`body` 上方**。所以 `line` 與 `body` 講的事必須一致 —— iDokuta 那次就是 `line` 說六種語言、
`body` 說五種語言，同一個畫面上下打架。

寫的時候問自己：這段話有沒有講出「為什麼是我們做得比較好」？只描述功能不算。
**三語各自撰寫，不是互相翻譯** —— 日文不要英式語序，中文不要日式漢語。
避免抽象比喻、與未具名競品比較、刻意炫技的語氣。

### 5. 程式動態層

在 `scripts/build-kv-code.mjs` 的 `P` 加一筆：`ink/a/b/c` 四個品牌色、`slogan`、`motif`。
注意 `build-kv-code.mjs` 預設**只出底圖**（不含 motif、不含 icon 與 slogan）——
那三層是頁面上即時疊的，底圖再畫一次會出現殘影。`--with-motif` / `--with-text` 只用於單張比稿。

**motif 必須來自該產品真實的核心動作**（Fudeto 是一筆畫的螺旋、Tendo 是逐點亮起的
Hamiltonian path、Kichitto 是收據落下變成帳上一列），不是隨便找個幾何形。

同一份 motif 定義也要進 `scripts/gen-work-v3.mjs` 的 `M`，那才是線上會動的那一層。

#### 一張卡的動畫實際上長這樣（三層疊在同一個 `.stage` 裡）

`gen-work-v3.mjs` 產生的 DOM：

```html
<div class="stage" style="--tint:…">
  <img class="stage__bg">   ← AI 底圖（靜態）
  <svg class="m">…</svg>    ← motif，會動的那層
  <img class="stage__icon"> ← 官方 app icon
</div>
```

觸發：卡片捲進視窗 → `.card` 加 `is-in`、`.stage` 加 `is-live` → motif 開始播。

#### modal 打開時，是把卡片那個 `.stage` 整組複製過去，不是另做一套

`work-modal.js` 的 `fill()`：

```js
const srcCard = document.querySelector('.card[data-work-index="' + i + '"] .stage');
const clone = srcCard.cloneNode(true);
clone.classList.add('is-live', 'is-looping');   // 直接開始播，而且無限循環
```

**所以做新卡時不必為 modal 另外準備任何東西** —— 同一份 DOM、同一組 `@keyframes`，
不可能跟卡片畫得不一樣。這是刻意的：兩邊各做一套必然會分岔。

⚠️ **由此推出一條 CSS 規則：`.stage` 這一層的結構樣式不准 scope 在 `#work` 底下。**
modal 掛在 `<body>` 上、不在 `#work` 容器內，clone 過去就吃不到祖先受限的規則。
`sections.css` 的 `.stage` / `.stage__bg` / `.m` / `.stage__icon` 都是**無前綴**的
（`#work` 前綴只保留給 hover / focus 這類互動狀態）。2026-08-09 踩過：加了前綴後
modal 整塊塌成純黑。`work-modal.css` 只補 modal 專屬的尺寸覆寫（`.work-modal__shot .stage`）。

⚠️ **motif 必須耐得住無限循環**。桌機的卡片是進場播一次（`animation: … both`），
靠 `mouseenter` 重播；但**觸控裝置沒有 hover**，所以卡片進入畫面中央帶時會被加上
`.is-looping`，把 `animation-iteration-count` 蓋成 `infinite` —— modal 則是一打開就循環。
設計 motif 時要讓它**首尾接得起來**，否則會看到一個突兀的跳接。

`.is-looping` 的規則包在 `@media (prefers-reduced-motion: no-preference)` 內 ——
**不要把它改成無條件規則**。work-modal.css 在 sections.css 之後載入，無條件的
`!important` 會靠「後載入贏」蓋掉 reduce-motion 的 `animation: none !important`，
等於幫暈動症使用者把動畫重新打開。

備援：AI 拿不到圖時，`node scripts/build-kv-code.mjs --only <slug>` 可以純程式產出整張底圖。

### 6. 轉資產 + 接進站台（順序是硬約束）

```bash
node scripts/build-kv-assets.mjs      # kv-ai/ + icons/ → site/assets/{kv,icons}/*.webp
node scripts/gen-work-v3.mjs          # 重生 site/js/work-v3.js
node scripts/build-site.mjs           # 三語頁（每次都整份重寫 index.html）
node scripts/prerender-work.mjs       # 把卡片固化進原始 HTML —— 必須在 build-site 之後
```

**`prerender-work` 漏跑或跑錯順序，新產品對不執行 JS 的爬蟲（GPTBot / ClaudeBot /
PerplexityBot）就是不存在的。** `build-site.mjs` 每次都會把 `#work-cards` 打回佔位註解，
所以 prerender 一定在它後面。`npm run deploy:gh` 內已按正確順序串好。

### 7. 驗收（八道全綠才算完成）

```bash
npm run check:all
# check:todo → check:rules → check:kv（3支）→ check:work（AC-1..AC-9）
# → check:nav → check:prerender → check:mobile → check:design
```

新產品最容易踩的四道：

| Gate | 會紅的原因 |
|---|---|
| `check:work` **AC-2b** | `body` 沒有比 `pos` 長 1.5 倍 |
| `check:work` **AC-9** | modal 打開後找不到 `.stage.is-looping`（clone 沒發生）、`.stage__bg` 沒載入（結構層 CSS 又被 `#work` 鎖住了）、或 `no-preference` 下 0 個元素 `iteration=infinite` |
| `check:prerender` | 忘記跑 `prerender-work.mjs`，原始 HTML 少一張卡 |
| `check:mobile` **M-5** | 卡片本身在觸控裝置上沒循環（`COARSE` 分支或 `.is-looping` 選擇器被改壞） |

AC-9 與 M-5 各自還有一次 `--force-prefers-reduced-motion` 的複驗：
reduce-motion 下**必須 0 個元素在動**。這條是防止「為了讓動畫循環而蓋掉無障礙設定」。

再用 Chrome headless 三語各拍一張目視，**而且要拍 390px 的手機版並實際點開 modal**。
**不要只看 gate 綠燈就宣告完成** —— 2026-08-09 的獨立驗收證明過，七條 AC 裡有四條
在該紅時仍會綠；同一天上線的兩個缺陷（手機看不到動畫、modal 關不掉）全部通過了當時
的七道 gate。發現 gate 該紅沒紅，**先補 gate 並做負面測試**，再繼續做卡片。

### 8. 上線

```bash
npm run deploy:gh
```

**發佈前一定要 Yves 看過截圖**：版面美感是他的判斷，不是我的。
部署後**自己 curl 複驗**，不要採信腳本的自我回報：三語 200、雜湊與本地一致、
新產品的字串在 `llms.txt` 與原始 HTML 裡都查得到。

回退：`bash scripts/rollback-gh.sh --dry-run` → `bash scripts/rollback-gh.sh`。
