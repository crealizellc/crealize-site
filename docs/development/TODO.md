# 开发任务清单（自动化友好）

> 本清单支持自动化检测与生成，所有自动化注释均为英文半角，人工任务有详细提示。

## 仓库与基础配置

- [x] 创建公开仓库 crealize <!-- auto:check=repo:crealize -->
- [x] 创建私有仓库 crealizecode <!-- auto:check=repo:crealizecode -->
- [x] 添加 README 文件 <!-- auto:check=file:README.md;gen=README -->
- [x] 配置仓库关系 <!-- auto:manual;tip=请参考 docs/README.md 的仓库关系说明 -->

## 页面结构

- [x] 创建页面 index.tsx <!-- auto:check=file:src/app/index.tsx;gen=page:首页 -->
- [x] 创建页面 about.tsx <!-- auto:check=file:src/app/about.tsx;gen=page:关于我们 -->
- [x] 创建页面 contact.tsx <!-- auto:check=file:src/app/contact.tsx;gen=page:联系方式 -->

## 组件与样式

- [x] 创建组件 Button.tsx <!-- auto:check=file:src/components/ui/Button.tsx;gen=component:Button -->
- [x] 创建全局样式文件 <!-- auto:check=file:src/styles/globals.css;gen=style:global -->

## 需人工确认

- [x] 配置 GitHub Pages 部署 <!-- auto:manual;tip=请参考 docs/deployment/GITHUB_PAGES.md 完成部署 -->
  ✅ 已驗證（2026-09-04）：`gh api repos/crealizellc/crealize-site/pages` → status=built、cname=crealize.llc、source=gh-pages:/、https_enforced=true、憑證 approved；`https://crealize.llc/` HTTP 200（server: GitHub.com）。部署腳本 `scripts/deploy-gh.sh`，回退 `scripts/rollback-gh.sh`。
- [x] 完善文档内容 <!-- auto:manual;tip=请补充 docs/README.md、docs/website-content.md 等文档内容 -->
  ✅ 已完成（2026-09-04）：README.md / CLAUDE.md 對齊線上實況（之前整份在描述已停用的 Next.js）；證據包 `docs/perf-evidence/2026-09-04/`、`docs/ux-evidence/2026-09-04/`；文案對照 `docs/copy-review/2026-09-04-de-ai.md`。

---

> 相关文档：
>
> - [项目规范 .cursorrules](../../.cursorrules)
> - [部署指南 docs/deployment/GITHUB_PAGES.md](../deployment/GITHUB_PAGES.md)
> - [项目结构 docs/README.md](../README.md)

## 第二步：设置开发环境

1. 安装必要软件

   - 安装 Git
   - 安装 Node.js
   - 安装 VS Code

2. 配置开发工具
   - 安装 VS Code 插件
   - 配置 Git
   - 设置开发环境变量

## 第三步：项目初始化

1. 克隆私有仓库到本地
2. 安装项目依赖
3. 运行开发服务器
4. 确认环境正常

## 第四步：基础功能开发

1. 创建页面结构

   - 首页
   - 关于我们
   - 项目展示
   - 技术理念
   - 加入我们
   - 联系方式

2. 实现基础样式
   - 设置主题颜色
   - 创建响应式布局
   - 添加基础动画

## 第五步：高级功能开发

1. 添加多语言支持

   - 设置语言切换
   - 配置翻译系统

2. 集成 Twitter
   - 设置 Twitter API
   - 显示推文内容

## 第六步：优化和测试

1. 性能优化

   - 图片优化
   - 加载速度优化

2. 测试和调试
   - 功能测试
   - 兼容性测试

## 第七步：部署上线

1. 构建项目

   ```bash
   npm run build
   ```

2. 部署到公开仓库
   - 复制构建文件到公开仓库
   - 提交并推送更改
   - 在 GitHub 设置中启用 Pages

## 注意事项

1. 每完成一个任务就打勾
2. 遇到问题及时记录
3. 保持代码提交记录
4. 定期备份代码
5. 开发代码在私有仓库进行
6. 稳定版本推送到公开仓库
7. 保持两个仓库的文档同步

## 当前进度

> ⚠️ 下列「第一步～第七步」是 2025 年 Next.js 版的計畫，該架構 2025-09-10 起停用；線上站的實際狀態見本檔下方「線上站 UX / 無障礙缺陷清單」（13/13 已修）。此清單保留作歷史，不再更新。


