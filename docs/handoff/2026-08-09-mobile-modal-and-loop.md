# 交接文件 — 手機版動態與 modal 可關閉性

**日期**：2026-08-09（本 session 開自 MacBook Air）
**分支**：`public-main` → 已 ff 併入 `main`，兩者同在 `e0a82e4`
**狀態**：已部署 `crealize.llc`，生產環境三語獨立複驗通過

> 承接 [2026-08-09-selected-work-and-nav-rebuild.md](2026-08-09-selected-work-and-nav-rebuild.md)。
> 那份記錄的是 Selected Work 重做與導覽修復；這份記錄的是**在真手機上才會現形的兩個缺陷**，
> 以及為了讓它們下次不再溜過去而新增的第八道 gate。

---

## 一句話總結

Yves 在真手機上點開作品，發現卡片不會動、modal 關不掉。兩個都是真缺陷，而且**前七道
gate 全綠**——因為它們全部在 1440px 或「390px 寬的 iframe」裡量，而 iframe 既沒有真實
視窗高度、也永遠是 `hover: hover`。新增的 `audit-mobile-modal.mjs` 走 CDP 真裝置模擬，
補上這個盲區。

---

## 缺陷一：卡片動態在手機上等同靜止圖

**症狀**：手機上作品卡片看起來完全不會動。

**根因**：卡片的 motif 多半是 `animation: … both`，`iterations = 1`，只播一次。
桌機靠 `mouseenter` 重播（`gen-work-v3.mjs` 的 `replay()`），**觸控裝置沒有 hover，
那段程式永遠不會觸發**。而那唯一一次播放，是在卡片剛越過 `vh * 0.9`、還在畫面下緣時
發生的——使用者捲到它面前時，動畫早就結束了。

線上 390px 實測第一張卡：

```
isLive: true, animCount: 6
plBall  playState=finished  currentTime=1100  iterations=1
plRow   playState=finished  currentTime=620   iterations=1
draw    playState=finished  currentTime=1720  iterations=1
```

**修法**：coarse pointer（`matchMedia('(hover: none)')`）上，卡片進入畫面中央帶
（`top < vh*0.85 && bottom > vh*0.15`）就持續循環。沿用**既有的** `.is-looping`
——那原本只用在 modal，這次把選擇器從 `.work-modal__shot .stage.is-looping`
放寬成 `.stage.is-looping`，不另外寫一套動畫。

兩個刻意的節制：
- **只循環中央帶內的卡片**，390px 螢幕同時至多 1–2 張，不會 16 張一起燒電。
- **不留常駐 interval**。循環開關只在捲動位置改變時需要重算，交給既有的
  `scroll` / `resize` 監聽；原本那個 `setInterval` 仍然在 `pending` 清空後自行結束。

`.is-looping` 的規則本身包在 `@media (prefers-reduced-motion: no-preference)` 內，
所以暈動症使用者不受影響（已實測，見下）。

---

## 缺陷二：modal 在手機上進得去出不來

**症狀**：Yves 的描述是「關閉按鈕會被遮擋」。實測比這更嚴重——**按鈕整個在畫面外**。

**根因**：`.work-modal` 是 `display: grid; place-items: center`。內容比視窗高時，
溢出會**上下均分**，於是卡片頂端跑到負座標，右上角的關閉鈕跟著被推出畫面。

線上 390×844 實測：

```
card:  y=-55  h=954     ← 內容比視窗高 110px
close: y=-40  h=32      ← 完全在畫面上緣之外
document.elementFromPoint(關閉鈕中心) → null
```

手機沒有 Esc 鍵，卡片左右又只剩 16px 背景可點（`data-close` 在 backdrop 上，但
16px 不是可用的觸控目標）——實務上等於無法關閉。

**修法**：窄視口改為**全屏 sheet**：

- `.work-modal { padding: 0; place-items: stretch; }`
- `.work-modal__card` 釘成 `height: 100%`，剛好一個視窗高
- `.work-modal__content` 變成內部捲動容器（`overflow-y: auto` +
  `overscroll-behavior: contain`），上下 padding 讓出 `env(safe-area-inset-*)`
