"use strict";
/* touch.js - on-screen controls for touch screens (phones, tablets). Pointer Events with pointer capture, so a finger that slides off a circle keeps working.
   Left circle: move.  Right circle (crosshair icon): FIRE - hold to shoot, drag inside it to aim; when you are not dragging, it aims at the nearest enemy.
   Small circles: R reload, BOMB, Q strike, SW switch weapon, GUN market, PY Python challenge.
   Desktop is untouched: keyboard (WASD / arrows) and mouse keep working, and nothing here is built on devices without a coarse pointer. */
const TouchUI={fire:false,aim:false,last:-1.57,
 reset(){K.a=K.d=K.w=K.s=false;this.fire=this.aim=false;M.down=false;document.querySelectorAll('#touch .js').forEach(e=>{e.classList.remove('on');const k=e.querySelector('i');if(k)k.style.transform=''})},
 /* while FIRE is held without dragging: aim at the nearest living enemy, otherwise keep the last aim direction */
 tick(){if(!this.fire||this.aim||typeof G==='undefined'||!G||!G.p)return;let best=null,bd=1e12;
  for(const e of G.enemies){if(e.dead)continue;const d=(e.x-G.p.x)*(e.x-G.p.x)+(e.y-G.p.y)*(e.y-G.p.y);if(d<bd){bd=d;best=e}}
  if(best){M.x=best.x;M.y=best.y}else{M.x=G.p.x+Math.cos(this.last)*150;M.y=G.p.y+Math.sin(this.last)*150}}};
(function(){
 if(!(window.matchMedia&&matchMedia('(pointer:coarse)').matches))return;
 const box=document.createElement('div');box.id='touch';
 box.innerHTML='<div class="js" id="jl" role="button" aria-label="Move"><i></i></div>'+
  '<div class="js" id="jr" role="button" aria-label="Fire: hold to shoot, drag to aim"><svg class="ficon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 3v12M24 33v12M3 24h12M33 24h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="24" r="3.2" fill="currentColor"/></svg><i></i></div>'+
  '<button id="tr" aria-label="Reload">R</button><button id="tb" aria-label="Bomb">BOMB</button><button id="tq" aria-label="Phantom strike">Q</button><button id="tc" aria-label="Python challenge">PY</button><button id="tw" aria-label="Switch weapon">SW</button><button id="tg" aria-label="Gun market">GUN</button>';
 $('wrap').appendChild(box);
 function bind(el,onMove,onEnd){let pid=null;const knob=el.querySelector('i');
  const vec=e=>{const r=el.getBoundingClientRect(),R=r.width/2,dx=e.clientX-(r.left+R),dy=e.clientY-(r.top+R),m=Math.hypot(dx,dy)||1,k=Math.min(1,m/R);return{x:dx/m*k,y:dy/m*k,k,R}};
  const move=e=>{const v=vec(e);knob.style.transform='translate('+v.x*v.R*.4+'px,'+v.y*v.R*.4+'px)';onMove(v)};
  el.addEventListener('pointerdown',e=>{if(pid!==null)return;pid=e.pointerId;try{el.setPointerCapture(pid)}catch(x){}el.classList.add('on');e.preventDefault();move(e)});
  el.addEventListener('pointermove',e=>{if(e.pointerId===pid){e.preventDefault();move(e)}});
  const end=e=>{if(e.pointerId!==pid)return;pid=null;knob.style.transform='';el.classList.remove('on');onEnd()};
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>el.addEventListener(n,end));
  el.addEventListener('contextmenu',e=>e.preventDefault())}
 bind($('jl'),v=>{K.a=v.x<-.3;K.d=v.x>.3;K.w=v.y<-.3;K.s=v.y>.3},()=>{K.a=K.d=K.w=K.s=false});
 bind($('jr'),v=>{if(typeof G==='undefined'||!G)return;TouchUI.fire=true;M.down=true;
   if(v.k>.28){TouchUI.aim=true;TouchUI.last=Math.atan2(v.y,v.x);M.x=G.p.x+v.x*150;M.y=G.p.y+v.y*150}else TouchUI.aim=false},()=>{TouchUI.fire=TouchUI.aim=false;M.down=false});
 const tap=(id,fn)=>$(id).addEventListener('pointerdown',e=>{e.preventDefault();if(state==='play')fn()});
 tap('tr',reload);tap('tb',throwBomb);tap('tq',phantomStrike);tap('tc',nextChallenge);tap('tw',cycleGun);tap('tg',()=>GM.open());
 box.addEventListener('selectstart',e=>e.preventDefault());
})();