- [ ] 第一步：创建仓库
  - [x] 创建公开仓库 crealize
  - [x] 创建私有仓库 crealizecode
  - [x] 配置仓库关系
- [ ] 第二步：设置开发环境
- [ ] 第三步：项目初始化
- [ ] 第四步：基础功能开发
- [ ] 第五步：高级功能开发
- [ ] 第六步：优化和测试
- [ ] 第七步：部署上线

---

# 線上站 UX / 無障礙缺陷清單（2026-09-04 唯讀稽核）

> ⚠️ **本檔上半部已過期**：它描述的是 `src/app/index.tsx`、`src/components/ui/Button.tsx`
> 那套 **2025-09-10 起就停用的 Next.js 架構**，與 `crealize.llc` 線上跑的 `site/` 靜態站無關。
> 上半部未刪除（保留歷史），但**不要照著它做**。架構真相見 `README.md` 與 `CLAUDE.md`。
>
> 以下條目全部針對**真正上線的 `site/`**。
>
> **稽核基準**：PR #2 分支 `perf/critical-path-and-doc-alignment`，
> 已部署 gh-pages `fa04bf170934571e6dd928063a0e92cddafae8cb`
> （已驗證：該 gh-pages 樹與 PR HEAD 的 `site/` 樹 **67 個檔案 blob 雜湊逐一相同**）。
>
> **證據等級標註**：`[實測]` = 在此稽核中實際跑出來的觀測值；
> `[程式碼]` = 從原始碼確定，但互動行為未在本 harness 實測。
> 沒有標註的不要當事實。

## 高

- [x] **16 個產品沒有任何對外連結** `[實測]`
      ✅ **已修（2026-09-04，PR #3 `feat/product-links-and-remaining-fixes`）**：registry（`site/js/i18n/{en,ja,zh}.js`）新增 `url`，modal 有 url 才顯示 `.work-modal__cta`（新分頁 + noopener，文字走 `ui.ctaLabel`：Open／開く／前往）。**連結目標選自家產品頁而非商店**：13 個都有 200 且標題含產品名的公開頁（10 個 `*.smartrich.ai`、moonpacket.com、xunni.xyz、ymytrade.jp），地區中立、我們可控、頁內再導向各商店。App Store 經 iTunes Search 另查到 6 個 Crealize LLC 上架（PurityLens id6762415650 / Fudeto id6772628821 / QiFlux id6770532808 / Mairi id6771640651 / Rythix 2048 id6784661615 / Meishitto id6792575822），未採用為主連結。**無連結（我決定）**：Meguru（無公開頁，`meguru.smartrich.ai` 000）、dramaflow（`dramaflow.smartrich.ai` 是內部審核台）、Todoke（console 登入頁）。
      新 gate `scripts/audit-links.mjs`（`check:links`，需網路；掛在 `deploy-gh.sh`）：三語 url 一致、https、HTTP 200、本文含產品名 —— 13/13 通過。瀏覽器實測：en 開 PurityLens → CTA 可見可聚焦、href 正確、`target=_blank rel=noopener`；Meguru → CTA hidden 且無 href；ja「開く Meishitto ↗」、zh「前往 PurityLens ↗」。
      形象站列出 16 個產品，訪客無法前往其中任何一個（App Store / Play / 官網皆無）。
      證據：`grep -o 'href=' site/js/work-v3.js | wc -l` → **0**；
      `grep -oE 'href|mailto|<a ' site/js/work-modal.js` → **無任何命中**（modal 內也沒有）。
      唯一的對外互動是 `#join` 的 `mailto:support@crealize.llc`。
      修法需先決定每個產品要指向哪裡（部分產品尚未上架），屬產品決策，不只是工程。

## 中

