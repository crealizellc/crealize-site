/* ============================================================
   極簡 CDP client — 驅動 automation Chrome（port 9222）

   為什麼自己寫：本專案原則是零依賴傾向，而 Playwright / puppeteer 本機都沒裝
   （見 scripts/render-kv.mjs 的同一段理由）。Node 22 起有全域 WebSocket，
   CDP 本身就是 JSON-over-WebSocket，需要的功能用不到 200 行。

   為什麼不是 claude-in-chrome MCP：那條路吃不了本機檔案路徑，
   而我們要把各產品的 app icon 當參考圖上傳（見 ~/.claude/rules/chrome-tabs.md 第 4 條）。
   `DOM.setFileInputFiles` 可以直接餵本機路徑。

   固定 profile / 固定 port，launch-or-REUSE：先跑
   `bash ~/.claude/scripts/automation-chrome.sh 0`，不要另外開 Chrome。
   ============================================================ */

const HOST = 'http://localhost:9222';

async function http(path, method = 'GET') {
  const res = await fetch(HOST + path, { method });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function listPages() {
  const all = await http('/json/list');
  return all.filter((t) => t.type === 'page');
}

export async function newTab(url) {
  return http(`/json/new?${url}`, 'PUT');
}

export async function closeTab(id) {
  return http(`/json/close/${id}`);
}

/** 連上一個分頁，回傳可下 CDP 指令的 session。 */
export async function attach(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error.data ?? '')})`));
      else resolve(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      for (const fn of listeners.get(msg.method)) fn(msg.params);
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const on = (method, fn) => {
    if (!listeners.has(method)) listeners.set(method, []);
    listeners.get(method).push(fn);
  };

  /** 在頁面執行 JS，回傳 JSON 化的值。丟出的例外會變成本地的 Error。 */
  const evaluate = async (fn, ...args) => {
    const expr = `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`;
    const r = await send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (r.exceptionDetails) {
      throw new Error('page eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    }
    return r.result.value;
  };

  /** 反覆執行 fn 直到回傳 truthy，或逾時。 */
  const waitFor = async (fn, { timeout = 60000, interval = 700, label = 'condition' } = {}) => {
    const t0 = Date.now();
    for (;;) {
      let v;
      try { v = await evaluate(fn); } catch { v = null; }
      if (v) return v;
      if (Date.now() - t0 > timeout) throw new Error(`等待逾時（${Math.round(timeout / 1000)}s）：${label}`);
      await new Promise((r) => setTimeout(r, interval));
    }
  };

  /** 把本機檔案餵給頁面上的 <input type=file>。claude-in-chrome 做不到這件事。 */
  const setFiles = async (selector, files) => {
    const { root } = await send('DOM.getDocument', { depth: -1, pierce: true });
    const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
    if (!nodeId) throw new Error(`找不到檔案輸入框：${selector}`);
    await send('DOM.setFileInputFiles', { nodeId, files });
  };

  const navigate = async (url) => {
    await send('Page.enable');
    await send('Page.navigate', { url });
  };

  const close = () => ws.close();

  await send('Runtime.enable');
  return { send, on, evaluate, waitFor, setFiles, navigate, close, target };
}

/** 取得（或開啟）指向某網域的分頁並 attach。 */
export async function openOn(urlPrefix, fallbackUrl = urlPrefix) {
  let pages = await listPages();
  let t = pages.find((p) => p.url.startsWith(urlPrefix));
  if (!t) {
    await newTab(fallbackUrl);
    await new Promise((r) => setTimeout(r, 2500));
    pages = await listPages();
    t = pages.find((p) => p.url.startsWith(urlPrefix));
  }
  if (!t) throw new Error(`開不了分頁：${fallbackUrl}`);
  return attach(t);
}
