// ==UserScript==
// @name         Amadeus Mini
// @namespace    https://github.com/alvesamado92-dev/amadeus-mini
// @version      0.3.5
// @description  Lightweight cross-platform Amadeus avatar
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/alvesamado92-dev/amadeus-mini/main/amadeus-mini.user.js
// @downloadURL  https://raw.githubusercontent.com/alvesamado92-dev/amadeus-mini/main/amadeus-mini.user.js
// ==/UserScript==
(() => {
  'use strict';
  const old = document.getElementById('amadeus-mini');
  if (old) old.remove();
  const names = ['neutral','thinking','happy','annoyed','embarrassed','surprised'];
  const symbols = ['👩🏻‍🔬','🤔','😠','😳','😊','😮'];
  const panel = document.createElement('aside');
  panel.id = 'amadeus-mini';
  panel.setAttribute('aria-label','Amadeus avatar');
  Object.assign(panel.style, {position:'fixed',right:'12px',bottom:'100px',zIndex:'2147483647',width:'110px',padding:'8px',background:'#202332',color:'white',border:'1px solid #8b7184',borderRadius:'12px',textAlign:'center',font:'12px sans-serif',touchAction:'none',userSelect:'none',boxShadow:'0 3px 14px #0005'});
  const portrait = document.createElement('div');
  portrait.style.cssText='font-size:48px;line-height:1.5';
  const label = document.createElement('div'); label.textContent='AMADEUS';
  const btn = document.createElement('button'); btn.textContent='↻';
  btn.title='Cycle expressions';
  btn.style.cssText='border:0;border-radius:6px;background:#53647e;color:white;padding:5px 12px;margin-top:5px';
  const collapse = document.createElement('button'); collapse.textContent='−';
  collapse.title='Minimize';
  collapse.style.cssText=btn.style.cssText;
  const debug = document.createElement('button'); debug.textContent='?'; debug.title='Message detection diagnostics'; debug.style.cssText=btn.style.cssText;
  panel.append(portrait,label,btn,collapse,debug); document.body.append(panel);
  const diagnostic = document.createElement('div');
  diagnostic.style.cssText='display:none;font-size:10px;overflow-wrap:anywhere;text-align:left;margin-top:6px;max-height:100px;overflow:auto';
  panel.append(diagnostic);
  debug.addEventListener('click',()=>{
    const messages=readMessages();
    const users=messages.filter(m=>m.role==='user');
    const last=users.at(-1)?.content||'';
    const probes=['[data-message-author-role]','[data-testid^="conversation-turn-"]','[data-turn-id]','main','article','.whitespace-pre-wrap','[data-testid]'];
    const counts=probes.map(q=>q+':'+document.querySelectorAll(q).length).join(' | ');
    const main=document.querySelector('main');
    const samples=[...(main||document.body).querySelectorAll('*')].filter(el=>el.children.length===0 && /christina/i.test((el.textContent||'').trim())).slice(-3).map(el=>{
      const ancestors=[];let p=el;
      for(let i=0;p&&i<4;i++,p=p.parentElement)ancestors.push(p.tagName.toLowerCase()+(p.id?'#'+p.id:'')+(p.getAttribute('data-testid')?'[testid='+p.getAttribute('data-testid')+']':'')+(p.getAttribute('data-message-author-role')?'[role='+p.getAttribute('data-message-author-role')+']':'')+(typeof p.className==='string'&&p.className?' .'+p.className.split(/\\s+/).slice(0,2).join('.'):''));
      return ancestors.join(' > ');
    });
    diagnostic.textContent='User messages: '+users.length+' | Last: '+(last.slice(0,80)||'[none]')+' | Christina detected: '+(/christina/.test(last)?'YES':'NO')+' | '+counts+' | Matching elements: '+(samples.join(' || ')||'[none]');
    diagnostic.style.maxHeight='220px';
    diagnostic.style.display=diagnostic.style.display==='none'?'block':'none';
  });
  let mood=-1, minimized=false, active=true, drag=null;
  function setMood(i){ if(i===mood)return; mood=i; portrait.textContent=symbols[i]; panel.dataset.mood=names[i]; }
  btn.addEventListener('click',()=>setMood((mood+1)%names.length));
  collapse.addEventListener('click',()=>{minimized=!minimized;portrait.hidden=label.hidden=btn.hidden=debug.hidden=minimized;diagnostic.style.display='none';collapse.textContent=minimized?'+':'−';});
  panel.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=panel.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};panel.setPointerCapture(e.pointerId);});
  panel.addEventListener('pointermove',e=>{if(!drag)return;panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,drag.left+e.clientX-drag.x))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,drag.top+e.clientY-drag.y))+'px';panel.style.right='auto';panel.style.bottom='auto';});
  panel.addEventListener('pointerup',()=>drag=null);
  panel.addEventListener('pointercancel',()=>drag=null);
  // Read rendered messages, not the floating widget itself.
  // ChatGPT's DOM can vary across desktop and mobile releases.
  function readMessages() {
    // Current ChatGPT uses different turn containers on different clients.
    const selectors = [
      '[data-message-author-role]',
      '[data-testid^="conversation-turn-"]',
      'article[data-turn-id]',
      '[data-turn-id]',
      'main article',
      'main [data-testid*="turn"]'
    ];
    const nodes = [...new Set(selectors.flatMap(q=>[...document.querySelectorAll(q)]))];
    const out = [];
    for (const el of nodes) {
      if (nodes.some(other=>other!==el && other.contains(el) &&
          (other.hasAttribute('data-message-author-role') ||
           other.hasAttribute('data-turn-id')))) continue;
      const roleAttr = el.getAttribute('data-message-author-role') ||
        el.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role');
      const testId = el.getAttribute('data-testid') || '';
      const cls = String(el.className || '');
      const role = roleAttr ||
        (/user/i.test(testId+' '+cls) ? 'user' :
         /assistant/i.test(testId+' '+cls) ? 'assistant' : '');
      if (role !== 'user' && role !== 'assistant') continue;
      const content = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (content) out.push({role, content});
    }
    // Fallback: ChatGPT renders user text in a .whitespace-pre-wrap block
    // inside the user turn, even when author-role attributes are absent.
    if (!out.some(m=>m.role==='user')) {
      const blocks=[...document.querySelectorAll('main .whitespace-pre-wrap, main [class*="whitespace-pre-wrap"]')];
      for (const el of blocks) {
        if (el.closest('#amadeus-mini')) continue;
        const content=(el.innerText||el.textContent||'').trim().toLowerCase();
        if (content) out.push({role:'user',content});
      }
    }
    return out;
  }
  let lastSignature = '';
  function detect() {
    const messages = readMessages();
    const users = messages.filter(m => m.role === 'user');
    const last = users.at(-1)?.content || '';
    const latestCommand = [...users].reverse()
      .map(m => m.content)
      .find(t => /\bamadeus\s+(on|off)\b/.test(t));
    if (latestCommand) active = !/\bamadeus\s+off\b/.test(latestCommand);
    panel.style.display = active ? '' : 'none';
    if (!active) return;
    const assistant = messages.filter(m => m.role === 'assistant').at(-1)?.content || '';
    const signature = last + '|' + assistant.slice(-500);
    if (signature === lastSignature) return;
    lastSignature = signature;
    if (/christina|idiot|pervert/.test(last)) setMood(3);
    else if (/embarrass|blush|w-what/.test(assistant)) setMood(4);
    else if (/success|excellent|great news|worked/.test(assistant)) setMood(2);
    else if (/surpris|unexpected/.test(assistant)) setMood(5);
    else if (/analy|research|calculat|hypothes|investigat/.test(assistant)) setMood(1);
    else setMood(0);
  }
  // Low-frequency polling avoids missed updates on ChatGPT's dynamic mobile UI.
  // It also avoids the MutationObserver reacting to its own avatar updates.
  setMood(0);
  detect();
  setInterval(detect, 1500);
})();