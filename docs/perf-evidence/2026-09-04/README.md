# 效能修正證據包 — 2026-09-04

對應 PR：`perf/critical-path-and-doc-alignment` → `main`
被驗證的精確 commit：**`2003500a917345c85610be67efce3fa7beda695c`**（工作樹乾淨時跑的，`git status --porcelain` 為空）

三個 commit：

| SHA | 說明 |
|---|---|
| `e1d5afe5128d2e3d14f0c5dd1d5c85acfa17afa2` | docs: README 對齊成線上實況 |
| `a69c1186280a32cd1e97153acf0dfd999278cf1a` | perf(fonts): Google Fonts 移出關鍵路徑 |
| `2003500a917345c85610be67efce3fa7beda695c` | perf(logo): PNG → WebP + 內在尺寸 |
| `dab3532…` | docs: 撤回「60 → 97」，改列四組數字 |
| `e2eb1ba…` | perf(icons): 256² → 144²，16 張省 46% |

---

## 需求 → 程式碼 → 測試 → 已渲染證據

| # | 需求 | 程式碼 | 測試（會紅的那個） | 已渲染／量測證據 |
|---|---|---|---|---|
| 1 | Google Fonts 不得擋住首次繪製 | `scripts/build-site.mjs`（`FONT_LATIN` / `FONT_JP` 兩條 `media="print"` + `onload`，加 `<noscript>`） | `scripts/audit-critical-path.mjs` §1 —— 反向測試：改回單一 `rel="stylesheet"` → `exit 2` | 下方 Lighthouse 表：FCP 6.5s → 1.7s |
| 2 | CJK 字體不得與拉丁字體綁同一條 link | 同上，拆成兩條 | 同檔 §2 —— 反向測試同上，會報「綁在同一條」 | `curl` 逐家量測（下方「字體家族體積」） |
| 3 | 無 JS 環境仍要拿得到 webfont | `<noscript>` 保留阻擋式 link | 同檔 §3 | `grep -c noscript site/index.html` |
| 4 | logo 不得是過大的 PNG | `scripts/build-site.mjs` 第 6 段替換 → `crealize-mark.webp` | 同檔 §5 —— 反向測試：移除替換 → `exit 2` | `mobile-*.webp` / `desktop-*.webp`；DOM 量測見下 |
| 5 | logo 必須有內在尺寸（防版面跳動） | 同上，`width="120" height="96"` | 同檔 §6 | Lighthouse `unsized-images` 50 → 100；CLS 0.002 → 0 |
| 6 | 文檔必須描述真正上線的那套 | `README.md` 重寫、`CLAUDE.md` 補「分支與死碼」 | 無自動測試（文檔） | `grep -cE "src/\|pages/" scripts/build-site.mjs` → `0` |

---

## Lighthouse 量測 —— 線上實測，兩種節流方法都列

**本文件初版只報了「本機 + 模擬節流」的 60 → 97，那個數字不能代表線上。**
以下全部是**線上** `https://crealize.llc/` 的實測，三個階段各量兩種節流方法。

| 線上 crealize.llc · mobile | before | 字體 + logo | ＋ icons（現況）|
|---|---|---|---|
| **模擬節流**（Lighthouse 預設）| 61 | 62 | **77** |
| FCP | 6.4 s | 6.2 s | **4.1 s** |
| LCP | 6.8 s | 6.5 s | **4.1 s** |
| CLS | 0.003 | 0.002 | **0** |
| **實際節流**（`--throttling-method=devtools`）| 未測¹ | 98 | **98** |
| FCP | — | 2.0 s | **1.9 s** |
| LCP | — | 2.0 s | **1.9 s** |

¹ before 的實際節流數字取不到 —— 第一次部署後線上已被覆蓋，無法回頭補。

### 診斷分數（線上，100 = 通過）

