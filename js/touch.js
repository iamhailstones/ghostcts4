"use strict";
/* touch.js - on-screen controls for touch screens (phones, tablets). Pointer Events with pointer capture, so a finger that slides off a circle keeps working.
   Left circle: move.  Right circle (crosshair icon): FIRE - hold to shoot, drag inside it to aim; when you are not dragging, it aims at the nearest enemy.
   Small circles: R reload, BOMB, Q strike, SW switch weapon, GUN market, PY Python challenge.
   AUTO button (centre bottom): toggle. While ON it locks the nearest enemy, aims with lead and shoots by itself. Holding the FIRE circle always overrides it.
   Desktop is untouched: keyboard (WASD / arrows) and mouse keep working, and nothing here is built on devices without a coarse pointer. */

/* ---- AIM TUNING (edit these numbers to change how the right circle feels) ----
   sensitivity     1.0   multiplies how far your finger counts as moved (higher = reacts faster)
   maxAimLength    0.30  fraction of the circle's radius at which aim/power is "full"
   minDragPixels   10    drag shorter than this is ignored and auto-aim takes over (prevents jitter)
   minShotPower    5     shot power at the smallest aimed drag
   maxShotPower    25    shot power at a full drag (read it from TouchUI.power) */
const AIM={sensitivity:1.0,maxAimLength:0.30,minDragPixels:10,minShotPower:5,maxShotPower:25};

/* ---- AUTO SHOOT TUNING ----
   range         750   only shoot enemies closer than this (world pixels) so ammo is not wasted on far targets
   lead          true  aim where a moving enemy WILL be, not where it is now
   bulletSpeed   800   bullet speed in pixels/second used for the lead maths - set it to your real bullet speed for best accuracy
   maxLead       0.4   never lead further ahead than this many seconds (keeps misses small if the guess is off)
   stickiness    1.35  keep the current target until another is this much closer (stops the aim flicking between enemies) */
const AUTO={range:750,lead:true,bulletSpeed:800,maxLead:0.4,stickiness:1.35};

const TouchUI={fire:false,aim:false,last:-1.57,power:AIM.minShotPower,auto:false,target:null,
 reset(){K.a=K.d=K.w=K.s=false;this.fire=this.aim=false;this.power=AIM.minShotPower;this.auto=false;this.target=null;M.down=false;
  document.querySelectorAll('#touch .js').forEach(e=>{e.classList.remove('on');const k=e.querySelector('i');if(k)k.style.transform=''});
  const ta=document.getElementById('ta');if(ta)ta.classList.remove('on')},
 setAuto(on){this.auto=on;this.target=null;const ta=document.getElementById('ta');if(ta)ta.classList.toggle('on',on);if(!on&&!this.fire)M.down=false},
 /* each frame: FIRE circle held = manual (original behaviour), otherwise AUTO if switched on */
 tick(){if(typeof G==='undefined'||!G||!G.p)return;
  if(this.fire){ /* while FIRE is held without dragging: aim at the nearest living enemy, otherwise keep the last aim direction */
   if(this.aim)return;let best=null,bd=1e12;
   for(const e of G.enemies){if(e.dead)continue;const d=(e.x-G.p.x)*(e.x-G.p.x)+(e.y-G.p.y)*(e.y-G.p.y);if(d<bd){bd=d;best=e}}
   if(best){M.x=best.x;M.y=best.y}else{M.x=G.p.x+Math.cos(this.last)*150;M.y=G.p.y+Math.sin(this.last)*150}
   return}
  if(this.auto)this.autoTick()},
 autoTick(){const p=G.p,R2=AUTO.range*AUTO.range;let best=null,bd=1e12,cur=null,cd=1e12;
  for(const e of G.enemies){if(e.dead)continue;const d=(e.x-p.x)*(e.x-p.x)+(e.y-p.y)*(e.y-p.y);
   if(d<bd){bd=d;best=e}if(e===this.target){cur=e;cd=d}}
  /* keep the locked target unless a clearly closer one appears */
  let t=(cur&&cd<=bd*AUTO.stickiness*AUTO.stickiness)?cur:best;
  if(!t||(t===best?bd:cd)>R2){this.target=null;M.down=false;return}
  this.target=t;
  let ax=t.x,ay=t.y;
  if(AUTO.lead){
   /* measure the enemy's velocity from its movement between frames (works with any enemy object that has x and y) */
   const now=performance.now();
   if(t._at!==undefined){const dt=(now-t._at)/1000;
    if(dt>0.001&&dt<0.25){t._vx=(t._vx||0)*.6+((t.x-t._ax)/dt)*.4;t._vy=(t._vy||0)*.6+((t.y-t._ay)/dt)*.4}
    else if(dt>=0.25){t._vx=t._vy=0}}
   t._ax=t.x;t._ay=t.y;t._at=now;
   const vx=t._vx||0,vy=t._vy||0,dx=t.x-p.x,dy=t.y-p.y,s=AUTO.bulletSpeed;
   const a=vx*vx+vy*vy-s*s,b=2*(dx*vx+dy*vy),c=dx*dx+dy*dy;let tt=0;
   if(Math.abs(a)<1e-6){if(Math.abs(b)>1e-6)tt=-c/b}
   else{const disc=b*b-4*a*c;if(disc>=0){const r=Math.sqrt(disc),t1=(-b-r)/(2*a),t2=(-b+r)/(2*a);
     tt=Math.min(t1>0?t1:1e9,t2>0?t2:1e9);if(tt>=1e9)tt=0}}
   tt=Math.max(0,Math.min(AUTO.maxLead,tt));
   ax=t.x+vx*tt;ay=t.y+vy*tt}
  M.x=ax;M.y=ay;M.down=true;
  this.last=Math.atan2(ay-p.y,ax-p.x)}};
