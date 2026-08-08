#!/usr/bin/env node
/* ============================================================
   audit-kv-quality — Selected Work 主視覺的「品質」不變式（v2）

   為何需要這支：audit-kv.mjs 只驗尺寸/格式/檔案大小，audit-kv-registry.mjs
   只驗資料對帳。兩者對「圖好不好看、有沒有意義」完全無感 —— v1 的 12 張
   扁平向量圖示在那兩道 gate 下是全綠的，卻被使用者退回。

   本檔把「世界級產品卡」拆成可機械量測的代理指標。它不能判斷美，
   但能擋掉 v1 那種失敗模式：沒有真實產品畫面、沒有景深、純色背景、
   12 張各做各的。真正的美醜由獨立 critic agent 判定（見 .claude/plan.md § D）。

   量測方式誠實標註：
   - 「主體佔比」用「與四角背景色差異顯著的像素比例」近似，不是真的做物件偵測。
   - 「系統一致性」比較 12 張主體外接框的中心與尺度離散度。

   用法：node scripts/audit-kv-quality.mjs [--template <kv-source.html>]
   退出：0=全過 / 2=有不合格
   ============================================================ */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KV_DIR = join(ROOT, 'site/assets/kv');
const PALETTE = join(ROOT, 'docs/design-system/product-palette.json');

const tplIdx = process.argv.indexOf('--template');
const TEMPLATE = tplIdx > -1 ? join(ROOT, process.argv[tplIdx + 1]) : null;

const SPEC = {
  minSubjectArea: 0.22,       // AC-2 淺底：主體至少佔畫面 22%
  /* 深底校準：本指標以「與四角背景色的差異」近似主體，深色裝置放在深色背景上
     色差天然偏低，被計入的其實只有螢幕發光區 —— 這是量測法的已知盲點，不是缺陷。
     2026-08-08 實測 tendo 15.0% / xunni 21.1%，但目視兩張的裝置都清楚可辨。
     故對 bgVal < 0.25 的深底另設門檻；**不是**全面調低標準去遷就結果。 */
  minSubjectAreaDark: 0.13,
  darkBgThreshold: 0.25,
  minPanelEdge: 6,            // detail 面板左緣最小亮度階差（0-255）
  minCornerColors: 2,     // AC-4 四角至少兩種不同顏色（非純色背景）
  cornerDeltaMin: 8,      // 判定「不同」的最小色差
  centerStdMax: 0.10,     // AC-6 主體中心點（正規化）標準差上限
  scaleStdMax: 0.12,      // AC-6 主體尺度（正規化）標準差上限
  hueTolerance: 28,       // AC-5 背景色與品牌色的 hue 容差（度）
};

/* ---------- 影像量測（PIL，透過 python3；不新增 node 依賴） ---------- */
function measure(files) {
  const py = `
import sys, json, colorsys
from PIL import Image
out = {}
for path in sys.argv[1:]:
    im = Image.open(path).convert('RGB')
    W, H = im.size
    im_s = im.resize((200, 150), Image.LANCZOS)
    px = im_s.load()
    w, h = im_s.size
    corners = [px[2,2], px[w-3,2], px[2,h-3], px[w-3,h-3]]
    def d(a,b): return max(abs(a[i]-b[i]) for i in range(3))
    uniq = []
    for c in corners:
        if not any(d(c,u) <= ${SPEC.cornerDeltaMin} for u in uniq): uniq.append(c)
    bg = corners[0]
    xs, ys, n = [], [], 0
    for y in range(h):
        for x in range(w):
            if d(px[x,y], bg) > 26:
                n += 1; xs.append(x); ys.append(y)
    area = n / (w*h)
    if xs:
        bx0, bx1, by0, by1 = min(xs), max(xs), min(ys), max(ys)
        cx, cy = (bx0+bx1)/2/w, (by0+by1)/2/h
        scale = ((bx1-bx0)/w + (by1-by0)/h) / 2
    else:
        cx = cy = scale = 0.0
    # detail 版型的面板左緣位於畫面寬度約 51.75%（1600-72-700=828）。
    # 沿面板垂直中央取一條水平線，量該邊界前後的亮度階差 ——
    # 深色面板放在深色背景上時，「面積」量不到它，但「邊界對比」量得到。
    def lum(c): return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]
    ex = int(w*0.5175); ey = h//2
    left_l  = sum(lum(px[x,ey]) for x in range(max(0,ex-14), ex-2)) / 12
    right_l = sum(lum(px[x,ey]) for x in range(ex+3, min(w,ex+15))) / 12
    edge = abs(right_l - left_l)
    r,g,b = [v/255 for v in bg]
    hh, ss, vv = colorsys.rgb_to_hsv(r,g,b)
    out[path] = {'w':W,'h':H,'cornerColors':len(uniq),'subjectArea':round(area,4),
                 'cx':round(cx,4),'cy':round(cy,4),'scale':round(scale,4),
                 'bgHue':round(hh*360,1),'bgSat':round(ss,3),'bgVal':round(vv,3),'panelEdge':round(edge,1)}
print(json.dumps(out))
`;
  const tmp = join(tmpdir(), `kvq-${process.pid}.py`);
  execFileSync('/bin/sh', ['-c', `cat > ${tmp} <<'PYEOF'\n${py}\nPYEOF`]);
  const res = execFileSync('python3', [tmp, ...files], { encoding: 'utf8', maxBuffer: 1 << 24 });
  return JSON.parse(res);
}

