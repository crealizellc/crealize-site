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


---

# KV 800×600 `srcset`（第三批，Yves 已授權；本段證據皆為本機 harness，線上數字見下方「線上複驗」）

## 改了什麼（母版與風格不動）

- `scripts/build-kv-assets.mjs`：同一條 sips 裁切→縮放→cwebp 路徑、同母版最後採用的 q，多產一份
  `site/assets/kv-800/<slug>.webp`（800×600）。**母版 16 張合併 sha256 前後皆 `d9968599d97105a2`，icon 亦未動。**
- `scripts/gen-work-v3.mjs`：`stage__bg` 加 `srcset="…kv-800/… 800w, …kv/… 1600w"`、
  `sizes="(min-width: 1101px) 29vw, (min-width: 641px) 44.5vw, 90vw"`（對應 `sections.css` `#work-cards` 三欄／兩欄／一欄），`src` 仍指母版。
- 新 gate `scripts/audit-kv-variants.mjs`（掛 `check:kv` 與 `deploy-gh.sh`）：每個變體存在、WebP 檔頭恰 800×600、位元小於母版、
  母版目錄純淨、三語 HTML 的 `srcset/sizes/src` 逐一相符。**「audit-kv 掃不到」不是合格理由，這支才是。**

位元（檔案）：16 張母版 1,125,590 B → 變體 **447,818 B（40%）**；先前提案用母版降採樣估的 56% 偏保守，
實際由原始 PNG 走同一條路徑產出更小。

## 選圖與解碼（CDP，快取關閉，`prove-kv-srcset.mjs`，本機 server 服務本 commit 的 `site/`）

第一張卡（PurityLens）。`expected` = `stage 寬 × DPR ≤ 800 → 800，否則 1600`；`filePx` 由 `fetch(currentSrc)` → `createImageBitmap` 解碼實測
（`naturalWidth` 在 srcset 下是密度校正值，不能拿來當檔案尺寸 —— 這是本次踩到並修正的量測錯誤）；`netBytes` 是 `Network.loadingFinished.encodedDataLength`。

| 視口 | DPR | `.stage` CSS px | 需要 px | 預期 | 實選 | 解碼 px | 網路 bytes |
|---|---|---|---|---|---|---|---|
| 390 | 2 | 350 | 700 | 800 | **800** | 800×600 | **30,437** |
| 390 | 3 | 350 | 1050 | 1600 | 1600 | 1600×1200 | 70,505 |
| 768 | 2 | 341 | 682 | 800 | **800** | 800×600 | 30,437 |
| 1080 | 2 | 482 | 964 | 1600 | 1600 | 1600×1200 | 70,505 |
| 1280 | 1 | 372 | 372 | 800 | **800** | 800×600 | 30,437 |
| 1280 | 2 | 372 | 744 | 800 | **800** | 800×600 | 30,437 |
| 1440 | 2 | 419 | 838 | 1600 | 1600 | 1600×1200 | 70,505 |

7/7 與預期一致。1080@2、1440@2、390@3 拿 1600 是**正確**選擇，不是浪費。

Modal 把卡片的 `.stage` 整組 clone 進 `.work-modal__shot`，沿用同一個 `sizes`；量測結果它也選得夠用，**不需另設 sizes**：

| 視口 | DPR | 槽寬 CSS px | 需要 px | 實選 | 檔案 px | 足夠 |
|---|---|---|---|---|---|---|
| 390 | 2 | 354 | 708 | 800 | 800 | ✓ |
| 1280 | 2 | 380 | 760 | 800 | 800 | ✓ |
| 1440 | 2 | 380 | 760 | 1600 | 1600 | ✓ |

## 視覺並排（390@2x，同一張卡、同一裁切框，`kv-390x2-srcset-800.png` vs `kv-390x2-master-1600.png`，PNG 無損）

| 指標 | 值 |
|---|---|
| 尺寸 | 700×524（350×262 CSS @2x） |
| 平均絕對色差 | 1.26 / 255 |
| PSNR | 41.4 dB |
| 色差 >8 / >16 / >32 的像素 | 2.27% / 0.07% / 0.00% |
| 最大色差 | 29 |
| 非紙色像素（防拍到透明卡） | 90.0% / 89.9% |

