# UX 證據包 — 2026-09-04（modal CTA 視覺 + 修訂對照）

供 Codex 桌面／行動 review。**這裡的一切都是 agent 產出，等待獨立驗收；** 每個數字都附可重跑的指令。

## 絕對路徑

| | 路徑 |
|---|---|
| checkout | `/Users/crealize-00/Projects/crealize-site` |
| 本證據包 | `/Users/crealize-00/Projects/crealize-site/docs/ux-evidence/2026-09-04/` |
| perf 證據包（第一批） | `/Users/crealize-00/Projects/crealize-site/docs/perf-evidence/2026-09-04/` |
| 稽核 backlog（12/13 已修，含每項證據） | `/Users/crealize-00/Projects/crealize-site/docs/development/TODO.md` |
| KV srcset 提案（只文件，未實作未部署） | `/Users/crealize-00/Projects/crealize-site/docs/development/proposals/2026-09-04-kv-srcset.md` |
| 截圖原始 PNG（未進 repo） | `/private/tmp/claude-501/-Users-crealize-00-Projects/72731612-787b-41e9-a7f7-df2f26060532/scratchpad/shoot/` |

## 來源修訂 → 部署修訂（精確對照）

| 批次 | PR | 來源 HEAD | 已部署 gh-pages | 部署時間 (+0900) | 樹比對 |
|---|---|---|---|---|---|
| perf + a11y | #2 `perf/critical-path-and-doc-alignment` | `9ff825d279d7207ae433291926d05a804c2dfc72` | `b76e1ef51f13fb8e49e2015f09bfda8a63105cc3` | 09:21:59 | 67 檔 blob 相同 |
| 產品連結等六項 | #3 `feat/product-links-and-remaining-fixes`（base = #2 分支） | `37d2efc1b9cfa428c4122199efcd8e83eac30421` | **`12706ccf9e2fc178cca2d83a040767481de73fb2`**（現行線上） | 09:43:01 | 67 檔 blob 相同 |

回退目標：`bash scripts/rollback-gh.sh` → `b76e1ef5`（上一批）。`main`（`753410c`）未被直推，兩個 PR 皆 OPEN。

最後一次線上複驗（部署後）：三語 HTML sha256 == `37d2efc:site/*` —— en `9c12223005275a57…`、ja `8bb79dd2cf879adf…`、zh `e0f7896bd6af2430…`；
本批改到的 9 個檔 `curl | cmp` 位元相同；`/ja/no-such-page` `/zh/x` `/nope` 皆 HTTP 404 且回三語同檔。

重跑：
```bash
git ls-tree -r origin/gh-pages --format='%(objectname) %(path)' | sort > /tmp/g.txt
git ls-tree -r 37d2efc:site --format='%(objectname) %(path)' | sort > /tmp/h.txt && diff /tmp/g.txt /tmp/h.txt && echo SAME
for p in "" ja/ zh/; do curl -sL https://crealize.llc/$p | shasum -a256; shasum -a256 site/${p}index.html; done
```

## 截圖（三張，皆為 `37d2efc` 的 `site/`，等同已部署位元）

擷取路徑沿用 repo 既有的 `scripts/shoot-site.mjs` 那一條：同一個 Chrome、同一個 `scripts/lib/cdp.mjs`、同一個
`Page.captureScreenshot`。唯一多做的是點開卡片並等 modal 落定；腳本原文在同目錄 `capture-modal-cta.mjs`（可重跑：
`SP=<scratch> node docs/ux-evidence/2026-09-04/capture-modal-cta.mjs`）。**每張拍之前先探針，探針不過就不拍**：

| 檔 | 視口 / DPR | 頁 | 卡 | `visibilityState` | `document.hidden` | CTA 文字 | CTA opacity | CTA rect (x,y,w,h) | modal 內執行中動畫 |
|---|---|---|---|---|---|---|---|---|---|
| `modal-cta-desktop-en.webp` | 1280×800 / 2 | en | #0 PurityLens | visible | false | Open PurityLens ↗ | 1 | 643,327,173,46 | 0 |
| `modal-cta-desktop-zh.webp` | 1280×800 / 2 | zh | #0 PurityLens | visible | false | 前往 PurityLens ↗ | 1 | 643,336,166,46 | 0 |
| `modal-cta-mobile-ja.webp` | 390×844 / 2, mobile | ja | #9 Meishitto | visible | false | 開く Meishitto ↗ | 1 | 18,512,156,46 | 0 |

畫面內容（人眼核對）：modal 完整渲染、CTA 為 accent 實心鈕位於摘要下方／正文上方；zh 的 modal 副名「成分一目了然」與卡片一致；
背景模糊是 modal 遮罩的**設計**，不是凍結的過渡幀。PNG 原檔（2560×1600 / 780×1688）留在 scratchpad，repo 內為 q82 WebP。

**這三張不能證明的**：真機 Safari／Chrome 的合成結果（headless Chrome 渲染）；動畫過程本身（只拍落定後）；hover 狀態。

## 先前那張被我撤下的截圖

Browser pane 隱藏分頁（`document.hidden === true`）不推進 CSS transition，modal 開啟動畫停在半途，畫面是模糊中間態。
已撤下，未當證據。這次改走 headless CDP（分頁為 visible），並以探針把關。
