# XunNi — 素材出處

取件日：2026-08-09
來源 repo：`/Users/yves/Downloads/XunNi-APP`（XunNi 產品本體）

| 檔 | 原始路徑 | 說明 |
|---|---|---|
| `logo_opt_rmbg.svg` | `apps/webapp/public/logo_opt_rmbg.svg` | **向量母版**，495×504pt。官網 icon 由它渲染 |
| `logo_opt_rmbg.png` | `apps/webapp/public/logo_opt_rmbg.png` | 同一標記的點陣去背版，495×504 |
| `native-app-icon.png` | `apps/native/resources/icon.png` | 原生 app 的商店 icon，640²，金色標記＋黑底＋星點 |

## 官網用的是哪一個，為什麼

`site-assets/icons/xunni.png`（1024²，白底黑標）由 **`logo_opt_rmbg.svg` 渲染**，
不是用 `native-app-icon.png`。

Yves 2026-08-09 明確指定：官網卡片上的 XunNi icon 就是這個黑色書法體標記。
在此之前站上用的是一個藍色幾何 X 加網格底 —— 與產品本體的任何一個資產都對不上。

渲染方式（可重現）：把 SVG 以 base64 內嵌進一張 1024×1024 白底 HTML，
標記佔 92%、`object-fit: contain` 置中，Chrome headless `--screenshot`。

## 複驗

```bash
# 母版與產出是不是同一個標記（肉眼比對）
open docs/design-system/source/harvested/xunni/logo_opt_rmbg.svg site-assets/icons/xunni.png
# 官網用的尺寸規格
node scripts/audit-kv-registry.mjs
```
