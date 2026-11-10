"use strict";
/* orient.js - landscape mode for phones (desktop is never touched).
   1. Silent: try fullscreen + landscape lock at launch and on the player's first taps (browsers need a tap).
   2. Only if that is impossible (iPhone Safari has no orientation lock) or was refused, show a clean "rotate your phone" prompt.
      "continue in portrait" is always available, and the prompt disappears by itself when the phone is turned. */
const Orient={blocking:false,mobile:false,done:false,failed:false,skip:false,tries:0,
 isMobile(){return typeof matchMedia!=='undefined'&&matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<900},
 /* FORCED landscape: on a phone / small tablet held upright the rotate screen covers EVERYTHING (loading screen included) until the device is turned. There is no way around it. */
 canLock(){return !!(screen.orientation&&screen.orientation.lock)},
 portrait(){return innerHeight>innerWidth},
 async request(){let locked=false;
  try{const el=document.documentElement;if(!document.fullscreenElement&&el.requestFullscreen)await el.requestFullscreen({navigationUI:'hide'})}catch(e){}
  try{if(this.canLock()){await screen.orientation.lock('landscape');locked=true}}catch(e){}
  if(locked)this.done=true;return locked},
 update(){const o=$('orient');if(!o)return;const need=this.mobile&&!this.skip&&this.portrait();
  $('orientGo').style.display=this.canLock()?'':'none';o.classList.toggle('on',need);this.blocking=need;
  if(need&&typeof state!=='undefined'&&state==='play'&&typeof pause==='function')pause()},
 start(){this.mobile=this.isMobile();if(!this.mobile)return;
  this.request();
  const again=async()=>{if(this.done||this.tries>=4)return;this.tries++;const ok=await this.request();
   if(!ok)setTimeout(()=>{if(this.portrait()){this.failed=true;this.update()}},700);else setTimeout(()=>this.update(),400)};
  ['pointerup','click','touchend'].forEach(ev=>addEventListener(ev,again,true));
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){this.done=false;this.tries=0}});
  addEventListener('resize',()=>this.update());addEventListener('orientationchange',()=>setTimeout(()=>this.update(),250));
  $('orientGo').onclick=async()=>{const ok=await this.request();setTimeout(()=>{this.update();if(this.portrait())$('orientMsg').textContent=ok?'Now turn your phone sideways.':'Your browser did not allow it. Please rotate your phone sideways.'},350)};
  this.update()}};
