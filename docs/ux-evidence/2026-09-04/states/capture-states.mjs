// 現行部署（https://crealize.llc）的互動狀態證據：選單 / 語系選單 / modal / 表單驗證。沿用 scripts/lib/cdp.mjs。
// 用法：SP=<輸出根目錄> node capture-states.mjs [all|menu|lang|modal|form]（預設 all；只跑一段時其餘檔不動，探針合併進 <SP>/states/probes.json）
// 表單只走「空欄位送出」路徑（site.js 驗證失敗即 return，不會走到 mailto），不送真表單。
// 表單取景 = A2「送出鈕與其下方的 #f-note 捲到可見」（使用者按送出前的真實位置，錯誤訊息同框）；C「表單頂端捲到 y=0」保留為負對照：
// 固定 nav 必遮住 NAME 標籤，證明 labelClearOfNav 這條斷言真的會紅。任何斷言失敗 → exit 1 並列出哪一條。
import { spawn } from 'node:child_process'; import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { attach, listPages } from '/Users/crealize-00/Projects/crealize-site/scripts/lib/cdp.mjs';
const ONLY=process.argv[2]||'all', want=(k)=>ONLY==='all'||ONLY===k;
const OUT=process.env.SP+'/states', PORT=9341, BASE='https://crealize.llc', sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[`--remote-debugging-port=${PORT}`,'--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1280,800','--user-data-dir='+OUT+'/profile','about:blank'],{stdio:'ignore'});
const rep=existsSync(OUT+'/probes.json')?JSON.parse(readFileSync(OUT+'/probes.json','utf8')):{};
const fails=[]; const assert=(name,cond,detail)=>{ console.log(`${cond?'✓':'✗'} ${name} — ${detail}`); if(!cond) fails.push(`${name} — ${detail}`); };
const shot=async(s,name)=>{const r=await s.send('Page.captureScreenshot',{format:'png'});writeFileSync(`${OUT}/${name}.png`,Buffer.from(r.data,'base64'));};
const settled=(s)=>s.evaluate(()=>({vis:document.visibilityState,anim:document.getAnimations().filter(a=>a.playState==='running'&&!(a.effect?.target?.closest?.('.stage'))&&!(a.effect?.target?.id==='atmosphere')).length}));
try{ let ok=false; for(let i=0;i<60;i++){try{await listPages(PORT);ok=true;break}catch{await sleep(250)}} if(!ok)throw new Error('no cdp');
  const open=async(loc,w,h,dpr,mobile)=>{const t=(await listPages(PORT)).find(x=>x.type==='page');const s=await attach(t);await s.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:dpr,mobile});await s.navigate(`${BASE}/${loc}`);await sleep(2000);return s;};
  // 1) ja 390：行動選單開啟
  if(want('menu')){ const s=await open('ja/',390,844,2,true);
    await s.evaluate(()=>document.querySelector('.nav__menu').click()); await sleep(700);
    rep.menu_ja_390=await s.evaluate(()=>{const b=document.querySelector('.nav__menu'),p=document.querySelector('.nav__panel');return {ariaExpanded:b.getAttribute('aria-expanded'),ariaLabel:b.getAttribute('aria-label'),panelHidden:p.hidden,panelDisplay:getComputedStyle(p).display,links:[...p.querySelectorAll('a')].map(a=>a.textContent.trim().replace(/\s+/g,' '))};});
    Object.assign(rep.menu_ja_390, await settled(s)); await shot(s,'ja-390-menu-open');
    await s.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))); await sleep(400);
    rep.menu_ja_390.afterEscape=await s.evaluate(()=>({ariaExpanded:document.querySelector('.nav__menu').getAttribute('aria-expanded'),panelHidden:document.querySelector('.nav__panel').hidden,focusOnButton:document.activeElement===document.querySelector('.nav__menu')}));
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  // 2) en 1280：語系選單開啟（不點語言連結）
  if(want('lang')){ const s=await open('',1280,800,1,false);
    await s.evaluate(()=>document.querySelector('.nav__globe').click()); await sleep(600);
    rep.lang_en_1280=await s.evaluate(()=>{const w=document.getElementById('lang-switch'),m=w.querySelector('.nav__langmenu'),ja=m.querySelector('a[hreflang="ja"]');ja.focus();const f=document.activeElement===ja;document.activeElement.blur();return {ariaExpanded:w.querySelector('.nav__globe').getAttribute('aria-expanded'),menuVisibility:getComputedStyle(m).visibility,menuOpacity:getComputedStyle(m).opacity,items:[...m.querySelectorAll('a')].map(a=>a.textContent+'('+a.getAttribute('hreflang')+(a.getAttribute('aria-current')?',current':'')+')'),jaFocusableWhileOpen:f};});
    Object.assign(rep.lang_en_1280, await settled(s)); await shot(s,'en-1280-lang-open');
    await s.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))); await sleep(500);
    rep.lang_en_1280.afterEscape=await s.evaluate(()=>{const w=document.getElementById('lang-switch'),m=w.querySelector('.nav__langmenu'),ja=m.querySelector('a[hreflang="ja"]');ja.focus();const f=document.activeElement===ja;document.activeElement.blur();return {ariaExpanded:w.querySelector('.nav__globe').getAttribute('aria-expanded'),menuVisibility:getComputedStyle(m).visibility,jaFocusableWhileClosed:f};});
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  // 3) zh 1280：modal 開啟（現行文案）
  if(want('modal')){ const s=await open('zh/',1280,800,1,false);
    await s.evaluate(()=>document.querySelector('.work-card[data-work-index="0"]').scrollIntoView({block:'center'})); await sleep(1200);
    await s.evaluate(()=>document.querySelector('.work-card[data-work-index="0"]').click()); await sleep(2300);
    rep.modal_zh_1280=await s.evaluate(()=>{const m=document.querySelector('.work-modal'),c=m.querySelector('.work-modal__cta');return {modalHidden:m.hidden,name:m.querySelector('.work-modal__name').textContent,jp:m.querySelector('.work-modal__jp').textContent,cta:c.textContent,href:c.getAttribute('href'),target:c.target,rel:c.rel,bodyStart:m.querySelector('.work-modal__body')?.textContent.trim().slice(0,40)};});
    Object.assign(rep.modal_zh_1280, await settled(s)); await shot(s,'zh-1280-modal-open');
    await s.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))); await sleep(500);
    rep.modal_zh_1280.afterEscape=await s.evaluate(()=>({modalHidden:document.querySelector('.work-modal').hidden}));
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  // 4) en 1280 + ja 390：表單空欄位送出 → 驗證錯誤狀態（不會走到 mailto）
  if(want('form')) for(const [loc,w,h,dpr,mobile,name] of [['',1280,800,1,false,'en-1280-form-invalid'],['ja/',390,844,2,true,'ja-390-form-invalid']]){
    const s=await open(loc,w,h,dpr,mobile);
    const measure=()=>{const nav=document.querySelector('.nav').getBoundingClientRect(),lab=document.querySelector('label[for="f-name"]').getBoundingClientRect(),btn=document.getElementById('f-submit').getBoundingClientRect(),nt=document.getElementById('f-note').getBoundingClientRect();
      return {href:location.href,scrollY:Math.round(scrollY),active:document.activeElement.tagName+(document.activeElement.id?'#'+document.activeElement.id:''),navBottom:Math.round(nav.bottom),labelTop:Math.round(lab.top),labelBottom:Math.round(lab.bottom),labelClearOfNav:lab.top>=nav.bottom,labelInViewport:lab.top>=0&&lab.bottom<=innerHeight,submitInViewport:btn.top>=0&&btn.bottom<=innerHeight,noteTop:Math.round(nt.top),noteBottom:Math.round(nt.bottom),innerH:innerHeight,noteInViewport:nt.top>=0&&nt.bottom<=innerHeight};};
    const state=()=>{const f=document.getElementById('join-form'),n=document.getElementById('f-note');return {invalid:[...f.querySelectorAll('[required]')].map(i=>i.id+':'+i.getAttribute('aria-invalid')),isError:f.querySelectorAll('.field.is-error').length,note:n.textContent.trim(),noteLive:n.getAttribute('aria-live'),formErr:window.CRZ_I18N.ui.formErr};};
    // A2：使用者按送出前的真實位置 —— #f-note 底緣對齊視口底 −24px（送出鈕與錯誤訊息同框；留 24px 讓送出後變長的訊息也在框內）
    await s.evaluate(()=>{const nt=document.getElementById('f-note').getBoundingClientRect();window.scrollTo({top:window.scrollY+nt.bottom-window.innerHeight+24,behavior:'instant'});}); await sleep(800);
    const before=await s.evaluate(measure);
    await s.evaluate(()=>document.getElementById('join-form').requestSubmit()); await sleep(600);
    const after=await s.evaluate(measure), st=await s.evaluate(state);
    const r=rep[name]={framing:'A2 #f-note 底緣對齊視口底 −24px（送出鈕與錯誤訊息同框）後空欄送出',before,after,...st,hrefUnchanged:before.href===after.href,scrollYUnchanged:before.scrollY===after.scrollY};
    Object.assign(r, await settled(s)); await shot(s,name);
    assert(`${name} hrefUnchanged`, r.hrefUnchanged, `${before.href} → ${after.href}`);
    assert(`${name} scrollY／焦點不變`, r.scrollYUnchanged && before.active===after.active, `scrollY ${before.scrollY}→${after.scrollY}，active ${before.active}→${after.active}`);
    assert(`${name} labelClearOfNav（label／送出鈕／#f-note 同框）`, after.labelClearOfNav && after.labelInViewport && after.submitInViewport && after.noteInViewport, `label top ${after.labelTop} ≥ nav bottom ${after.navBottom}；note ${after.noteTop}–${after.noteBottom} / 視口高 ${after.innerH}；label／submit／note 在視口 ${after.labelInViewport}／${after.submitInViewport}／${after.noteInViewport}`);
    assert(`${name} 3 欄 aria-invalid=true`, r.invalid.length===3 && r.invalid.every(x=>x.endsWith(':true')), r.invalid.join(', '));
    assert(`${name} .is-error ×3`, r.isError===3, String(r.isError));
    assert(`${name} #f-note = formErr（aria-live=polite）`, r.note===r.formErr && r.noteLive==='polite', `「${r.note}」`);
    // C：負對照 —— 表單頂端捲到 y=0，固定 nav 必遮住 NAME 標籤
    await s.evaluate(()=>document.getElementById('join-form').scrollIntoView({block:'start'})); await sleep(2000);
    const c=await s.evaluate(measure); r.diagC={framing:'C 表單頂端捲到 y=0（舊取景，僅診斷／負對照）',...c}; await shot(s,name+'-diag-c-framing');
    assert(`${name} 負對照：C 取景必被遮`, c.labelClearOfNav===false, `label top ${c.labelTop} < nav bottom ${c.navBottom}`);
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  writeFileSync(OUT+'/probes.json', JSON.stringify(rep,null,1));
  console.log(JSON.stringify(rep,null,1));
  if(fails.length){ console.error(`\n✗ ${fails.length} 條斷言失敗：\n- `+fails.join('\n- ')); process.exitCode=1; } else console.log('\n✓ 斷言全部通過');
}finally{chrome.kill()}
