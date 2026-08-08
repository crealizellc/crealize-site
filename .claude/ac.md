# AC — Selected Work v3（`site/js/work-v3.js` + `#work` 版面）

> source: Claude Design 專案 `dbbc5234-c185-49b2-97b2-09bf8b59aaf0` / `Work v3.html`
> （2026-08-09 以 `DesignSync method="get_file"` 取回，`truncated:false`）
> 落檔：`docs/design-system/source/claude-design-export/Work v3.html`

本 feature 把 WORK 區從「8 張 featured 截圖卡 + 索引表」改為
「12 張 per-product motif 卡（各自的動畫）+ 三語各自撰寫的說明 + 索引表」。
`work-v3.js` 是純 DOM 渲染，無網路、無狀態、無使用者輸入，
故驗收以「渲染後 DOM 的可量測不變式」為準，用 Chrome headless 實跑三語頁面取值。

驗證指令（一句話跑完全部）：

```bash
node scripts/audit-work-v3.mjs
```

## Happy path

- **AC-1（產品齊全）** 三語頁面各自渲染出 **12** 張 `#work-cards .card`，
  且每張的 `data-work-index` 落在 `0..11` 且**互不重複** —— 重複代表
  registry 對帳錯位，會讓 modal 開錯產品。
- **AC-2（三語真的不同）** 同一張卡的 `.card__body` 文字，en / ja / zh
  三者兩兩相異，且 ja、zh 版本各自含有該語言字元（ja 含平假名或片假名；
  zh 含中日韓統一表意文字且不含平假名）。防的是「多語版本其實是同一份英文」。
- **AC-3（圖片實際存在）** 每張非 `nophone` 卡的 `<img src>` 解析後在
  `site/` 下確實有檔，且副檔名為 `.webp`。ja/zh 頁的相對路徑（`../assets/…`）
  必須解析到同一批檔案 —— 這是 2026-08-08 踩過的坑（路徑對但檔不在）。
  卡片手機框內放的是 **`assets/shots/*.webp`（直立截圖，由 `build-shots.mjs` 產）**，
  不是 `assets/kv/*.webp`（1600×1200 橫向海報）。2026-08-09 實拍踩過：
  把橫向海報塞進 9:19.5 的框，`object-fit:cover` 會把字裁成一半，像破圖。
- **AC-4（動畫存在且尊重 reduce-motion）** `sections.css` 的 WORK v3 區塊
  內含 `@media (prefers-reduced-motion:reduce)` 且該區塊有
  `animation:none`；同時至少 10 個產品各有自己的 `@keyframes`。

## Error / edge

- **AC-5（registry 對帳失敗要大聲）** 把 `CRZ_I18N.work` 抽掉一個產品後，
  頁面 console 必須出現 `[work-v3] registry 對帳失敗`。
  防的是靜默渲染出 11 張卡 —— 缺一個產品比整區壞掉更難被發現。
- **AC-6（無水平溢出）** 1440 / 1100 / 640 / 390 四個寬度下，
  `document.documentElement.scrollWidth === window.innerWidth`。
  Work v3 的斷點是 3 欄 → 1100px 2 欄 → 640px 1 欄，邊界值必須實測。
- **AC-7（契約未漂移）** `npm run check:design` 綠 —— WORK v3 的 CSS
  不得引入契約外的色系家族或字體。Work v3 原檔自帶一份 `:root` token，
  刻意**不**移植（`site/css/tokens.css` 是唯一真相源），本條就是在守這件事。