- **關閉鈕從 `__content` 移出，成為 `__card` 的直屬子元素**（`work-modal.js`）
  ——留在 `__content` 裡會跟著正文一起被捲走
- 放大到 44×44（WCAG 2.5.8），底色改不透明並加陰影，避免捲到一半與正文疊字

**設計依據**：用 `DesignSync get_file` 取回 canvas 的 `css/work-modal.css` 原文比對，
**設計檔與線上逐字相同，同樣沒有處理「內容高於視窗」的情況**。這是設計缺口，不是
照設計實作的偏差，所以由工程端補。（`WebFetch` 對 canvas URL 是 403——CLAUDE.md
已記載那條路走不通，`DesignSync` 才是唯一可靠取件路徑。）

---

## 第八道 gate：`scripts/audit-mobile-modal.mjs`

**為什麼要獨立一支**，而不是加進 `audit-work-v3.mjs`：既有的 AC-6 是把頁面塞進
一個 390px 寬的 iframe 量的。iframe 量得到**寬度**，但

- iframe 的**高度是我們自己給的**，量不出「modal 比真實視窗高會怎樣」
- iframe 在桌面 Chrome 裡**永遠是 `hover: hover`**，量不出「觸控裝置看不到動畫」

兩個都要真的 device emulation，所以走 CDP `Emulation.setDeviceMetricsOverride`
（`mobile: true`）+ `setTouchEmulationEnabled`。

| AC | 內容 |
|---|---|
| M-1 | 關閉鈕完整落在視窗內，且 `elementFromPoint` 回傳的就是它自己（真的點得到） |
| M-2 | 關閉鈕 ≥ 44×44 |
| M-3 | 卡片高度 ≤ 視窗，溢出必須發生在內部捲動容器 |
| M-4 | 點關閉鈕真的關得掉 |
| M-5 | 中央帶卡片有 `is-looping`，且 ≥1 個元素 `iteration = infinite` |
| M-6 | reduce-motion 下 0 個元素在動 |

三語 × M-1..M-5 + 一次 reduce-motion，共 22 項斷言，約 25 秒。

### gate 自己的兩個缺陷（一併修掉，值得記住）

1. **共用 port** → 第二個語系會連到前一個「正在死掉」的 Chrome 實例然後永久卡住。
   現在每次換 port + 換 profile。
2. **卡住時 Node 以 exit 0 結束**（`unsettled top-level await` 只是 warning）。
   ——gate 一個字都沒驗卻是綠燈，**比沒有 gate 更糟**。現在加 120s 硬逾時 +
   語系覆蓋率自檢（`measured !== LOCALES.length` 直接算失敗）。

### 負面測試（真實路徑）

| 還原成什麼 | gate 反應 |
|---|---|
| modal 的 `max-width: 700px` 區塊還原成舊版 | ✗ 關閉鈕點不到 `rect.y=-40` 最上層=`null`／✗ 59×32 < 44px／✗ 卡片 954px > 視窗 844px／✗ 無內部捲動容器 |
| `COARSE` 改成 `false` 重新產生 `work-v3.js` | ✗ 中央 1 張卡片只有 0 張 `is-looping`／✗ 0 個 infinite（三語共 6 項） |

---

## 管線與驗收現況

```bash
npm run check:all
# check:todo → check:rules → check:kv（3支）→ check:work（9個AC）
# → check:nav → check:prerender → check:mobile（新）→ check:design
```

`scripts/deploy-gh.sh` 也已加入同一道，位置在 `audit-prerender` 之後。

⚠️ **`site/js/work-v3.js` 是 `scripts/gen-work-v3.mjs` 產生的**，不要直接改
（本次一開始就改錯地方了）。正確順序仍是
`gen-work-v3 → build-site → prerender-work`。

---

## 生產環境複驗（不採信部署腳本的自我回報）

CDP 直接開 `https://crealize.llc/`，390×844 `mobile: true`，三語逐一：

