> source: 本次對話（2026-08-08，Yves 指示：視覺分析官網、重製作品集主視覺、加入新項目）

# Crealize 官網 — Selected Work 主視覺重製 + 產品擴充

## 決策紀錄（動工前已定，避免後續重議）

- **卡片框維持 4:3 橫式**（571×428 CSS px）。原本因「手機直式截圖塞橫框只露 34.5%」而考慮改直式，
  但 Yves 指示改用**量身設計的合成主視覺**後，內容由我們決定 → 沿用 4:3 不動 grid CSS，
  並可徹底移除逐產品 `object-position` 手調。
- **母版尺寸 1600×1200**（4:3，@2x 以上餘裕），輸出 webp。
- **每產品每語言各一張**：`site/assets/kv/<locale>/<product>.webp`，locale ∈ {en, ja, zh}。
- **12 個產品**：PurityLens、Fudeto、Kichitto、QiFlux、moonpacket、iDokuta、Mairi、Tendo、
  Rythix 2048、Meishitto、XunNi、Meguru（Yves 2026-08-08 核准後三者 + Meguru）。

## 工作項目

### A. TDD — 先立可執行驗收（必須先 RED）
- [x] A1 `scripts/audit-kv.mjs`：主視覺不變式（4:3 ±0.5%、1600×1200、webp、<200KB）
      → RED 確認（exit 2）。WebP parser 以現有 8 張實測，尺寸與 `sips` 完全一致，非空殼檢查。
- [x] A2 `scripts/audit-kv-registry.mjs`：三語 registry 對稱 + 素材對帳 + 禁止殘留 `pos`
      → RED 確認（48 項）。已修掉 ja/zh 路徑解析誤報（「找不到素材」誤報數 0）。
- [x] A3 改為**引用既有** `~/.claude/scripts/token-drift-lint.sh`（比對色系家族，比 byte-equality 穩健）
      → 依 search-first「找到既有就引用不另寫」。接為 `npm run check:design`，待 B2 產出 tokens 契約後才可跑。
- [x] A4 串進 `npm run check:all`，並在 `scripts/deploy-gh.sh` 的 gh-pages 上傳前強制跑
      → dry-run 驗證：腳本停在 audit，`!!! REACHED DEPLOY !!!` 未印出，gate 有效。
- [x] A5（計畫外，順手修）`scripts/check-todo.js` 假指標：原以 `fs.existsSync("../../.git")` 判斷
      「公開 repo 是否建立」，每跑一次就把正確狀態翻錯並寫回 TODO.md。已移出自動檢測；連跑兩次零汙染。

### B. 素材與設計
- [ ] B1 盤點 12 產品的美術素材（icon / 品牌色 / 字體 / 既有美術），產出素材清單
- [ ] B2 從既有 export 萃取設計契約 `docs/design-system/tokens/*.json`（目前不存在，是跨 batch 漂移的根因）
- [ ] B3 用 `claude-design-handoff` 驅動 Claude Design canvas，注入契約 + 12 產品素材，產出 12 張 KV 設計
- [ ] B4 export 下載 → 產圖 → 落到 `site/assets/kv/<locale>/`

### C. 資料與版面
- [ ] C1 `site/js/i18n/{en,ja,zh}.js` work registry：新增 Rythix 2048 / Meishitto / XunNi / Meguru
- [ ] C2 修正 Tendo 狀態 `wip` → Android shipped（Play `com.kkdstudios.tendo` 實測已上架，iOS lookup=0）
- [ ] C3 registry 改用 KV 路徑，移除所有 `pos`（object-position）欄位
- [ ] C4 `build-site.mjs` 的 hardcode `>08 products<` 改為從 registry 計算
- [ ] C5 `build-site.mjs` 的 SRC 指向當前 export（現指向 v1，v2 存在但從未被使用）

### D. 收尾
- [ ] D1 三支 checker 全 GREEN
- [ ] D2 本機 build + 三語 output 檢查
- [ ] D3 部署 gh-pages + curl 驗證線上實際生效
- [ ] D4 commit + push 到 `crealizellc/crealize-site` public-main
- [ ] D5 更新 Chronicle memory（修正「Next.js 14」的 stale 記載 — 實際是 build-site.mjs 靜態產生器）