兩張裁圖拍前都確認 `.card` computed opacity = 1（第一版曾拍到 reveal 前的透明卡，已修：捲到卡片本身並等 `.is-in`；
`Page.captureScreenshot` 的 clip 是頁面座標，需加 `scrollX/Y`）。

## 反向測試（每項紅在對應理由，還原後 exit 0）

| 拿掉 | 結果 |
|---|---|
| 刪 `kv-800/puritylens.webp` | `exit 2`「缺 site/assets/kv-800/puritylens.webp」|
| 變體換成 144² icon | `exit 2`「變體尺寸 144×144，須為 800×600」|
| 產生器拿掉 `srcset`（重建） | `exit 2` 三語「16/16 個 stage__bg 的 srcset/sizes/src 不符」|
| ja `ctaLabel` 去掉 `{name}` | `exit 2`「必須含 {name} 佔位」|
| 產生器 aria-label 改回硬編英文（重建） | `exit 2` ja/zh「仍有 16 個硬編英文 aria-label」|

## 文案（Codex 兩項觀察的處置）

1. **英文 modal 副名「成分をひと目で」是契約，不是漏譯，不改。** 證據：`i18n/en.js` `indexHead` 第三欄叫 `aka`、`ja.js` 叫 `和名`；
   `work-copy.json` 根本沒有 `jp` 欄位 —— 這些日文副名由 `docs/design-system/source/claude-design-export-v2/js/site.js` 從英文 canvas 帶出來。
   它是「產品的日文名」這個品牌元素。zh 的 10 個中文譯名（`副名` 欄）維持不動；若要全站回到設計源，改 `zh.js` 那 10 個值即可。
2. **日文 CTA 改為「Meishitto を開く」**：`ctaLabel` 改成 `{name}` 模板（en `Open {name}` / ja `{name} を開く` / zh `前往 {name}`），
   `work-modal.js` 與 `site.js` 套用同一模板；順手修掉 ja/zh 頁 16 張卡片硬編英文 `aria-label="Open …"`（gate 檢查 `aria-label="PurityLens を開く"`）。

## 重新擷取

```bash
cd /Users/crealize-00/Projects/crealize-site/site && python3 -m http.server 8814 &   # 服務本 commit 的 site/
SP=/tmp/kvproof BASE=http://127.0.0.1:8814 OUT=/tmp/kvproof \
  node /Users/crealize-00/Projects/crealize-site/docs/ux-evidence/2026-09-04/prove-kv-srcset.mjs   # JSON 到 stdout，兩張裁圖到 OUT
```
本機結果原檔：`kv-proof-local.json`。線上：`BASE=https://crealize.llc`（見下方）。

## 尚未證明（誠實邊界）

- 真機 Safari／Android Chrome 的實際選圖與渲染（headless Chrome 只證明規格行為）。
- Lighthouse 分數未重跑（重活時段限制）；本段的「節省」是**逐圖網路 bytes**，不是分數。

## 線上複驗（部署後，`https://crealize.llc`，同一支 `prove-kv-srcset.mjs`，原檔 `kv-proof-live.json`）

| 來源 HEAD | 已部署 gh-pages | 部署時間 (+0900) | 樹比對 | rollback 目標 |
|---|---|---|---|---|
| `cbe14eecfdf20c0fdd98fcbdd326f03c633795b1` | **`24f0d11f0d4d80ade8b46d940330a3e0314e8df3`** | 11:58:00 | **83 檔 blob 相同**（含 16 張 kv-800） | `12706ccf9e2fc178cca2d83a040767481de73fb2` |

- 三語 HTML sha256 == 本機：en `3003f5cc104562ce…`、ja `5d66f5c5d55a834b…`、zh `e9eb5a9d9fb6fcb6…`；16 張變體 `curl | cmp` 16/16 位元相同。
- 選圖 7/7 與預期一致、modal 3/3 足夠（表格同上，數值一致）。
- **真實網路 bytes（CDP `encodedDataLength`，快取關閉，含標頭）**：變體 30,469–30,574 B vs 母版 70,577–70,681 B。
  獨立第二量測 `curl -w %{size_download}`：30,248 B vs 70,316 B（= 檔案大小，WebP 不再被 gzip 壓縮）。