```
en/  loop {"hoverNone":true,"centred":1,"looping":1,"infinite":14}
     modal {"y":13,"w":63,"h":44,"hit":true,"cardH":844,"vh":844,"ov":"auto"} closed=true
ja/  同上
zh/  同上
```

`hit: true` = 關閉鈕在該點是最上層元素；`cardH == vh` = 沒有溢出把 UI 推出畫面；
`infinite: 14` = 手機上真的在動。

---

## 已知未盡事項

1. ~~iDokuta 的語言數自相矛盾~~ **已於 `0a8dfe9` 查清並修正，且查出的問題比數字大。**
   產品自己的線上站 `https://idokuta.smartrich.ai/`（HTTP 200）三處一致寫
   「5 Languages」「5 Supported languages」「Translate into Japanese and 4 more
   languages — English, Chinese, Korean, Vietnamese」。**「六」的來源是 app UI 的
   6 個 locale（5 個使用者語言 + 日文），被誤當成對外宣稱。**
   同時發現整個定位寫錯：站上寫 telehealth / オンライン診療 / 線上診療服務，
   實際是「就醫時把症狀寫成日文拿給對方看」的語言工具 —— 而本站正文自己就寫著
   「這是語言工具，不是醫療建議」，同一個 modal 裡自相矛盾，且宣稱診療有醫療廣告
   合規風險。已一併改掉，`applicationCategory` 也從非法值 `MedicalApplication`
   改為 `HealthApplication`。
   **教訓：查一個數字之前先問「這個數字在講什麼」——本例的兩個數字根本不是同一件事。**

1b. **Mairi 曾被低報成「開發中」。** 同一次調查用 Google Play 複驗
   `health.mairi.app`（HTTP 200、「Mairi - まいり」、最終更新日 2026/07/29、
   更新說明「初回リリース」、無早期存取標記）→ 早就公開上架。已改為 shipped，
   `os` 依 iTunes lookup 三次 `resultCount=0` 收斂為只寫 Android。

1c. **有一支已上架產品不在 Selected Work 上**：Google Play
   `com.jung.dicex3dx`「ダイスキング - 5種のサイコロゲーム」，與其他產品同一個
   開發者帳號（`4841036895034202102`）。設計 canvas 內也有 `shots/dicex3d.png`，
   顯然不是沒發現過。**要不要收進 16 張卡是策展判斷，不是我該替 Yves 決定的**
   —— 加一張卡要新的主視覺、icon、三語文案（走 `product-card` skill）。
2. **兩份 design export 已分岔**（`claude-design-export` vs `-v2`）。CLAUDE.md 第 4 條
   已於 `73edc13` 更正並寫明後果：從 Claude Design 重新 export 蓋掉 v1，會無聲吃掉
   Codex 那批文案改動，且沒有任何 gate 蓋得到 v2。
3. **文案聲音被壓平**（Codex 那批改動）。事實更清楚、AI 腔更少，但也更通用。
   已在上一輪回報中附具體 before/after，屬品味決策，等 Yves 定調。
4. **crealize 仍未納入 `~/dotfiles/claude/full-auto-projects.json`。** 登記簿受
   baseline-protect 物理保護，agent 不得自我登記；要納管需 Yves 本人
   `touch ~/dotfiles/.claude-protected-unlock`。

---

## 回退

```bash
bash scripts/rollback-gh.sh --dry-run
```

`public-main` 與 `main` 同在 `e0a82e4`；本次改動集中在單一 commit，可獨立 revert。

---

## 相關檔案索引

- `scripts/audit-mobile-modal.mjs` — 真手機模擬驗收（新增）
- `scripts/gen-work-v3.mjs` — `COARSE` 循環分支（`site/js/work-v3.js` 由它產生）
- `site/css/work-modal.css` — 窄視口全屏 sheet + `.stage.is-looping` 放寬
- `site/js/work-modal.js` — 關閉鈕移出 `__content`
- `scripts/deploy-gh.sh` / `package.json` — gate 鏈接線