- [x] **英文頁與繁中頁的日文片段缺 `lang="ja"`** `[實測]` — WCAG 2.1 SC 3.1.2 (AA)
      ✅ **已修（2026-09-04）**：`gen-work-v3.mjs:224` 的 `card__jp` 一律 `lang="ja"`（內容來自 work-copy.json，三語皆日文）；執行期的 `index-row__jp` / `method-step__jp`（site.js）與 modal 的 `.work-modal__jp`（work-modal.js）改為**假名偵測**才標 —— 因為 zh.js 的 `jp` 有 10 個是中文譯名，硬標會錯。瀏覽器實測：en 頁 card 16/16、index row 13/16（其餘 3 個是純漢字，規則刻意不宣稱）、modal `lang=ja`；zh 頁 index row 6/16 標 ja —— 核對 zh.js 那 6 個確實含假名（音で解く 2048／名刺っと／めぐる／気付き／短編ドラマ生産ライン／届け）。
      ⚠️ 修正原條目的計數：原本說「15 個元素缺 lang」，其中 2 個 `jp-accent`（創造と実現／日本・東京）在 export 就帶 `aria-hidden="true"`，是裝飾、螢幕閱讀器本來就不唸 —— 真正的缺口是 13 個 `card__jp`，加上靜態掃描看不到的執行期元素（index rows / method / modal）。
      `site/index.html`（`lang="en"`）內含平假名/片假名的元素 **15 個，`lang` 屬性 0 個**；
      `site/zh/index.html`（`lang="zh-Hant"`）同樣 **15 個 / 0 個**。
      日文頁本身是 `lang="ja"`，繼承正確、無此問題。
      受影響的類別：`.jp-accent.hero__jp`（創造と実現）、`.card__jp`（成分をひと目で／
      一筆書き／きちっと…）、`.method-step__jp`、`.foot__muted .jp-accent`。
      後果：VoiceOver / NVDA 會用英文（或中文）發音規則朗讀日文，實際上不可理解。
      ⚠️ 15 這個數字是**下限** —— 偵測用的正則只比對單層 `<tag>text</tag>`，巢狀結構會漏。
      修法在 builder（`scripts/build-site.mjs`）或 `gen-work-v3.mjs` 產生時補 `lang="ja"`，
      不要手改產物。

- [x] **語言選單關閉時，其三個連結仍可被聚焦** `[實測 + CSS]` — WCAG 2.4.3 / 2.4.7
      ✅ **已修（2026-09-04）**：`site.css` `.nav__langmenu` 關閉態加 `visibility: hidden`（transition 加 `visibility 0s linear .3s` 讓淡出先跑完），`.is-open` 態 `visibility: visible`。瀏覽器實測（killing test）：關閉時對 `a[hreflang=ja]` 呼叫 `.focus()` → `activeElement` **不再**是它（修正前是）；打開後 `.focus()` 成功。
      `.nav__langmenu` 關閉狀態是 `opacity: 0; visibility: visible; display: flex;
      pointer-events: none`（`site/css/site.css:180` 附近）。
      `opacity:0` **不會**把元素移出循序焦點順序（`display:none` / `visibility:hidden` /
      `inert` 才會）。實測：對 `a[hreflang="ja"]` 呼叫 `.focus()` 成功，
      `document.activeElement` 確實變成該連結，其 rect 為 **134×38**（非零尺寸）。
      後果：鍵盤使用者會把焦點停在三個看不見的連結上。
      ⚠️ 誠實邊界：**實際 Tab 遍歷未能在本 harness 確認**（Browser pane 的按鍵未送達文件）。
      已確認的是「可聚焦」，Tab 會不會走到那裡是依 CSS 規格推得，未親眼看到。
      修法：關閉時加 `visibility: hidden`（配合既有 transition）或 `inert`。
      對照組：`.nav__panel` 用 `display:none`，實測程式化 focus **失敗**，處理正確 —— 可照抄。

- [x] **沒有 skip link** `[實測]` — WCAG 2.1 SC 2.4.1 Bypass Blocks (A)
      ✅ **已修（2026-09-04）**：`build-site.mjs` 在 `<body>` 第一個子節點注入 `<a class="skip-link" href="#main">`（三語文字 Skip to content／メインコンテンツへ／跳至主要內容），`<main>` 改為 `<main id="main" tabindex="-1">`（Safari 對純 id 錨點不移焦點）；樣式在 `site.css` 以 `:focus` 顯示（skip link 在畫面外、只可能經鍵盤聚焦，`:focus-visible` 的啟發式在部分 AT／合成事件下不成立）。
      瀏覽器實測：從 `.nav__brand` Shift+Tab → 焦點落在 `a.skip-link`（DOM 順序正確）；程式化 `.click()` → `location.hash=#main` 且 `activeElement === main#main`；再 Tab → 焦點進入 `#main` 內第一張卡片（跳過整個導覽）。
      ⚠️ 誠實邊界：聚焦時的滑入動畫在 Browser pane 觀察不到（`document.hidden === true`，隱藏分頁不推進 CSS transition，computed 值停在起點）；把元素的 `transition` 暫時設為 none 後讀到 opacity 1 / transform none / top 10px，證明 cascade 正確。真機的視覺呈現未親眼確認。
      桌面版首屏可聚焦元素 **59 個**，`a[class*=skip]` / `.skip-link` / `#skip` 皆不存在。
      鍵盤使用者每次載入都得穿過整個導覽才能到主內容。

