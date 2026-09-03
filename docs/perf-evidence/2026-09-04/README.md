# 效能修正證據包 — 2026-09-04

對應 PR：`perf/critical-path-and-doc-alignment` → `main`
被驗證的精確 commit：**`2003500a917345c85610be67efce3fa7beda695c`**（工作樹乾淨時跑的，`git status --porcelain` 為空）

三個 commit：

| SHA | 說明 |
|---|---|
| `e1d5afe5128d2e3d14f0c5dd1d5c85acfa17afa2` | docs: README 對齊成線上實況 |
| `a69c1186280a32cd1e97153acf0dfd999278cf1a` | perf(fonts): Google Fonts 移出關鍵路徑 |
| `2003500a917345c85610be67efce3fa7beda695c` | perf(logo): PNG → WebP + 內在尺寸 |

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

## Lighthouse 量測 —— 兩種節流方法給出方向相反的結論

**先講結論，因為這裡有一個容易誤導的地方**：本文件初版只報了「本機 + 模擬節流」的
60 → 97，那個數字**不能代表線上**。部署後對線上實測，模擬節流只有 62 分。
四組數字全列如下，沒有挑好看的。

| | 模擬節流（Lighthouse 預設） | | 實際節流（`--throttling-method=devtools`） | |
|---|---|---|---|---|
| | score | FCP / LCP | score | FCP / LCP |
| 本機 before | 60 | 6.5 s / 7.4 s | 85 | 3.3 s / 3.3 s |
| 本機 after | 97 | 1.7 s / 2.4 s | 92 | 2.7 s / 2.7 s |
| 線上 before | 61 | 6.4 s / 6.8 s | — | 未測（部署後已被覆蓋，無法回頭補）|
| **線上 after** | **62** | **6.2 s / 6.5 s** | **98** | **2.0 s / 2.0 s** |

### 跨方法一致、可以當結論的改善

這四項在**線上**實測，且不依賴哪種節流模型：

| | 線上 before | 線上 after |
|---|---|---|
| `render-blocking-resources` | 5,112 ms | **0 ms** |
| `unsized-images` | 50 | **100** |
| `modern-image-formats` | 0 | **100** |
| CLS | 0.003 | **0.002** |

### 不能當結論的部分，以及為什麼

線上模擬節流下 FCP 只從 6.4 s 動到 6.2 s，**即使同一份報告自己說 render-blocking
已經是 0 ms**。這在該模型內部並不自洽，我沒有把它逆向工程到底，所以只陳述觀測到的事：

- **實際節流**（真的限速限 CPU，不是推算）：線上 after 是 **98 分 / FCP 2.0 s**。
- **filmstrip 觀測值**（Lighthouse 自己拍的畫面時間軸，未經模型換算）：
  486 / 972 / 1457 ms 三格空白，**1943 ms 那格出現內容**，之後穩定。
- LCP 階段分解：TTFB 780 ms（12%）、Load Delay 0 ms、Load Time 0 ms、
  **Render Delay 5,723 ms（88%）** —— 而所有網路請求在 **565 ms** 就結束了。

實際節流與 filmstrip 互相印證（2.0 s vs 1.9 s）；模擬節流的 6.2 s 與這兩者都對不上。
**哪一個更接近真實使用者，手上的證據判定不了** —— 那需要 CrUX field data，
本站流量是否足以進入 CrUX 未知，PSI API 的免費配額當天已用罄，沒有取得。
在拿到 field data 之前，不應該用任何單一數字宣稱「站變快了幾倍」。

### 方法學教訓（寫下來免得下次再犯）

1. **本機 server 的絕對分數不能外推到線上**。本機 after 在實際節流下是 92，
   線上 after 是 98 —— 線上反而更好，因為 GitHub Pages 有 gzip 與 HTTP/2，
   `python -m http.server` 兩者皆無。
2. **同一份改動，換個節流方法就從 +37 分變成 +1 分**。報效能數字必須連同
   「哪個環境、哪種節流方法」一起講，否則等於沒講。
3. 本機 A/B 仍然有用 —— 它證明了改動的**方向**與 render-blocking 的歸零；
   它不能證明**幅度**。

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

- `uses-responsive-images` 目前 50 分，剩餘來自 `assets/kv/*.webp`（16 張、1.1 MB）與 `og.png`。
- `unminified-css` / `unminified-javascript`：線上有 gzip，收益是解析時間而非傳輸量，需另評估。
- `uses-long-cache-ttl` 50 分：`max-age=600` 是 GitHub Pages 固定值，站方改不了。
- 本機 server 報的「Enable text compression 910 ms」是**假象** —— 線上實測
  HTML/CSS/JS 三者都回 `content-encoding: gzip`，該項在線上是滿分。
