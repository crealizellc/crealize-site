// 現行部署（https://crealize.llc）的互動狀態證據：選單 / 語系選單 / modal / 表單驗證。沿用 scripts/lib/cdp.mjs。
// 表單只走「空欄位送出」路徑（site.js 驗證失敗即 return，不會走到 mailto），不送真表單。
import { spawn } from 'node:child_process'; import { writeFileSync } from 'node:fs';
import { attach, listPages } from '/Users/crealize-00/Projects/crealize-site/scripts/lib/cdp.mjs';
const OUT=process.env.SP+'/states', PORT=9341, BASE='https://crealize.llc', sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[`--remote-debugging-port=${PORT}`,'--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--window-size=1280,800','--user-data-dir='+OUT+'/profile','about:blank'],{stdio:'ignore'});
const rep={};
const shot=async(s,name)=>{const r=await s.send('Page.captureScreenshot',{format:'png'});writeFileSync(`${OUT}/${name}.png`,Buffer.from(r.data,'base64'));};
const settled=(s)=>s.evaluate(()=>({vis:document.visibilityState,anim:document.getAnimations().filter(a=>a.playState==='running'&&!(a.effect?.target?.closest?.('.stage'))&&!(a.effect?.target?.id==='atmosphere')).length}));
try{ let ok=false; for(let i=0;i<60;i++){try{await listPages(PORT);ok=true;break}catch{await sleep(250)}} if(!ok)throw new Error('no cdp');
  const open=async(loc,w,h,dpr,mobile)=>{const t=(await listPages(PORT)).find(x=>x.type==='page');const s=await attach(t);await s.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:dpr,mobile});await s.navigate(`${BASE}/${loc}`);await sleep(2000);return s;};
  // 1) ja 390：行動選單開啟
  { const s=await open('ja/',390,844,2,true);
    await s.evaluate(()=>document.querySelector('.nav__menu').click()); await sleep(700);
    rep.menu_ja_390=await s.evaluate(()=>{const b=document.querySelector('.nav__menu'),p=document.querySelector('.nav__panel');return {ariaExpanded:b.getAttribute('aria-expanded'),ariaLabel:b.getAttribute('aria-label'),panelHidden:p.hidden,panelDisplay:getComputedStyle(p).display,links:[...p.querySelectorAll('a')].map(a=>a.textContent.trim().replace(/\s+/g,' '))};});
    Object.assign(rep.menu_ja_390, await settled(s)); await shot(s,'ja-390-menu-open');
    await s.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))); await sleep(400);
    rep.menu_ja_390.afterEscape=await s.evaluate(()=>({ariaExpanded:document.querySelector('.nav__menu').getAttribute('aria-expanded'),panelHidden:document.querySelector('.nav__panel').hidden,focusOnButton:document.activeElement===document.querySelector('.nav__menu')}));
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  // 2) en 1280：語系選單開啟（不點語言連結）
  { const s=await open('',1280,800,1,false);
    await s.evaluate(()=>document.querySelector('.nav__globe').click()); await sleep(600);
    rep.lang_en_1280=await s.evaluate(()=>{const w=document.getElementById('lang-switch'),m=w.querySelector('.nav__langmenu'),ja=m.querySelector('a[hreflang="ja"]');ja.focus();const f=document.activeElement===ja;document.activeElement.blur();return {ariaExpanded:w.querySelector('.nav__globe').getAttribute('aria-expanded'),menuVisibility:getComputedStyle(m).visibility,menuOpacity:getComputedStyle(m).opacity,items:[...m.querySelectorAll('a')].map(a=>a.textContent+'('+a.getAttribute('hreflang')+(a.getAttribute('aria-current')?',current':'')+')'),jaFocusableWhileOpen:f};});
    Object.assign(rep.lang_en_1280, await settled(s)); await shot(s,'en-1280-lang-open');
    await s.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))); await sleep(500);
    rep.lang_en_1280.afterEscape=await s.evaluate(()=>{const w=document.getElementById('lang-switch'),m=w.querySelector('.nav__langmenu'),ja=m.querySelector('a[hreflang="ja"]');ja.focus();const f=document.activeElement===ja;document.activeElement.blur();return {ariaExpanded:w.querySelector('.nav__globe').getAttribute('aria-expanded'),menuVisibility:getComputedStyle(m).visibility,jaFocusableWhileClosed:f};});
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  // 3) zh 1280：modal 開啟（現行文案）
  { const s=await open('zh/',1280,800,1,false);
    await s.evaluate(()=>document.querySelector('.work-card[data-work-index="0"]').scrollIntoView({block:'center'})); await sleep(1200);
    await s.evaluate(()=>document.querySelector('.work-card[data-work-index="0"]').click()); await sleep(2300);
    rep.modal_zh_1280=await s.evaluate(()=>{const m=document.querySelector('.work-modal'),c=m.querySelector('.work-modal__cta');return {modalHidden:m.hidden,name:m.querySelector('.work-modal__name').textContent,jp:m.querySelector('.work-modal__jp').textContent,cta:c.textContent,href:c.getAttribute('href'),target:c.target,rel:c.rel,bodyStart:m.querySelector('.work-modal__body')?.textContent.trim().slice(0,40)};});
    Object.assign(rep.modal_zh_1280, await settled(s)); await shot(s,'zh-1280-modal-open');
    await s.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))); await sleep(500);
    rep.modal_zh_1280.afterEscape=await s.evaluate(()=>({modalHidden:document.querySelector('.work-modal').hidden}));
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  // 4) en 1280 + ja 390：表單空欄位送出 → 驗證錯誤狀態（不會走到 mailto）
  for(const [loc,w,h,dpr,mobile,name] of [['',1280,800,1,false,'en-1280-form-invalid'],['ja/',390,844,2,true,'ja-390-form-invalid']]){
    const s=await open(loc,w,h,dpr,mobile);
    await s.evaluate(()=>document.querySelector('#join-form').scrollIntoView({block:'start'})); await sleep(1500);
    const before=await s.evaluate(()=>location.href);
    await s.evaluate(()=>document.getElementById('join-form').requestSubmit()); await sleep(500);
    rep[name]=await s.evaluate(()=>{const f=document.getElementById('join-form');return {hrefUnchanged:true,invalid:[...f.querySelectorAll('[required]')].map(i=>i.id+':'+i.getAttribute('aria-invalid')),isError:f.querySelectorAll('.field.is-error').length,note:document.getElementById('f-note').textContent.trim(),noteLive:document.getElementById('f-note').getAttribute('aria-live')};});
    rep[name].hrefUnchanged=(await s.evaluate(()=>location.href))===before;
    Object.assign(rep[name], await settled(s)); await shot(s,name);
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close(); }
  console.log(JSON.stringify(rep,null,1));
}finally{chrome.kill()}
