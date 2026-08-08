# Crealize Corporate Site

## 架構真相（先讀這段，別照舊記載動手）

**線上站不是 Next.js 產生的。** repo 裡雖有 Next.js 14 依賴與 `pages/`、`src/`，但
`crealize.llc` 服務的是 `gh-pages` branch。證據不是「找不到 Next.js 指紋」，而是正面比對：
線上 HTML 與 `site/index.html` 的 sha256 相同（`846e7c6a…`，2026-08-08 實測）。

```
docs/design-system/source/claude-design-export/Crealize Corporate Site.html  ← 輸入 1：DOM 結構
site/js/i18n/en.js（CRZ_I18N.work）                                          ← 輸入 2：產品清單
  → scripts/build-site.mjs（注入三語 head / SEO / JSON-LD / i18n script）
  → site/{index.html, ja/index.html, zh/index.html}   ← builder 只寫這 3 個檔
  → scripts/deploy-gh.sh → gh-pages branch → crealize.llc
```

**動手前必須知道的五件事**（皆 2026-08-08 第一手驗證）：

1. **builder 有兩個輸入，不是一個。** 只換 export HTML 不會換掉產品清單；
   若兩者的產品不同步，build 會中止（`loadWorkRegistry` 交叉驗證）。
2. **export HTML 只決定 DOM 結構，不決定樣式。** 版面外觀由手工的
   `site/css/sections.css`（19KB）決定，它與 export 已分岔。
   「重新 export 就等於換好版面」是錯的 —— CSS 沒跟著換會錯位。
3. **`site/css/*`、`site/js/*` 共 8 檔，builder 一個都不產生**，其中
   **7 個已與 export 分岔，但 `site/js/atmosphere.js` 與兩份 export 逐 byte 相同**
   （`c88a7318…`）。**不要整包覆蓋 `site/js/`**：那會毀掉手工的 hero/site/work-modal/i18n；
   也不要以為 `atmosphere.js` 可以隨便改，它還跟 export 同步。
4. **`claude-design-export` 與 `-v2` 的主 HTML 位元完全相同**（`28af457f…`），
   builder 指名 v1 在版面層面沒有區別力；兩份只差 `css/sections.css`、`js/site.js`、
   `js/work-modal.js` 三檔。
5. **`site/` 有 commit ≠ 已上線。** 要確認線上狀態，比對
   `git show origin/gh-pages:index.html | shasum -a256` 與線上 curl 的雜湊。

部署：`npm run deploy:gh`。它從 `.env.local` 讀 `GH_TOKEN` 組出 token URL 直接指定目標 repo，
不讀本地 remote 設定 —— 但**目標 repo 就是 `origin` 那一個**（`crealizellc/crealize-site`），
且 `gh-pages` 內部的 remote 名字字面就叫 `origin`。不要誤以為是推去別的 repo。

⚠️ 部署用 `-t/--dotfiles`（GitHub Pages 需要 `.nojekyll`），代價是 `site/` 內**任何** dotfile
都會被公開發佈。`deploy-gh.sh` 已有白名單 guard（只允許 `.nojekyll`）+ 部署後 curl 驗證。

## Claude Design URL
Claude Design canvas: https://claude.ai/design/p/dbbc5234-c185-49b2-97b2-09bf8b59aaf0
（2026-06-10 建立 — 「Materialize」概念重設計：desktop 1440 + mobile 390、tokens、atoms、hero scroll prototype）

### 取件：用 `DesignSync` MCP，不要再繞路（2026-08-09 實證）

```
DesignSync method="list_files" projectId="dbbc5234-c185-49b2-97b2-09bf8b59aaf0"
DesignSync method="get_file"   projectId="…" path="Work v3.html"   → truncated:false，256 KiB 內完整
```

`DesignSync` 是**唯一可靠**的取件路徑，一次呼叫拿到完整原始碼。
以下四條**全部試過、全部失敗**，不要重踩：① Share→Export 下載落在 macOS TCC 擋住的
Chrome profile（`mdfind` 在此環境完全失效）② canvas 簽章 URL curl → 403
③ 瀏覽器 POST/導航到 localhost → CSP `connect-src` + Private Network Access 雙重擋下
④ 從 chat DOM 分段讀取 → 單次截斷 ~1200 字元、且安全過濾器會擋掉 `content="a=b, c=d"` 這類字串。

**subagent 沒有這個工具** —— 它是 orchestrator 專屬的 deferred tool。要 agent 接軌設計檔，
先由 orchestrator 取回落檔，再把本機路徑交給它。

## 設計系統契約（送 brief 前必做）

真相源：`docs/design-system/tokens/crealize.tokens.json`（DTCG，自 `tokens.css` 機械萃取）。

送任何 Claude Design brief 前，**先把契約原文嵌進 brief 開頭**並明令延用：

```bash
cat docs/design-system/tokens/crealize.tokens.json
# → 貼進 brief 開頭 + 寫明「延用此契約，禁止發明新色板／字體／radius」
```

改完視覺檔後強制驗證：

```bash
npm run check:design   # token-drift-lint：色系家族 + 字體白名單
npm run check:kv       # 主視覺母版規格 + 三語 registry 對帳
```

契約三處同在才不漂移：**物理檔**（上面那個 json）·**注入**（brief 前置 cat）·**強制**（上面兩個 check）。
缺任何一處，跨 session 風格必漂。
