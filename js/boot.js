"use strict";
/* boot.js - cinematic loading screen: embers (no smoke: the background stays pure black), timed title reveal, blinking eyes,
   real initialization progress, error + retry, and the shared GHOST / CODE TO SURVIVE / CTS4 title lockup. */
const TITLE_HTML='<div class="logo" role="heading" aria-level="1" aria-label="GHOST: Code to Survive, CTS4"><span>GH</span>'+
 '<svg class="gmask" viewBox="0 0 60 80" aria-hidden="true"><ellipse class="oring" cx="30" cy="40" rx="22" ry="33"/>'+
 '<path class="eye" d="M16 37l11 4-4 5z"/><path class="eye" d="M44 37l-11 4 4 5z"/></svg><span>ST</span></div>'+
 '<div class="sub"><span>CODE TO SURVIVE</span><b class="cts">CTS4</b></div><div class="tag">PYTHON · COMBAT · PROGRESS</div>';

const Boot={
 active:false,ready:false,cinema:false,shown:0,target:0,tries:0,raf:0,t0:0,d:1,cx:null,smoke:[],
 RM:typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches,
 start(){
  $('menuTitle').innerHTML=TITLE_HTML;                       // the menu shares the same title lockup
  if(typeof Image==='undefined')return;                      // not a browser (tests)
  this.active=true;this.t0=performance.now();$('bootTitle').innerHTML=TITLE_HTML;
  $('bootGo').onclick=()=>this.deploy();$('bootRetry').onclick=()=>this.init();
  this.applyRot();this.layoutArt();['resize','orientationchange'].forEach(ev=>addEventListener(ev,()=>{this.applyRot();this.layoutArt()}));this.fxInit();this.timeline();this.init();this.loop()},
 /* LANDSCAPE ON EVERY DEVICE: a touch device held upright shows the loading screen turned 90 degrees (turn the phone sideways and it fits; with rotation locked it simply works). */
 rot:false,
 rotOn(){return typeof matchMedia!=='undefined'&&matchMedia('(pointer:coarse)').matches&&innerHeight>innerWidth},
 EW(){return this.rot?innerHeight:innerWidth},EH(){return this.rot?innerWidth:innerHeight},
 applyRot(){const b=$('boot');if(!b)return;this.rot=this.rotOn();b.classList.toggle('rot',this.rot);b.style.setProperty('--bw',innerHeight+'px');b.style.setProperty('--bh',innerWidth+'px')},
 /* the soldier is sized in pixels from the screen size (full height on wide screens, full width on phones) */
 layoutArt(){const a=document.querySelector('#boot .artbox');if(!a)return;const w=this.EW(),h=this.EH(),port=w<h*.9,r=800/1254,H=port?Math.min(h*.78,w/r):h,Wd=H*r;
  Object.assign(a.style,{left:(port?(w-Wd)/2:0)+'px',top:'0px',width:Wd+'px',height:H+'px'})},
 /* ----- cinematic timeline (CSS classes drive the animations) ----- */
 timeline(){const b=$('boot'),T=this.RM?[0,50,100,150,200]:[300,2200,5200,6400,7400];
  ['s-art','s-eyes','s-ghost','s-cts'].forEach((c,i)=>setTimeout(()=>b.classList.add(c),T[i]));
  setTimeout(()=>{this.cinema=true;this.maybeReady()},T[4])},
 /* ----- real initialization steps; progress follows what has actually finished ----- */
 async init(){
  $('bootErr').classList.remove('on');this.ready=false;this.target=0;const retry=this.tries++>0,sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const artErr=()=>new Error('Mission art failed to load (assets/ghost-key-art.jpg).');
  const steps=[
   ['LOADING MISSION ART',()=>new Promise((ok,no)=>{const im=$('bootArt');im.onload=()=>ok();im.onerror=()=>no(artErr());
     if(retry)im.src='assets/ghost-key-art.jpg?r='+Date.now();else if(im.complete)im.naturalWidth?ok():no(artErr())})],
   ['LOADING TACTICAL FONTS',()=>document.fonts?document.fonts.ready:0],
   ['CHECKING GAME MODULES',()=>{const have={CFG:typeof CFG,TYPES:typeof TYPES,CH:typeof CH,SAVE:typeof SAVE,newLevel:typeof newLevel,update:typeof update,draw:typeof draw,sfx:typeof sfx,toMenu:typeof toMenu};
     const miss=Object.keys(have).filter(k=>have[k]==='undefined');if(miss.length)throw new Error('Missing game modules: '+miss.join(', ')+'. Check the js/ folder.')}],
   ['READING SAVE DATA',()=>{try{localStorage.getItem('ghost')}catch(e){}}],
   ['PREPARING ARENA',()=>{if(!cv.getContext('2d'))throw new Error('This browser cannot draw the game canvas.')}]];
  for(let i=0;i<steps.length;i++){$('bootStep').textContent=steps[i][0];
   try{await steps[i][1]()}catch(e){this.fail(e.message);return}
   this.target=(i+1)/steps.length;await sleep(this.RM?0:260)}      // yields to the browser so the screen never freezes
  this.ready=true;$('bootStep').textContent='READY';this.maybeReady()},
 fail(msg){$('bootErrMsg').textContent=msg+' Press RETRY.';$('bootErr').classList.add('on')},
 maybeReady(){if(!this.ready||!this.cinema)return;$('bootLoad').style.display='none';const g=$('bootGo');g.classList.add('on');g.focus({preventScroll:true})},
 deploy(){if(!this.ready||!this.cinema||!this.active)return;this.active=false;Music.start();Voice.event('welcome');setTimeout(()=>{if(!SAVE.tutDone&&state==='menu')Tut.open()},1100);if(Orient.mobile)Orient.request();$('boot').classList.add('out');
  setTimeout(()=>{$('boot').style.display='none';cancelAnimationFrame(this.raf)},950)},
 onKey(e){if((e.key==='Enter'||e.key===' ')&&$('bootGo').classList.contains('on')){e.preventDefault();this.deploy()}},
 /* ----- smoke and embers (capped counts, lower on phones) ----- */
 fxInit(){const c=$('bootFx');this.cx=c.getContext('2d');
  const rs=()=>{this.d=Math.min(devicePixelRatio||1,1.5)*(this.EW()<700?.75:1);c.width=this.EW()*this.d;c.height=this.EH()*this.d};rs();addEventListener('resize',rs);
  this.smoke=[]},
 mkSmoke(){return{x:Math.random()*this.EW(),y:this.EH()*(.3+Math.random()*.8),r:150+Math.random()*200,vx:(Math.random()-.3)*14,vy:-(4+Math.random()*10),a:.03+Math.random()*.05}},
 loop(){this.raf=requestAnimationFrame(()=>this.loop());
  this.shown+=(this.target-this.shown)*.08;const pct=Math.min(100,Math.round(this.shown*100+.4));
  $('bootBar').style.width=pct+'%';$('bootPct').textContent=pct+'%';this.draw()},
 draw(){const x=this.cx,W=this.EW(),H=this.EH(),m=this.RM?0:1,dt=.016,now=performance.now();
  x.setTransform(this.d,0,0,this.d,0,0);x.clearRect(0,0,W,H);
  const thick=this.cinema?.7:1.1-Math.min(.4,(now-this.t0)/6000);       // smoke starts dense, then thins out
  for(const s of this.smoke){s.x+=s.vx*dt*m;s.y+=s.vy*dt*m;if(s.y<-s.r)Object.assign(s,this.mkSmoke(),{y:H+s.r});
   if(s.x<-s.r)s.x=W+s.r;if(s.x>W+s.r)s.x=-s.r;
   const g=x.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,'rgba(150,170,200,'+s.a*thick+')');g.addColorStop(1,'rgba(150,170,200,0)');
   x.fillStyle=g;x.beginPath();x.arc(s.x,s.y,s.r,0,6.283);x.fill()}
  x.globalAlpha=1;x.shadowBlur=0}
};
