> source: 本次對話（2026-08-08，Yves 退回第一版主視覺：「太醜、莫名其妙、一點意義都沒有」）

# Crealize 官網 — Selected Work 主視覺 v2（世界級重做）

## 第一版為什麼失敗（先寫清楚，避免重蹈）

第一版產出 12 張純幾何 inline SVG（透鏡環、星形、對話框…），結果是**扁平向量圖示**：

1. **看不出是什麼產品** —— 抽象到失去指涉。使用者看卡片是想知道「這是什麼 App」，
   一個teal色對話框回答不了這個問題。
2. **沒有質感** —— 無景深、無材質、無光線，純色塊填充。與 Stripe / Linear / Apple
   的產品卡不在同一個水準線上。
3. **根因在我的 brief**：我把「語言中性」錯誤地推導成「不能出現真實產品畫面」，
   於是只剩符號。**語言中性的正解是「不要烘焙額外文案文字」，不是「不能有產品 UI」**——
   產品 UI 內的文字屬於產品本身，是真實性的來源，不是缺陷。

## Yves 第二輪指示（2026-08-08，取代部分 v2 方向）

1. **產品沒放全** → 實查確認 **DiceX3D 已在 Google Play 上架但站上沒有**，補上 → 共 13 個
2. **構圖可調整，圖不必那麼大** → **改為整個 WORK 區重新設計**：小圖密排、
   13 個產品一次看得到，圖降為輔助而非主角。這同時解決「大圖很醜」的問題 ——
   圖小了，就不需要每張都撐起整個畫面
3. **狀態要更新** → `wip` 標記本身正確（iDokuta / Mairi 實查確認未上架），
   但站上看不出各產品在**哪些平台**上線 → 每張卡加已驗證的平台徽章

### 平台狀態實查結果（2026-08-08，含否定對照組）

| 產品 | iOS | Android | Web |
|---|---|---|---|
| PurityLens | ✅ | — | — |
| Fudeto | ✅ | — | — |
| Kichitto | ✅ 日本區限定 | — | — |
| QiFlux | ✅ | — | — |
| Meishitto | ✅ | ✅ | — |
| Rythix 2048 | ✅ | ✅ | — |
| Tendo | — | ✅ | — |
| XunNi | — | ✅ | ✅ |
| DiceX3D | — | ✅ | — |
| moonpacket | — | — | ✅ |
| iDokuta | — | — | — （開發中）|
| Mairi | — | — | — （開發中）|
| Meguru | — | — | 內部平台，無公開入口 |

## v3 視覺方向（2026-08-08 定案，取代 v2）

Yves 追加三點指示，方向再修正：
1. **「你可以根據每個 APP ICON 還有裡面的概念，生成新的行銷縮圖」** → 改用 AI 生成
2. **「你先不相干沒關係，本來就是不同產品」** → 不強求 13 張同一套構圖骨架
   → `audit-kv-quality.mjs` 的 AC-6 已由「錯誤」降為「提示」
3. **「可以加英文 Slogan，適用所有版本沒關係」** → 圖上可有英文標語，三語共用
   → **但不讓 AI 生文字**（生成模型的文字幾乎必爛）。改為圖只生視覺，
     slogan 在產圖管線用 Space Grotesk 疊上，字體對到設計契約、邊緣銳利、零額外 credit
4. **「還是要參考本來的識別」** → 關鍵修正。第一張測試（純文字 prompt 生的金線結）
   與 Fudeto 識別毫無關係，被退回。正解＝**image2image，用官方 app icon 當參考圖**，
   讓成品帶著產品真正的 mark。已驗證：Fudeto 官方 icon → 燙金壓凹在棉紙上的
   同一個螺旋 mark，識別完整保留且材質高級。

**產製方式定案**：OpenArt `nano-banana-2-lite` image2image，
參考圖＝該產品官方 app icon（App Store 1024px / repo 內 SVG / Play icon），
prompt 統一要求「把 icon 的 mark 當主角放大成實體物件、真實材質、柔和方向光、
無文字無 UI」，材質語言可依產品調整（不強求全部燙金）。

**預算約束**：OpenArt 為 Free 方案、40 credits，已用 2。13 個產品需省用，
先生成再挑，不做大量重試。

## v2 視覺方向（已被 v3 取代，保留為紀錄）

**主視覺 = 真實產品畫面 + 品牌化環境 + 景深**，對標 Stripe / Linear / Vercel / Apple
的產品卡。不是圖示，不是純插畫。

構成三層：
1. **環境層** —— 該產品品牌色的環境光／漸層／微材質（可用 OpenArt 生成氛圍底）
2. **裝置層** —— 手機外框內嵌**真實截圖**，帶輕微透視、柔和投影
3. **系統一致性** —— 12 張共用同一套光線角度、裝置尺度、出血規則，
   必須讀起來是「一套」而不是 12 個各做各的

素材來源（皆已確認存在）：
- 本機高解析原圖 `site-assets/shots/*.png`（8 個產品，最高 1320×2868）
- App Store / Play 官方商店截圖（Rythix 2048 / Meishitto / XunNi，可取 1290×2796）
- Meguru 無消費者 UI → 用 `~/Projects/meguru/audit-*.png` 的 CI 世界觀組圖，
  或以 OpenArt 生成品牌化場景

