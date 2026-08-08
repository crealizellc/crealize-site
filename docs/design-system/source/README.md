# Claude Design export — 哪一份為準

**結論：`claude-design-export/` 是 builder 實際使用的那一份。**
`scripts/build-site.mjs` 的 `SRC` 常數寫死指向它。

## 兩份的實際差異（2026-08-08 以 sha256 / cmp 逐檔比對）

| 檔案 | v1 vs v2 |
|---|---|
| `Crealize Corporate Site.html` | **完全相同**（`28af457f…`） |
| `Design Tokens and Atoms.html` | 不同 |
| `css/tokens.css`、`css/site.css`、`css/work-modal.css` | 相同 |
| `css/sections.css` | 不同 |
| `js/atmosphere.js`、`js/hero.js` | 相同 |
| `js/site.js`、`js/work-modal.js` | 不同 |

**版面 HTML 位元完全相同**，所以「builder 用 v1 還是 v2」在版面層面沒有區別力 ——
指名 v1 不代表 v2 是舊的或錯的，只代表兩者對 builder 而言等價。

## 為什麼兩份都留著

`claude-design-export-v2/` 目前**沒有任何程式引用**，但它與 v1 在
`sections.css` / `site.js` / `work-modal.js` 三檔上不同，可能保存了未被採用的設計嘗試。
刪除會失去這份差異，收益只是少一個目錄 —— 不划算，故保留並以本檔標註。

## 重要：export 不是線上樣式的真相源

`site/css/*` 與 `site/js/*` 由 builder **完全不產生**，且 8 個檔中 7 個已與兩份 export
分岔（唯一例外：`site/js/atmosphere.js` 與兩份 export 逐 byte 相同，`c88a7318…`）。

因此：

- **不要**整包覆蓋 `site/js/` 或 `site/css/` —— 會毀掉手工維護的 hero / site / work-modal。
- 重新從 Claude Design export 後，**只換 `Crealize Corporate Site.html` 不會改變線上外觀**，
  因為版面樣式在手工 CSS 裡。
- 動視覺前先跑 `npm run check:design` 確認未偏離 `docs/design-system/tokens/` 契約。
