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

## Lighthouse 12.8.2 · mobile · 同一台機器 · 同一個本機 server

`before` = `git archive HEAD~3 site`，`after` = 本 SHA 的 `site/`，兩者都由
`python3 -m http.server` 服務，只有內容不同。

| | 原始 | 字體修正 | ＋圖片修正（本 SHA） |
|---|---|---|---|
| Performance | 60 | 93 | **97** |
| First Contentful Paint | 6.5 s | 1.7 s | **1.7 s** |
| Largest Contentful Paint | 7.4 s | 2.9 s | **2.4 s** |
| Speed Index | 6.5 s | 1.7 s | **1.7 s** |
| Total Blocking Time | 0 ms | 130 ms | **0 ms** |
| CLS | 0.002 | 0.002 | **0** |
| `unsized-images` | 50 | 50 | **100** |
| `modern-image-formats` | 0 | 0 | **100** |

線上（`https://crealize.llc/`，修正前）獨立跑過一次，作為「本機不是唯一來源」的對照：
Performance **61**、FCP **6.4 s**、LCP **6.8 s**、render-blocking **5,110 ms**、TBT 0 ms、CLS 0.003。

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