- [x] **表單驗證錯誤沒有標到欄位上** `[實測]` — WCAG 2.1 SC 3.3.1
      ✅ **已修（2026-09-04）**：`site.js` 初始化時每個 `[required]` 設 `aria-invalid="false"` + `aria-describedby="f-note"`；submit 驗證時與 `.is-error` 同步設 `aria-invalid`。瀏覽器實測：空表單 `requestSubmit()` 後 f-name / f-email / f-msg 全部 `aria-invalid="true"`，`#f-note` 顯示 formErr。
      `site/js/site.js:268-282` 驗證失敗時只加 `.is-error` class（純視覺）。
      `grep -c aria-invalid site/index.html` → **0**。
      `#f-note` 有 `aria-live="polite"`（這點正確），但它只講「有錯」，
      不講**哪一欄**錯。修法：驗證時同步設 `aria-invalid="true"` 並用
      `aria-describedby` 指向錯誤訊息。

- [x] **表單：輸入後 `.is-error` 清除但 `aria-invalid` 留 `true`（承上條的子項）** `[實測]` — WCAG 2.1 SC 4.1.2
      ✅ **已修（2026-09-04，本機 commit、未部署）**：`site.js` 抽出 `isBad(input)` 與 `mark(input, bad)`，input 監聽只掛 `[required]` 且 `if (submitted) mark(input, isBad(input))`。不變量＝錯誤可見 = aria-invalid = submitted && invalid(value)：送出前不提前報錯，送出後每次輸入按真實有效性重驗（email「a@」「a@b」「a b@c.d」維持錯誤；再次清空重新標錯）。
      gate：`scripts/audit-form-state.mjs`（`npm run check:form`，已入 `check:all`），三語 × 9 步、期望值寫死不呼叫產品謂詞、不送有效表單。RED 對修前程式碼紅 15 項（S2/S2b/S2c/S3/S4 × 三語）；GREEN 0 項；三個突變各紅在對的位置：M1 監聽改回只 remove class → 15（S2–S4）、M2 拿掉 submitted 閘 → 6（S0b/S0c 提前報錯）、M3 mark 不設 aria → 15（S1/S2/S2b/S2c/S4）。
      2026-09-04 對現行部署（gh-pages `e82fb28`）量到：空欄送出後在 f-name 輸入一字 → `.is-error` = false、`aria-invalid` 仍 = "true"，直到下次送出才同步（`site/js/site.js:315` 只移除 class）。視覺說沒錯、螢幕閱讀器說有錯。en 與 ja 皆同。
      Codex 對齊（2026-09-04）：先記錄、不實作。之後修時要**按欄位真實有效性**同步兩者（空值／email 格式重新驗），不能任意一字就清除錯誤——尤其無效 email 不該在打第一個字時就被判為正確。
      驗證方法：`docs/ux-evidence/2026-09-04/states/capture-states.mjs form` 之後補一步「輸入一字 → 讀 `.is-error` 與 `aria-invalid`」；修前應不一致，修後兩者皆依有效性一致（空值→皆錯、`a@` →皆錯、合法 email→皆對）。

- [ ] **表單：全欄修正有效後 `#f-note` 仍顯示 formErr，直到下次送出** `[實測]` — 恢復流程缺口，未驗收
      2026-09-04 `audit-form-state.mjs` S3 量到（三語同）：三欄皆有效後 note 仍為「Please fill the required fields marked in orange.」。gate 只印資訊不驗收（Codex 對齊：上一條只管欄位狀態一致，不宣稱完整表單 UX PASS）。note 是 aria-live=polite 區，改文字會觸發朗讀；恢復成什麼（回預設／改「可以送出了」）是另一個決策，先不展開。

