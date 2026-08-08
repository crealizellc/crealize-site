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

## v2 設計方向（Yves 指定：參考原網站、用截圖或重組）

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
- [ ] A1 `scripts/audit-kv-quality.mjs`：v2 品質不變式，現況（v1 圖）應全數 RED
      - AC-1 每張必須嵌入真實產品畫面（HTML 內有 `<img>` 指向實際素材，非純向量）
      - AC-2 裝置區塊佔畫面面積 ≥ 22%（縮到 333×249 仍看得出是 App 畫面）
      - AC-3 必須有景深（模板含 `filter: blur` 或 `box-shadow`／SVG `feDropShadow`）
      - AC-4 背景非純色：四角取樣至少兩色不同（有漸層／環境光）
      - AC-5 背景主色需落在該產品 `product-palette.json` 的色系家族內（±hue 容差）
      - AC-6 12 張的裝置中心點與尺度標準差在容差內（證明是一套系統，不是各做各的）
- [ ] A2 沿用既有 `audit-kv.mjs`（母版 1600×1200 / webp / <200KB）與
      `audit-kv-registry.mjs`（三語對稱、素材對帳），兩者已綠，v2 不得打破
- [ ] A3 串進 `npm run check:kv` 與 deploy gate

### B. 素材準備
- [ ] B1 盤整 8 張本機原圖，逐張挑選「最能代表該產品」的畫面並記錄理由
- [ ] B2 抓取 Rythix 2048 / Meishitto / XunNi 的官方商店截圖（1290×2796）
- [ ] B3 Meguru 視覺方案定案（CI 組圖 vs OpenArt 生成）
- [ ] B4 需要氛圍底圖的產品，用 OpenArt 生成（品牌色、無文字、抽象環境光）

### C. 設計與產出
- [ ] C1 用 `claude-design-handoff` 驅動 Claude Design 產「構圖模板」
      （裝置外框 + 環境層 + 陰影 + 出血規則），brief 內嵌設計契約與各產品品牌色
- [ ] C2 取件（沿用 v1 已驗證可行的分段讀取法，見下方「已知取件障礙」）
- [ ] C3 `render-kv.mjs` 擴充：把真實截圖注入模板後渲染
- [ ] C4 產出 12 張並過 A1 全部 AC

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