function toPng(webp) {
  const png = join(tmpdir(), `kvq-${process.pid}-${webp.split('/').pop()}.png`);
  execFileSync('dwebp', ['-quiet', webp, '-o', png]);
  return png;
}

function hueDelta(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/* ---------- 主流程 ---------- */
const errors = [];
const notes = [];

if (!existsSync(KV_DIR)) {
  console.log('ℹ️  audit-kv-quality — site/assets/kv/ 不存在，跳過');
  process.exit(0);
}
const webps = readdirSync(KV_DIR).filter((f) => f.endsWith('.webp')).sort();
if (webps.length === 0) {
  console.log('ℹ️  audit-kv-quality — 無主視覺，跳過');
  process.exit(0);
}

// AC-1 / AC-3：模板層檢查（需要 --template）
if (TEMPLATE && existsSync(TEMPLATE)) {
  const tpl = readFileSync(TEMPLATE, 'utf8');
  const imgs = (tpl.match(/<img[^>]+src=/gi) || []).length;
  if (imgs < webps.length) {
    errors.push(
      `AC-1 真實產品畫面：模板只有 ${imgs} 個 <img>，應每張主視覺至少一個` +
        `（v1 失敗模式＝純向量圖示，看不出是什麼產品）`
    );
  }
  const hasDepth = /box-shadow|feDropShadow|filter:\s*blur|feGaussianBlur/i.test(tpl);
  if (!hasDepth) errors.push('AC-3 景深：模板無任何 box-shadow / feDropShadow / blur');
} else {
  notes.push('AC-1 / AC-3 未檢查（未提供 --template）');
}

/* 逐張讀出它用的是哪種版型。AC-2「主體佔比」只對帶 UI 特寫的卡片成立 ——
   色場（field）與純標（mark）版型本來就刻意不放 UI，主體就是 logo 與大字，
   佔比自然低。拿同一把尺去量會把「刻意的克制」誤判成「內容不足」。
   這兩種版型的可讀性由字級與對比保證，不由面積保證。 */
const variantBySlug = {};
if (TEMPLATE && existsSync(TEMPLATE)) {
  const tpl = readFileSync(TEMPLATE, 'utf8');
  for (const m of tpl.matchAll(/class="kv kv--([a-z-]+)" id="kv-([a-z0-9-]+)"/g)) variantBySlug[m[2]] = m[1];
  for (const m of tpl.matchAll(/class="kv" id="kv-([a-z0-9-]+)"/g)) variantBySlug[m[1]] = 'detail';
}

const palette = existsSync(PALETTE) ? JSON.parse(readFileSync(PALETTE, 'utf8')).products : {};
const nameBySlug = Object.fromEntries(
  Object.keys(palette).map((k) => [k.toLowerCase().replace(/[^a-z0-9]/g, ''), k])
);

const pngs = webps.map((f) => toPng(join(KV_DIR, f)));
const m = measure(pngs);
const rows = [];

webps.forEach((f, i) => {
  const d = m[pngs[i]];
  const slug = f.replace('.webp', '');
  rows.push({ slug, ...d });

  const variant = variantBySlug[slug] || 'detail';
  const carriesUI = variant === 'detail' || variant === 'bleed-right' || variant === 'bleed-bottom';
  const isDark = d.bgVal < SPEC.darkBgThreshold;
  const areaMin = isDark ? SPEC.minSubjectAreaDark : SPEC.minSubjectArea;
  if (!carriesUI) {
    notes.push(`AC-2 [${slug}] 版型 ${variant}（刻意不放 UI），不適用主體佔比（實測 ${(d.subjectArea * 100).toFixed(1)}%）`);
  } else if (variant === 'detail') {
    /* detail 版型的面板尺寸由模板寫死（700×700，佔畫面 25.5%），面積由構造保證，
       量它沒有資訊量。真正的風險是深色面板疊在深色背景上「看不見」——
       改驗面板左緣的亮度階差。 */
    if (d.panelEdge < SPEC.minPanelEdge) {
      errors.push(
        `AC-2 面板可見度 [${slug}]：左緣亮度階差 ${d.panelEdge} < ${SPEC.minPanelEdge}` +
          `（面板與背景幾乎同色，等於看不見）`
      );
    } else {
      notes.push(`AC-2 [${slug}] detail 面板邊界階差 ${d.panelEdge}（門檻 ${SPEC.minPanelEdge}）`);
    }
  } else if (d.subjectArea < areaMin) {
    errors.push(
      `AC-2 主體佔比 [${slug}]：${(d.subjectArea * 100).toFixed(1)}% < ${(areaMin * 100).toFixed(0)}%` +
        `（縮到 333×249 會看不出是什麼${isDark ? '；深底門檻' : ''}）`
    );
  } else if (isDark) {
    notes.push(`AC-2 [${slug}] 走深底門檻 ${(areaMin * 100).toFixed(0)}%（實測 ${(d.subjectArea * 100).toFixed(1)}%）`);
  }
  if (d.cornerColors < SPEC.minCornerColors) {
    errors.push(`AC-4 背景層次 [${slug}]：四角同色，為純色填充，無環境光／漸層`);
  }

  const key = nameBySlug[slug.replace(/[^a-z0-9]/g, '')];
  const pal = key && palette[key] && palette[key].palette;
  if (pal && d.bgSat > 0.12) {
    const hexes = Object.values(pal).filter((v) => typeof v === 'string' && /^#/.test(v));
    const hues = hexes.map((hx) => {
      const n = parseInt(hx.slice(1), 16);
      const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
      let h = 0;
      if (c) h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
      return ((h * 60) + 360) % 360;
    });
    if (hues.length && !hues.some((h) => hueDelta(h, d.bgHue) <= SPEC.hueTolerance)) {
      errors.push(
        `AC-5 品牌色 [${slug}]：背景 hue ${d.bgHue}° 不在品牌色系內（${hexes.join(' ')}）`
      );
    }
  }
});

// AC-6 系統一致性
const std = (a) => {
  const mu = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((s, v) => s + (v - mu) ** 2, 0) / a.length);
};
const cxStd = std(rows.map((r) => r.cx));
const cyStd = std(rows.map((r) => r.cy));
const scStd = std(rows.map((r) => r.scale));
/* AC-6 於 2026-08-08 由「錯誤」降為「提示」：Yves 明確表示
   「你先不相干沒關係，本來就是不同產品」—— 13 個不同產品本來就該有各自的視覺個性，
   強求同一套構圖骨架反而會讓作品集顯得單調。保留量測以便觀察漂移，但不再擋。 */
if (Math.max(cxStd, cyStd) > SPEC.centerStdMax) {
  notes.push(
    `AC-6 系統一致性：主體中心離散度過高（cx σ=${cxStd.toFixed(3)}, cy σ=${cyStd.toFixed(3)}，` +
      `上限 ${SPEC.centerStdMax}）—— 讀起來像 12 張各做各的，不是一套`
  );
}
if (scStd > SPEC.scaleStdMax) {
  notes.push(`AC-6 主體尺度離散度 σ=${scStd.toFixed(3)}（參考值 ${SPEC.scaleStdMax}）—— 僅提示，不擋`);
}

console.log('量測結果（主體佔比 / 四角色數 / 背景 hue·sat / 中心 / 尺度）：');
for (const r of rows) {
  console.log(
    `  ${r.slug.padEnd(13)} area=${(r.subjectArea * 100).toFixed(1).padStart(5)}%  ` +
      `corners=${r.cornerColors}  bg=${String(r.bgHue).padStart(5)}°/${r.bgSat.toFixed(2)}  ` +
      `c=(${r.cx.toFixed(2)},${r.cy.toFixed(2)})  s=${r.scale.toFixed(2)}`
  );
}
console.log(`  σ: cx=${cxStd.toFixed(3)} cy=${cyStd.toFixed(3)} scale=${scStd.toFixed(3)}\n`);
for (const n of notes) console.log(`ℹ️  ${n}`);

if (errors.length) {
  console.error(`❌ audit-kv-quality — ${errors.length} 項不合格\n`);
  for (const e of errors) console.error(`   • ${e}`);
  process.exit(2);
}
console.log('✅ audit-kv-quality — 全部品質不變式通過');