- [x] **關閉 JS 時聯絡表單會靜默吞掉輸入** `[程式碼]`
      ✅ **已修（2026-09-04，PR #3 `feat/product-links-and-remaining-fixes`）**：`build-site.mjs` 注入 `action="mailto:support@crealize.llc" method="post" enctype="text/plain"`（無 JS 時瀏覽器直接開郵件程式帶入欄位；有 JS 時 `preventDefault` 照舊接手）＋ `<noscript>` 三語說明。反向測試拿掉注入並重建 → exit 2（三語）。
      `<form class="join__form" id="join-form" novalidate>` —— **無 `action`**，
      且 `novalidate` 關掉了瀏覽器原生驗證。唯一的處理是 `site.js` 的
      `submit` + `preventDefault`。無 JS 時按下送出 = 對同一 URL 發 GET，
      輸入內容全部消失且沒有任何提示。
      `<noscript>` 目前只放兩條字體 stylesheet，沒有給無 JS 使用者的說明。
      修法擇一：`action="mailto:support@crealize.llc" method="post"`（陽春但可用）、
      或在 `<noscript>` 明示「請直接寄信到 support@crealize.llc」。

- [x] **zh 頁同一產品：卡片顯示日文副名、modal 顯示中文譯名** `[實測]` —— 需你決定
      ✅ **已修（2026-09-04，PR #3 `feat/product-links-and-remaining-fixes`）**：走非破壞路線 ②：`gen-work-v3.mjs` 的 `card__jp` 改為優先讀本頁 registry 的 `jp`（zh 的 10 個譯名生效），沒有才退回 work-copy.json 的日文；`lang="ja"` 改依假名偵測。**不動任何人已寫的譯文**。瀏覽器實測 zh PurityLens：卡片「成分一目了然」== modal「成分一目了然」，皆無 `lang`（中文，繼承 zh-Hant）；6 個未譯者（音で解く 2048 等）維持日文並標 `lang=ja`。gate 改為「含假名者必標、不含者不得標」，三語 en 13/16、ja 13/16、zh 6/16。若要改採「日文副名全站當品牌識別」，只需把 `zh.js` 那 10 個 `jp` 改回日文，其餘不用動。
      卡片的 `card__jp` 取自 `docs/design-system/work-copy.json` 的 `p.jp`（locale 無關，永遠日文）；
      modal 與 Index 列取自 `site/js/i18n/zh.js` 的 `work[].jp`（中文譯名）。
      實測 zh 頁 PurityLens：卡片「成分をひと目で」、點開 modal「成分一目了然」—— 同一欄位兩種語言。
      而且 `zh.js` 只譯了 10/16：音で解く 2048／名刺っと／めぐる／気付き／短編ドラマ生産ライン／届け 仍是日文。
      三條路都站得住，選錯代價低，但這是品牌／文案決策：① 全站把日文副名當品牌識別（zh.js 的 jp 改回日文）
      ② zh 頁全部用中文譯名（work-copy.json 加 zh 欄位、gen-work-v3 依 locale 取）③ 維持現狀。
      我的建議是 ①：`card__jp` 這個 class 名、export 設計稿、與 en 頁的行為都表明它是「日文副名」這個品牌元素，
      zh.js 的譯名看起來是翻譯時順手譯過頭。

## 低

- [x] **語言選單沒有 `aria-current`** `[實測]`
      ✅ **已修（2026-09-04）**：`build-site.mjs` 的語言選單模板在 `is-active` 那一筆同時輸出 `aria-current="true"`。三語產物各恰好 1 個，且 hreflang 與頁面語言一致（gate 檢查）；瀏覽器實測 en 頁 `[aria-current]` → hreflang=en，zh 頁 → zh-Hant。
      目前語言只用 `class="is-active"` 標示（純視覺），
      `grep -c aria-current site/index.html` → **0**。
      螢幕閱讀器使用者無法得知目前在哪個語言。
      修法：現行語言的 `<a role="menuitem">` 加 `aria-current="true"`。
      （其餘 ARIA 是對的：`aria-haspopup`、`aria-expanded` 由 `site.js:174` 正確切換，
      三個連結都有 `hreflang` + `lang`。）

- [x] **行動導覽切換鈕的無障礙名稱是 "Primary"** `[實測]`
      ✅ **已修（2026-09-04）**：`site.js:201` 改讀 `UI.menuLabel`，三語 i18n 各加 `ui.menuLabel`（Menu／メニュー／選單）。瀏覽器實測 390px：en 頁按鈕 aria-label=Menu、ja 頁=メニュー；landmark 仍是 Primary，兩者不再同名。
      無障礙樹同時出現 `navigation "Primary"` 與 `button "Primary"`（兩者同名）。
      該按鈕由 `site.js` 動態產生，`aria-label` 取自 nav landmark。
      「Primary」描述的是地標，不是這顆按鈕的動作。
      修法：改成三語各自的「開啟選單 / メニューを開く / 開啟選單」，
      字串走既有的 `CRZ_I18N`。

