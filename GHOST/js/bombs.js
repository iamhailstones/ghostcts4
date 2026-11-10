"use strict";
/* bombs.js - bomb throwing and area-of-effect explosions */
function throwBomb(){const p=G.p;if(p.bombs<=0)return msg('NO BOMBS REMAINING');p.bombs--;msg('BOMB DEPLOYED');
 G.bombs.push({x:p.x,y:p.y,vx:Math.cos(p.a)*330,vy:Math.sin(p.a)*330,t:CFG.fuse})}
function plantBomb(){const p=G&&G.p;if(!p||state!=='play')return;if(p.bombs<=0)return msg('NO BOMBS REMAINING');
 const activeObs=OBS.slice(0,Math.min(5,2+(G.lvl>>1)));let best=null,minD=1e9;
 for(const b of activeObs){const cx=clamp(p.x,b.x,b.x+b.w),cy=clamp(p.y,b.y,b.y+b.h),d=Math.hypot(p.x-cx,p.y-cy);if(d<minD){minD=d;best={b,cx,cy}}}
 if(!best||minD>110)return msg('MOVE CLOSER TO AN OBSTACLE TO PLANT');
 p.bombs--;sfx('ok');msg('TIME BOMB PLANTED ON OBSTACLE');
 G.bombs.push({x:best.cx,y:best.cy,vx:0,vy:0,t:2.4,planted:true,obstacle:best.b})}
function explode(px,py,R,dmg,bonus){G.shake=.4;G.flash=.25;sfx('boom');G.decals.push({x:px,y:py,r:R*.55});if(G.decals.length>24)G.decals.shift();for(let i=0;i<7;i++)G.fx.push({sm:1,x:px+rnd(-R*.4,R*.4),y:py+rnd(-R*.4,R*.4),vx:rnd(-12,12),vy:rnd(-25,-8),life:1.6,max:1.6,r:rnd(22,42)});G.fx.push({ring:1,x:px,y:py,R,life:.45,max:.45});fxBurst(px,py,34,'#ff9a3c',260);let k=0;
 for(const e of G.enemies){if(e.dead)continue;const d=Math.hypot(e.x-px,e.y-py);if(d<R){const dead=hurt(e,dmg*(1-d/R),bonus);if(dead)k++}}
 if(k&&bonus){addScore(25*k);msg('EXPLOSIVE KILL + BONUS POINTS')}}