| | before | 字體 + logo | ＋ icons |
|---|---|---|---|
| `render-blocking-resources` | 0 | **100** | **100** |
| `unsized-images` | 50 | **100** | **100** |
| `modern-image-formats` | 0 | **100** | **100** |
| `uses-responsive-images` | 0 | 50 | 50（見下）|
| `uses-text-compression` | 100 | 100 | 100 |

### 兩種方法為何差這麼多，以及該信哪個

字體那一步在模擬節流下幾乎沒有反映（61 → 62），**即使同一份報告說 render-blocking
已從 5,112 ms 歸零**；直到 icon 縮小把實際位元數降下來，模擬分數才動（62 → 77）。
也就是說 Lantern 模型對這個站主要吃「總位元數」，對「非阻擋化」的反應很弱。

實際節流從第一步就是 98，之後維持 98（FCP 2.0 → 1.9 s）。

交叉檢查：Lighthouse 自己的 filmstrip（`screenshot-thumbnails`，**未經模型換算的觀測值**）
在字體修正後那一版是 486 / 972 / 1457 ms 三格空白、**1943 ms 那格出現內容** —— 與實際
節流的 2.0 s 相符，與模擬的 6.2 s 差三倍。同版的 LCP 階段分解也指向同一件事：
TTFB 780 ms、Load Delay 0、Load Time 0、**Render Delay 5,723 ms（88%）**，
而所有網路請求 565 ms 就結束了。

**哪個更接近真實使用者，這些證據判定不了** —— 需要 CrUX field data，尚未取得
（PSI 免費配額當天用罄，本站流量是否進得了 CrUX 也未知）。
在那之前，只宣稱「render-blocking 歸零、位元數減少、三項診斷從不及格變滿分」，
不宣稱「站快了幾倍」。

### 方法學教訓

1. **本機 server 的絕對分數不能外推到線上**。本機 after 在實際節流下是 92，
   線上是 98 —— 線上反而更好，因為 GitHub Pages 有 gzip 與 HTTP/2，
   `python -m http.server` 兩者皆無。
2. **同一份改動換個節流方法，結論從 +37 分變成 +1 分**。任何效能數字都必須
   連同「哪個環境 · 哪種節流方法」一起報。
3. **模擬節流對「非阻擋化」不敏感，對「總位元數」敏感** —— 這是本次的第一手觀察：
   字體移出關鍵路徑 +1 分，icon 省 31 KB +15 分。

---

## Icon 尺寸（第三個 commit）

`.stage__icon` 的顯示尺寸是**寫死的** `46px`（`sections.css:643`，`work-modal.css` 無覆寫，
modal 是 `cloneNode` 同一份 DOM），但檔案是 256²，等於 5.56x 密度。
`build-kv-assets.mjs` 的 `ICON_PX` 改 256 → **144**（3.13x，完整覆蓋 3x retina 上限）：

```
合計 16 張   66,870 B → 35,752 B   (-46%，省 31,118 B)
最大單張 puritylens  8,880 → 3,710 B (-58%)
最小單張 meishitto   1,428 →   896 B (-37%)
```

- **原始 PNG 在 `site-assets/icons/` 一個字沒動** —— 要調回去只需改那個數字重跑。
- **KV 16 張逐一比對 sha256，位元完全未動**（`build-kv-assets.mjs` 會重產它們，
  但 cwebp 是確定性的），所以這次的影響面確實只有 icon。
- **視覺零損失，非推論**：新舊 16 張並排渲染成 46px、套用線上同一組圓角與三道陰影、
  以 `--force-device-scale-factor=3` 截圖逐一比對無差異 —— 連 puritylens 的玻璃質感、
  qiflux 的漸層、mairi 的白色描邊都保持。

### 剩下的 `uses-responsive-images`（仍 50 分）

線上只剩**一個檔**：`assets/kv/puritylens.webp`，浪費 58,821 B（84%）。
它動不得 —— `audit-kv.mjs` 的 `SPEC` 綁死 `1600×1200`、4:3、上限 200 KB，
那是刻意的主視覺母版規格。要處理它必須引入 `srcset` 多尺寸變體（母版留著供其他用途），
那是獨立的一件事，**不在本 PR**。