- [x] **404 頁只有英文** `[實測]`
      ✅ **已修（2026-09-04，PR #3 `feat/product-links-and-remaining-fixes`）**：`site/404.html` 三語同檔：三個 `<p lang data-l>` 段落，內嵌腳本依 `location.pathname` 的 `/ja/` `/zh/` 前綴切換 `<html lang>` 與可見段落並指回各語首頁；`<noscript>` 三段全顯。瀏覽器實測（`replaceState` 到 `/ja/no-such-page` 後重跑腳本）：`lang=ja`、只顯示 ja 段、連結 `/ja/`；`/zh/x` → `zh-Hant`。線上實測見部署後複驗。
      `site/404.html` 是 `lang="en"`，且不存在 `site/ja/404.html`、`site/zh/404.html`。
      GitHub Pages 對所有路徑（含 `/ja/*`、`/zh/*`）都回這一份。
      線上實測 `https://crealize.llc/no-such-page-xyz` → HTTP **404**（狀態碼正確），
      頁面有 `<a href="/">return to reality` 可回首頁。
      修法成本低但需決定要不要為 404 做三語（GitHub Pages 不支援依路徑分流 404）。

- [x] **`atmosphere.js` 的兩個 resize 監聽順序錯置** `[程式碼]`
      ✅ **已修（2026-09-04，PR #3 `feat/product-links-and-remaining-fixes`）**：`resize()` 只重設尺寸；重播種監聽改為 `seedRibbons(); seedMotes(); if (prefersReduced) render(0);` —— 新種子立刻畫出，不再等下一次 resize。gate 檢查單一重播種監聽 + 重播種後重繪 + `resize()` 內不得先用舊種子 render；反向測試拿掉 `render(0)` → exit 2。使用者端可見程度仍未量測（同原條目）。
      `site/js/atmosphere.js:35` 註冊 `resize()` —— 它會重設 canvas 尺寸並在
      `prefersReduced` 時呼叫 `render(0)` 重繪；
      `:179` 另外註冊 `() => { seedRibbons(); seedMotes(); }` —— 重新隨機化種子
      （兩者合計 15 處 `Math.random()`）但**不重繪**。
      監聽依註冊順序執行 ⇒ 每次 resize 都是「用舊種子重繪」→「產生新種子但不畫」，
      新種子要等**下一次** resize 才會出現。且 `seedRibbons()` 沒有 reduced-motion 守衛，
      代表即使使用者要求減少動態，背景圖樣仍會在每次 resize 時改變。
      ⚠️ 誠實邊界：**使用者端可見程度未量測**。行動裝置捲動時網址列收合會觸發 resize，
      推測會看到背景跳動，但未在真機或模擬器上確認。

- [x] **reduced-motion 下 hero 永遠停在結尾狀態，但「SCROLL TO MATERIALIZE」提示還在** `[實測]`
      ✅ **已修（2026-09-04，PR #3 `feat/product-links-and-remaining-fixes`）**：`hero.js`：`prefersReduced` 時 `scrollLabel.hidden = true`（只藏「Scroll to materialize」那個 span，右側 `p=` 讀數與 phase 標籤保留，它們反映真實狀態）。敘事本身（直接給結果）維持原設計。反向測試拿掉該行 → exit 2。
      `site/js/hero.js:442` `const p = prefersReduced ? 1 : ...`、
      `:461` `choreographType(prefersReduced ? 1 : progress)` ——
      `p` 對 reduced-motion 使用者恆為 1，捲動不會改變它。
      實測（`--force-prefers-reduced-motion` 截圖）：hero 直接顯示「**Reality.**」、
      進度指示 `p=1.00`、完整產品 UI；一般模式則是「Imagination」`p=0.00`。
      兩個後果：① 這群使用者**永遠看不到「Imagination」**，
      而 Imagination → Reality 正是公司定位的核心敘事；
      ② 「SCROLL TO MATERIALIZE」這個提示對他們永久為假（已經 materialize 完了）。
      ⚠️ 這**可能是刻意的**無障礙取捨（跳過動畫、直接給結果），所以列為低優先、
      需要設計決策而非直接改。若要改：至少讓提示文字在 `p===1` 時換掉。

