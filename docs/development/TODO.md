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

- [ ] 配置 GitHub Pages 部署 <!-- auto:manual;tip=请参考 docs/deployment/GITHUB_PAGES.md 完成部署 -->
- [ ] 完善文档内容 <!-- auto:manual;tip=请补充 docs/README.md、docs/website-content.md 等文档内容 -->

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

- [ ] **16 個產品沒有任何對外連結** `[實測]`
      形象站列出 16 個產品，訪客無法前往其中任何一個（App Store / Play / 官網皆無）。
      證據：`grep -o 'href=' site/js/work-v3.js | wc -l` → **0**；
      `grep -oE 'href|mailto|<a ' site/js/work-modal.js` → **無任何命中**（modal 內也沒有）。
      唯一的對外互動是 `#join` 的 `mailto:support@crealize.llc`。
      修法需先決定每個產品要指向哪裡（部分產品尚未上架），屬產品決策，不只是工程。

## 中

- [ ] **英文頁與繁中頁的日文片段缺 `lang="ja"`** `[實測]` — WCAG 2.1 SC 3.1.2 (AA)
      `site/index.html`（`lang="en"`）內含平假名/片假名的元素 **15 個，`lang` 屬性 0 個**；
      `site/zh/index.html`（`lang="zh-Hant"`）同樣 **15 個 / 0 個**。
      日文頁本身是 `lang="ja"`，繼承正確、無此問題。
      受影響的類別：`.jp-accent.hero__jp`（創造と実現）、`.card__jp`（成分をひと目で／
      一筆書き／きちっと…）、`.method-step__jp`、`.foot__muted .jp-accent`。
      後果：VoiceOver / NVDA 會用英文（或中文）發音規則朗讀日文，實際上不可理解。
      ⚠️ 15 這個數字是**下限** —— 偵測用的正則只比對單層 `<tag>text</tag>`，巢狀結構會漏。
      修法在 builder（`scripts/build-site.mjs`）或 `gen-work-v3.mjs` 產生時補 `lang="ja"`，
      不要手改產物。

- [ ] **語言選單關閉時，其三個連結仍可被聚焦** `[實測 + CSS]` — WCAG 2.4.3 / 2.4.7
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

- [ ] **沒有 skip link** `[實測]` — WCAG 2.1 SC 2.4.1 Bypass Blocks (A)
      桌面版首屏可聚焦元素 **59 個**，`a[class*=skip]` / `.skip-link` / `#skip` 皆不存在。
      鍵盤使用者每次載入都得穿過整個導覽才能到主內容。

- [ ] **表單驗證錯誤沒有標到欄位上** `[實測]` — WCAG 2.1 SC 3.3.1
      `site/js/site.js:268-282` 驗證失敗時只加 `.is-error` class（純視覺）。
      `grep -c aria-invalid site/index.html` → **0**。
      `#f-note` 有 `aria-live="polite"`（這點正確），但它只講「有錯」，
      不講**哪一欄**錯。修法：驗證時同步設 `aria-invalid="true"` 並用
      `aria-describedby` 指向錯誤訊息。

- [ ] **關閉 JS 時聯絡表單會靜默吞掉輸入** `[程式碼]`
      `<form class="join__form" id="join-form" novalidate>` —— **無 `action`**，
      且 `novalidate` 關掉了瀏覽器原生驗證。唯一的處理是 `site.js` 的
      `submit` + `preventDefault`。無 JS 時按下送出 = 對同一 URL 發 GET，
      輸入內容全部消失且沒有任何提示。
      `<noscript>` 目前只放兩條字體 stylesheet，沒有給無 JS 使用者的說明。
      修法擇一：`action="mailto:support@crealize.llc" method="post"`（陽春但可用）、
      或在 `<noscript>` 明示「請直接寄信到 support@crealize.llc」。

## 低

- [ ] **語言選單沒有 `aria-current`** `[實測]`
      目前語言只用 `class="is-active"` 標示（純視覺），
      `grep -c aria-current site/index.html` → **0**。
      螢幕閱讀器使用者無法得知目前在哪個語言。
      修法：現行語言的 `<a role="menuitem">` 加 `aria-current="true"`。
      （其餘 ARIA 是對的：`aria-haspopup`、`aria-expanded` 由 `site.js:174` 正確切換，
      三個連結都有 `hreflang` + `lang`。）

- [ ] **行動導覽切換鈕的無障礙名稱是 "Primary"** `[實測]`
      無障礙樹同時出現 `navigation "Primary"` 與 `button "Primary"`（兩者同名）。
      該按鈕由 `site.js` 動態產生，`aria-label` 取自 nav landmark。
      「Primary」描述的是地標，不是這顆按鈕的動作。
      修法：改成三語各自的「開啟選單 / メニューを開く / 開啟選單」，
      字串走既有的 `CRZ_I18N`。

- [ ] **404 頁只有英文** `[實測]`
      `site/404.html` 是 `lang="en"`，且不存在 `site/ja/404.html`、`site/zh/404.html`。
      GitHub Pages 對所有路徑（含 `/ja/*`、`/zh/*`）都回這一份。
      線上實測 `https://crealize.llc/no-such-page-xyz` → HTTP **404**（狀態碼正確），
      頁面有 `<a href="/">return to reality` 可回首頁。
      修法成本低但需決定要不要為 404 做三語（GitHub Pages 不支援依路徑分流 404）。

- [ ] **`atmosphere.js` 的兩個 resize 監聽順序錯置** `[程式碼]`
      `site/js/atmosphere.js:35` 註冊 `resize()` —— 它會重設 canvas 尺寸並在
      `prefersReduced` 時呼叫 `render(0)` 重繪；
      `:179` 另外註冊 `() => { seedRibbons(); seedMotes(); }` —— 重新隨機化種子
      （兩者合計 15 處 `Math.random()`）但**不重繪**。
      監聽依註冊順序執行 ⇒ 每次 resize 都是「用舊種子重繪」→「產生新種子但不畫」，
      新種子要等**下一次** resize 才會出現。且 `seedRibbons()` 沒有 reduced-motion 守衛，
      代表即使使用者要求減少動態，背景圖樣仍會在每次 resize 時改變。
      ⚠️ 誠實邊界：**使用者端可見程度未量測**。行動裝置捲動時網址列收合會觸發 resize，
      推測會看到背景跳動，但未在真機或模擬器上確認。

- [ ] **reduced-motion 下 hero 永遠停在結尾狀態，但「SCROLL TO MATERIALIZE」提示還在** `[實測]`
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