### 字體家族體積（`curl "fonts.googleapis.com/css2?family=<單一家族>&display=swap" | wc -c`）

```
Space Grotesk          5,220 B    12 faces
Bricolage Grotesque    3,062 B     6 faces
Newsreader             4,065 B     9 faces
Space Mono             2,562 B     6 faces
Noto Sans JP         344,058 B   372 faces   ← 96%
```

### logo DOM 量測（`getBoundingClientRect` + `naturalWidth/Height`）

| | 改前 | 改後 |
|---|---|---|
| 來源檔 | `crealize-mark.png` 480×383 / 41,366 B | `crealize-mark.webp` 120×96 / 1,940 B |
| nav 渲染 | 26.31 × 21.00（密度 18.24x） | 26.25 × 21.00（密度 4.57x） |
| footer 渲染 | 32.58 × 26.00（密度 14.73x） | 32.50 × 26.00（密度 3.69x） |

渲染尺寸差 0.07 px —— 來自 `120:96` 與 `480:383` 的比例差 0.26%，截圖不可見。

### 字體等價（改前改後逐項相同，不是目測）

```
document.fonts.size                                  405  ==  405
loaded 家族  Bricolage Grotesque / Newsreader / Noto Sans JP / Space Grotesk / Space Mono
.hero__word   computed font-family = Space Grotesk, 133.12px, 700   （兩邊相同）
.hero__sub    computed font-family = Space Grotesk, 14px, 400       （兩邊相同）
```

---

## 截圖

| 檔案 | 視口 | 版本 |
|---|---|---|
| `desktop-before.webp` | 1440×900 | 修正前 |
| `desktop-after.webp` | 1440×900 | 本 SHA |
| `mobile-before.webp` | 390×844 | 修正前 |
| `mobile-after.webp` | 390×844 | 本 SHA |

以 `Google Chrome --headless=new --virtual-time-budget=6000` 擷取。
兩兩比對版面一致；背景 `atmosphere.js` 的粒子與曲線位置不同，那是持續動畫的相位差，
不是版面變動 —— 版面是否位移看 CLS（0.002 → 0）。

## 完整檢查輸出

> 副檔名是 `.txt` 而非 `.log`，因為本機全域 gitignore（`~/.config/git/ignore`）有 `*.log`，
> 用 `.log` 會讓這份證據靜靜地進不了 repo。

`checks-at-sha.txt` —— 在上述精確 SHA、工作樹乾淨時跑的 `npm run check:all`，
`exit=0`，九項全綠（既有八項 + 新增的 `audit-critical-path`）。

## 重現方式

```bash
git checkout 2003500a917345c85610be67efce3fa7beda695c
npm run check:all                      # 期待 exit 0，九項全綠

# 反向測試：證明 gate 真的會紅，不是恆真
#   1) 把 scripts/build-site.mjs 的兩條字體 link 改回單一 rel="stylesheet"
#   2) node scripts/build-site.mjs && node scripts/audit-critical-path.mjs
#      → exit 2，指出「會擋住首次繪製」「綁在同一條 link」「缺 noscript」
#   3) 移除同檔第 6 段的 logo 替換，重跑 build
#      → exit 2，指出「仍指向 PNG」「缺 width/height」
```

## 已知未處理（有量測依據，刻意不混進這次交付）

- `uses-responsive-images`：**已於 PR #3 `cbe14ee` 處理**（800×600 變體 + srcset，母版不動），證據在 `docs/ux-evidence/2026-09-04/`。`og.png` 未動。
- `unminified-css` / `unminified-javascript`：線上有 gzip，收益是解析時間而非傳輸量，需另評估。
- `uses-long-cache-ttl` 50 分：`max-age=600` 是 GitHub Pages 固定值，站方改不了。
- 本機 server 報的「Enable text compression 910 ms」是**假象** —— 線上實測
  HTML/CSS/JS 三者都回 `content-encoding: gzip`，該項在線上是滿分。