(function(){
 if(!(window.matchMedia&&matchMedia('(pointer:coarse)').matches))return;
 /* position and look of the AUTO button (centre bottom, between the two joysticks); change here if it overlaps anything */
 const st=document.createElement('style');
 st.textContent='#ta{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);min-width:60px;height:60px;padding:0 10px;border-radius:30px;pointer-events:auto;touch-action:none;font-weight:700;letter-spacing:1px;background:rgba(10,20,30,.55);color:#cfe;border:2px solid rgba(160,255,200,.5);-webkit-tap-highlight-color:transparent}'+
  '#ta.on{background:rgba(40,200,120,.75);color:#041;border-color:#8fffc0;box-shadow:0 0 14px rgba(120,255,180,.7)}';
 document.head.appendChild(st);
 const box=document.createElement('div');box.id='touch';
 box.innerHTML='<div class="js" id="jl" role="button" aria-label="Move"><i></i></div>'+
  '<div class="js" id="jr" role="button" aria-label="Fire: hold to shoot, drag to aim"><svg class="ficon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 3v12M24 33v12M3 24h12M33 24h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="24" r="3.2" fill="currentColor"/></svg><i></i></div>'+
  '<button id="tr" aria-label="Reload">R</button><button id="tb" aria-label="Bomb">BOMB</button><button id="tq" aria-label="Phantom strike">Q</button><button id="tc" aria-label="Python challenge">PY</button><button id="tw" aria-label="Switch weapon">SW</button><button id="tg" aria-label="Gun market">GUN</button>'+
  '<button id="ta" aria-label="Auto shoot: toggle">AUTO</button>';
 $('wrap').appendChild(box);
 function bind(el,onMove,onEnd){let pid=null;const knob=el.querySelector('i');
  /* m = finger distance from the circle centre in pixels; ux/uy = unit direction of the drag */
  const vec=e=>{const r=el.getBoundingClientRect(),R=r.width/2,dx=e.clientX-(r.left+R),dy=e.clientY-(r.top+R),m=Math.hypot(dx,dy)||1,k=Math.min(1,m/R);return{x:dx/m*k,y:dy/m*k,k,R,m,ux:dx/m,uy:dy/m}};
  const move=e=>{const v=vec(e);knob.style.transform='translate('+v.x*v.R*.4+'px,'+v.y*v.R*.4+'px)';onMove(v)};
  el.addEventListener('pointerdown',e=>{if(pid!==null)return;pid=e.pointerId;try{el.setPointerCapture(pid)}catch(x){}el.classList.add('on');e.preventDefault();move(e)});
  el.addEventListener('pointermove',e=>{if(e.pointerId===pid){e.preventDefault();move(e)}});
  const end=e=>{if(e.pointerId!==pid)return;pid=null;knob.style.transform='';el.classList.remove('on');onEnd()};
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>el.addEventListener(n,end));
  el.addEventListener('contextmenu',e=>e.preventDefault())}
 bind($('jl'),v=>{K.a=v.x<-.3;K.d=v.x>.3;K.w=v.y<-.3;K.s=v.y>.3},()=>{K.a=K.d=K.w=K.s=false});
 bind($('jr'),v=>{if(typeof G==='undefined'||!G)return;TouchUI.fire=true;M.down=true;
   const px=v.m*AIM.sensitivity;
   if(px>=AIM.minDragPixels){
    /* full aim/power is reached at maxAimLength of the radius (never closer than minDragPixels+1, so the maths stays safe on small circles) */
    const full=Math.max(AIM.minDragPixels+1,AIM.maxAimLength*v.R),t=Math.min(1,(px-AIM.minDragPixels)/(full-AIM.minDragPixels));
    TouchUI.aim=true;TouchUI.last=Math.atan2(v.uy,v.ux);
    TouchUI.power=AIM.minShotPower+t*(AIM.maxShotPower-AIM.minShotPower);
    M.x=G.p.x+v.ux*150;M.y=G.p.y+v.uy*150}
   else{TouchUI.aim=false;TouchUI.power=AIM.minShotPower}},
  ()=>{TouchUI.fire=TouchUI.aim=false;TouchUI.power=AIM.minShotPower;M.down=false});
 const tap=(id,fn)=>$(id).addEventListener('pointerdown',e=>{e.preventDefault();if(state==='play')fn()});
 tap('tr',reload);tap('tb',throwBomb);tap('tq',phantomStrike);tap('tc',nextChallenge);tap('tw',cycleGun);tap('tg',()=>GM.open());
 tap('ta',()=>TouchUI.setAuto(!TouchUI.auto));
 box.addEventListener('selectstart',e=>e.preventDefault());
})();