- [x] **KV 主視覺 `uses-responsive-images` 50 分（首屏 `kv/puritylens.webp` 浪費 84%）** `[實測]`
      這一項原本不在本清單（列在 `docs/perf-evidence/2026-09-04/README.md` 的「已知未處理」），此處補記以免遺漏。
      ✅ **已修（2026-09-04，PR #3 `cbe14ee`，gh-pages `24f0d11f`）**：800×600 變體放 `site/assets/kv-800/`（母版 16 張 sha256 不變 `d9968599d97105a2`），
      `stage__bg` 加 `srcset`/`sizes`；新 gate `audit-kv-variants.mjs`（存在／檔頭 800×600／bytes<母版／母版目錄純淨／三語 srcset+sizes）。
      線上 CDP 實測 7 個視口×DPR 選圖全對、modal 3/3 足夠、真實 bytes 變體 ≈30.5 KB vs 母版 ≈70.6 KB、390@2x 並排 PSNR 41.4 dB。
      證據：`docs/ux-evidence/2026-09-04/`。Lighthouse 分數未重跑。

## 稽核中確認為「正確」的項目（避免下次重測）

- 三語切換：9 種組合（3 頁 × 3 語）的相對路徑全部解析正確，**線上 curl 全 HTTP 200** `[實測]`
- `lang` 屬性：`en` / `ja` / `zh-Hant` 三頁皆正確 `[實測]`
- `hreflang` alternates 含 `x-default`，三頁齊備 `[實測]`
- `aria-expanded`：語言選單（`site.js:174`）與行動導覽（`:218`）都會正確切換 `[實測]`
- Escape 關閉：語言選單（`site.js:184`）、行動導覽（`:229`，且會 `btn.focus()` 把焦點還回按鈕）、
  work modal（`work-modal.js:321`）**三處監聽都存在且寫法正確** `[程式碼]`
- reduced-motion 的 rAF 守衛正確：`atmosphere.js:182` 的 `requestAnimationFrame(loop)`
  只在 `!prefersReduced` 時啟動；`hero.js` **根本沒有 rAF 迴圈**（只在 scroll 與初始化時 render）`[程式碼]`
- 行動導覽面板：DOM 順序在觸發按鈕**之後**（Tab 可自然進入），關閉時 `display:none`
  且程式化 focus 實測**失敗**（正確移出焦點順序）`[實測]`
- `:focus-visible` 焦點樣式存在（含 `#work .card:focus-visible .stage`）`[實測]`
- `#f-note` 有 `aria-live="polite"` `[實測]`
- 404 回真正的 HTTP 404 且有回首頁連結 `[實測]`
- `mailto:support@crealize.llc` 在三語頁皆存在 `[實測]`

## 本次稽核中被我撤回的三個誤判（記錄下來，免得重犯）

1. **「reduce 模式下仍有動畫」——錯，是測試設計錯誤。**
   我比對了兩張 `--force-prefers-reduced-motion` 截圖（t=6s 與 t=9s）發現 0.55% 像素不同，
   就判定動畫沒關掉。實際上那兩張來自**兩次獨立的頁面載入**，而 `atmosphere.js`
   用 15 處 `Math.random()` 初始化緞帶 —— 不同載入的靜態幀本來就不一樣。
   **同一份設定的兩次獨立載入不能拿來判斷「有沒有在動」**，要比就得在同一次載入內比。

2. **「Escape 不關閉行動導覽」——錯，按鍵沒送達。**
   Browser pane 在 `navigate` 之後不會自動把鍵盤焦點交給文件
   （`document.activeElement` 停在 `body`，Tab 與 Escape 都無效），
   要先在頁面空白處點一下。程式碼實際是正確的（`site.js:229`）。

3. **「桌面版的 `.nav__panel` 連結仍在 tab 序列」——錯。**
   它是 `display:none`，程式化 `.focus()` 實測失敗，已正確移出。
   與語言選單（`opacity:0`）是**不同的機制**，不能一概而論 —— 這也正是語言選單該學它的地方。

> 共同教訓：**用瀏覽器 harness 做的每一個「否定結論」，都要先問「我的按鍵/取樣真的到達了嗎」。**
> 三個誤判裡有兩個是 harness 沒送到，一個是取樣方法本身不成立。