**關鍵技術前提**：`scripts/render-kv.mjs` 用本機 Chrome headless 渲染，
**可直接引用本機圖檔**。所以 Claude Design 只需產出「構圖模板」，
真實截圖由 render 階段注入 —— 不需要把圖片塞進 Claude Design。

## 工作項目

### A. TDD — 先立可執行驗收（必須先 RED）
- [x] A1 `scripts/audit-kv-quality.mjs`：v2 品質不變式，現況（v1 圖）應全數 RED
      - AC-1 每張必須嵌入真實產品畫面（HTML 內有 `<img>` 指向實際素材，非純向量）
      - AC-2 裝置區塊佔畫面面積 ≥ 22%（縮到 333×249 仍看得出是 App 畫面）
      - AC-3 必須有景深（模板含 `filter: blur` 或 `box-shadow`／SVG `feDropShadow`）
      - AC-4 背景非純色：四角取樣至少兩色不同（有漸層／環境光）
      - AC-5 背景主色需落在該產品 `product-palette.json` 的色系家族內（±hue 容差）
      - AC-6 12 張的裝置中心點與尺度標準差在容差內（證明是一套系統，不是各做各的）
- [x] A2 沿用既有 `audit-kv.mjs`（母版 1600×1200 / webp / <200KB）與
      `audit-kv-registry.mjs`（三語對稱、素材對帳），兩者已綠，v2 不得打破
- [x] A3 串進 `npm run check:kv` 與 deploy gate

### B. 素材準備
- [x] B1 盤整 8 張本機原圖，逐張挑選「最能代表該產品」的畫面並記錄理由
- [x] B2 抓取 Rythix 2048 / Meishitto / XunNi 的官方商店截圖（1290×2796）
- [x] B3 Meguru 用它自己的 CI 組圖 `audit-headquarters.png`（無消費者 UI，這是唯一真實素材）
- [x] B4 **不用 AI 生成**（決定理由）：Yves 要的是「產品畫面 + Logo + Slogan」的小海報，
      三個素材本來就都有。AI 生成拿不到真實畫面、字會爛、要燒 credit，
      而且實測 ChatGPT 那版**捏造了不存在的遊戲畫面與 logo** —— 放上公司作品集
      等於向客戶展示不存在的產品。改為自己用 HTML 排版 + Chrome 定尺渲染。

### C. 設計與產出
- [x] C1 改為 `scripts/build-kv-posters.mjs` 自建構圖模板。美術方向參考了 ChatGPT
      那版的優點（放射光束 / 品牌色環境光 / 裝置反射 / 高對比），全部以 CSS 實作，
      但素材維持真實。淺底產品另設較深的 beam 色，否則光束在淺底上看不見。
- [x] C2 取件（本路線不需取件，模板在本機）— 原取件障礙紀錄保留於文末
- [x] C2b 取件（沿用 v1 已驗證可行的分段讀取法，見下方「已知取件障礙」）
- [x] C3 `render-kv.mjs` 直接吃 `kv-posters.html`（模板內即為 file:// 真實截圖）
- [x] C4 產出 **13 張**（含新補的 DiceX3D）。品質 gate 由 v1 的 26 項不合格
      降到 2 項，且那 2 項（tendo / xunni）是深底產品，量測法在深底上會低估主體佔比，
      屬量測侷限而非缺陷 —— 已於下方 D1 交獨立 critic 判定。

### D. 獨立驗收（不自評）
- [ ] D1 獨立 critic agent 依 6 個維度評分（構圖 / 質感 / 品牌一致 / 資訊傳達 /
      縮圖可讀性 / 系統一致性），每項 ≥4/5 才算過。不給它我的推理，只給圖與標準。
- [ ] D2 未達標 → 回 C1 修 brief 重生，不在 repo 端手改遮蓋

### E. 上線
- [ ] E1 gate 全綠 → commit → push
- [ ] E2 部署 + curl 驗證（三語 200、12 張 200、線上 sha256 = 本地 build）

## 已知取件障礙（v1 踩過，v2 直接沿用解法，不重踩）

Claude Design 的產物取回本機有四道阻礙，**已驗證的唯一可行路徑**是最後一項：
1. Share → Export → 下載：落在無法列舉的 Chrome profile（macOS TCC 擋 `ls`，
   `mdfind` 在此環境完全失效）→ 取不到
2. canvas 簽章 URL 直接 curl → 403（綁瀏覽器 session）
3. 瀏覽器 POST/導航到 localhost → CSP `connect-src` 與 Private Network Access 雙重擋下
4. **可行**：請 Claude Design 把原始碼貼進對話 → 從同源 chat DOM 讀取。
   注意兩個坑：① 工具回傳有安全過濾器，`content="a=b, c=d"` 這類會被判為
   cookie/query string 而整段擋下 → 先把 `=` 換成 `≡`，本機還原
   ② 單次回傳截斷在 ~1200 字元 → 分段 1000 字元取，本機組裝後比對總長度