- 線上 HTML 含 `srcset="assets/kv-800/puritylens.webp 800w, assets/kv/puritylens.webp 1600w"`；ja 頁 `aria-label="PurityLens を開く"`。

未證明：真機；Lighthouse 分數（未重跑）。


---

# 文案改版的視覺確認 + 日文文節斷行修正（第四批）

## 絕對路徑

| | 路徑 |
|---|---|
| 文案改版後 12 張（三語 × 桌機 1280／手機 390 × method／join／卡片列／modal；zh-m390 兩張為修孤字後重拍）| `/Users/crealize-00/Projects/crealize-site/docs/ux-evidence/2026-09-04/copy/before-cjk-fix/` |
| 文節修正後（ja × 320／375／390／1280 × join／method；en／zh 320 header）| `/Users/crealize-00/Projects/crealize-site/docs/ux-evidence/2026-09-04/copy/after-cjk-fix/` |
| PNG 原檔（未進 repo）| `/private/tmp/claude-501/-Users-crealize-00-Projects/72731612-787b-41e9-a7f7-df2f26060532/scratchpad/copyshots/`、`…/scratchpad/cjk/`、`…/scratchpad/cjk2/` |
| 文案逐條對照 | `/Users/crealize-00/Projects/crealize-site/docs/copy-review/2026-09-04-de-ai.md` |

## 修了什麼（文案一字不改）

1. **日文文節斷行**：CJK 沒有空格，瀏覽器在任何字之間都能換行。實拍看到 390px 的 Join 標題「つくっ／た」、Method 開場句「リリ／ース」；拍更多視口後又看到 Join 強調行「見せてくださ／い。」（320／375／**1280 桌機**都會）、拠点列「東京本／社」、職種列「グロー／ス」。
   修法是日文網頁的標準手法：每個文節包 `<span class="jw">`（`display:inline-block`，`site.css`），瀏覽器只能在文節之間換行。由 `build-site.mjs` 的 ja 覆寫加標籤，共 15 個文節；en／zh 不受影響（gate 檢查無殘留）。
2. **320px 的 header**：「Crealize LLC ＋ 選單 ＋ 語言 ＋ CTA」一列擠不下，CTA「相談する」被 flex 壓成直排四行。修法：`.nav__cta` 永不折行、不被壓縮（`white-space: nowrap; flex-shrink: 0`），≤400px 縮間距、藏「LLC」小字、按鈕 padding 18→12。字級不動（12px 已是下限）。

## Gate：`scripts/audit-cjk-linebreak.mjs`（`check:cjk`，進 `check:all` 與 `deploy-gh.sh`）

用既有 CDP 路徑實際排版：ja 頁 320／375／390／1280 每個 `.jw` 的 `getClientRects().length === 1` 且無水平溢出；三語 320 的 `.nav__cta` 單行、高 ≤44px、右緣不出視口；en／zh 無 `.jw` 殘留。

反向測試（真實路徑）：拿掉 `.jw` 規則 → 320 三個文節被拆（「リリースまで、」「つくった」「ものを、」）、375／390／1280 各兩個 → `exit 2`；拿掉 nav 的 nowrap＋≤400 收緊 → `exit 2`：en「CTA 右緣 343 超出視口 320」、ja「相談する」文字佔 4 個行框、zh「聯絡我們」4 個行框。
**記錄兩個測試缺陷**：① 第一次只拿掉 nowrap，gate 仍綠 —— ≤400 收緊單獨就已讓 CTA 放得下；殺得掉的測試必須拿掉整組修正。② 拿掉整組後 gate 只紅 en：pill 固定高 34px，文字折行時溢出框外，元素的 rect 數與高度都不變。改為量文字本身的行框（`Range.getClientRects()`）後，ja／zh 才如實紅在「4 個行框」。

## 誠實邊界
- 320 的驗證是 headless Chrome 排版；真機 Safari 的字體度量可能略有差異（文節法對此不敏感，因為它只限制「在哪裡可以換行」）。
- Join 標題在 1280 桌機仍是 5 行（原本 5 行含「い。」孤字），因為該欄寬只容 7 字；沒有改字級或版型。
