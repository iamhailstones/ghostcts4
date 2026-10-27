"use strict";
/* main.js - input handling, game loop, start-up */
/* ---------- INPUT & LOOP (listeners registered once, one rAF loop) ---------- */
addEventListener('keydown',e=>{const k=e.key.toLowerCase();
 if(Boot.active){Boot.onKey(e);return}
 if(state==='chat'){if(k==='escape')Assistant.close();return}
 if(state==='aiq'){if(k==='escape')AIQ.close();return}
 if(state==='tut'){if(k==='escape')Tut.close();return}
 if(state==='cfm'){if(k==='escape')Confirm.no();return}
 if(state==='pyr')return;   // the Python rule console cannot be dismissed with keys
 if(state==='market'){if(k==='escape'||k==='g')GM.close();return}
 if(k==='escape'){pause();return}
 if(e.target.id==='cin'||e.target.id==='pname')return;
 if(('wasd'.includes(k)&&k.length===1)||k.startsWith('arrow')){K[k]=true;if(k.startsWith('arrow')&&state==='play')e.preventDefault()}   // arrow keys move like WASD (and must not scroll the page)
 if(state!=='play'||e.repeat)return;
 if(k==='r')reload();else if(k==='b')throwBomb();
 else if(k==='c')nextChallenge();
 else if(k==='m')toggleMute();
 else if(k==='n')toggleMusic();
 else if(/^[1-5]$/.test(k))equipSlot(+k-1);
 else if(k==='e')cycleGun();
 else if(k==='g')GM.open();
 else if(k==='p')PR.open('manual');
 else if(k==='q')phantomStrike();
 else if(k==='t')toggleAuto()});
addEventListener('keyup',e=>{K[e.key.toLowerCase()]=false});
addEventListener('blur',()=>{K={};M.down=false;mouseHeld=false;TouchUI.reset();if(state==='play')pause()});
function mpos(e){const r=cv.getBoundingClientRect();M.x=(e.clientX-r.left)*W/r.width;M.y=(e.clientY-r.top)*H/r.height}
/* mouse and pen aim/shoot with Pointer Events; touches never reach the canvas handlers (touch uses the on-screen circles), so one tap can never count twice */
let mouseHeld=false;   // true while a mouse/pen button is down: manual shooting always overrides AUTO
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')mpos(e)});cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;mpos(e);M.down=true;mouseHeld=true});
['pointerup','pointercancel'].forEach(n=>addEventListener(n,e=>{if(e.pointerType!=='touch'){M.down=false;mouseHeld=false}}));
cv.addEventListener('contextmenu',e=>e.preventDefault());
/* ---------- AUTO SHOOT (laptop: press T; phone: the AUTO button in touch.js) ----------
   The aiming and lead maths live in touch.js (TouchUI / AUTO). Holding the mouse button always overrides AUTO. */
function toggleAuto(){TouchUI.setAuto(!TouchUI.auto);msg(TouchUI.auto?'AUTO ON':'AUTO OFF')}
const autoTag=(()=>{if(matchMedia('(pointer:coarse)').matches)return null;   // phones already show the glowing AUTO button
 const d=document.createElement('div');d.textContent='AUTO ON  (T to stop)';
 d.style.cssText='position:fixed;top:8px;right:10px;z-index:5;display:none;padding:4px 10px;border-radius:12px;font:700 12px/1.3 monospace;letter-spacing:1px;color:#041;background:rgba(40,200,120,.85);border:1px solid #8fffc0;pointer-events:none';
 document.body.appendChild(d);return d})();
/* each frame: show/hide the label, and while AUTO is on reload by itself when the magazine runs empty */
function autoSync(){if(autoTag)autoTag.style.display=TouchUI.auto?'block':'none';
 if(TouchUI.auto&&state==='play'&&G&&G.p&&G.p.mag<=0&&!(G.p.rel>0)&&G.p.reserve>0)reload()}
let looping=true;
function startLoop(){if(looping)return;looping=true;last=performance.now();requestAnimationFrame(loop)}   // used when coming back from the exit screen
function loop(t){if(state==='exited'){looping=false;return}requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||0);last=t;T+=dt;Music.sync();rlSync();{const pl=state==='play';if(document.body.classList.contains('playing')!==pl){document.body.classList.toggle('playing',pl);if(!pl)TouchUI.reset()}}autoSync();if(!(TouchUI.auto&&mouseHeld))TouchUI.tick();if(state==='play')update(dt);draw();hud()}
toMenu();Boot.start();Orient.start();requestAnimationFrame(loop);

if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
