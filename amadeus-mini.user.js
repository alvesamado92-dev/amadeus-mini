// ==UserScript==
// @name         Amadeus Mini
// @namespace    https://github.com/alvesamado92-dev/amadeus-mini
// @version      0.3.1
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
  panel.append(portrait,label,btn,collapse); document.body.append(panel);
  let mood=-1, minimized=false, active=true, drag=null;
  function setMood(i){ if(i===mood)return; mood=i; portrait.textContent=symbols[i]; panel.dataset.mood=names[i]; }
  btn.addEventListener('click',()=>setMood((mood+1)%names.length));
  collapse.addEventListener('click',()=>{minimized=!minimized;portrait.hidden=label.hidden=btn.hidden=minimized;collapse.textContent=minimized?'+':'−';});
  panel.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=panel.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};panel.setPointerCapture(e.pointerId);});
  panel.addEventListener('pointermove',e=>{if(!drag)return;panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,drag.left+e.clientX-drag.x))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,drag.top+e.clientY-drag.y))+'px';panel.style.right='auto';panel.style.bottom='auto';});
  panel.addEventListener('pointerup',()=>drag=null);
  panel.addEventListener('pointercancel',()=>drag=null);
  let lastSignature='', timer;
  function detect(){
    const messages=[...document.querySelectorAll('[data-message-author-role]')];
    const user=messages.filter(x=>x.getAttribute('data-message-author-role')==='user');
    const last=user.at(-1)?.textContent?.toLowerCase()||'';
    const modeCommand=[...user].reverse().map(x=>x.textContent?.toLowerCase()||'').find(x=>/\bamadeus\s+(on|off)\b/.test(x));
    if(modeCommand)active=!/\bamadeus\s+off\b/.test(modeCommand);
    panel.style.display=active?'':'none'; if(!active)return;
    const assistant=messages.filter(x=>x.getAttribute('data-message-author-role')==='assistant').at(-1)?.textContent?.toLowerCase()||'';
    const signature=last+'|'+assistant.slice(-400);
    if(signature===lastSignature)return;lastSignature=signature;
    if(/christina|idiot|pervert/.test(last))setMood(2);
    else if(/embarrass|blush|w-what/.test(assistant))setMood(3);
    else if(/success|excellent|great news|worked/.test(assistant))setMood(4);
    else if(/surpris|unexpected/.test(assistant))setMood(5);
    else if(/analy|research|calculat|hypothes|investigat/.test(assistant))setMood(1);
    else setMood(0);
  }
  setMood(0);
  new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(detect,650);}).observe(document.body,{childList:true,subtree:true,characterData:true});
  detect();
})();