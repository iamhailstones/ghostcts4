"use strict";
/* render.js - all canvas drawing: gritty tactical top-down look, dynamic lighting, tracers, and a military-style HUD */
/* visibility: characters and guns are drawn ~20% larger (30% on phones); the HUD blocks scale from their own corner, so the layout stays the same */
const VIS=()=>(typeof Orient!=='undefined'&&Orient.mobile)?1.3:1.2,HSCALE=()=>(typeof Orient!=='undefined'&&Orient.mobile)?1.28:1.12;
function circ(px,py,r,col){x.beginPath();x.arc(px,py,r,0,6.283);x.fillStyle=col;x.fill()}
/* ---------- CTS-4 sectors: every sector has its own environment AND its own obstacle look (obstacles keep the same boxes, so gameplay is unchanged) ---------- */
const DARK=[.45,.5,.3,.7,.5,.35,.65,.58,.7,.55];                                                                              // how dark each level is
const BODY={player:['#3f5a3a','#2d4129','#1f2c1c'],grunt:['#5a3c3a','#3a2826','#2a1c1b'],runner:['#6b5b4a','#4a3f33','#33291f'],
 shooter:['#4c4f58','#33363e','#22252b'],heavy:['#3a2a2a','#262020','#161212'],elite:['#1c1c22','#101015','#0a0a0d'],boss:['#201418','#130b0e','#0a0507']};
let floorC=null,floorL=0,lightC=null,fxC=null;
function sr(seed){let a=(seed*2654435761)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const rr=(g,px,py,w,h,r)=>{g.beginPath();g.moveTo(px+r,py);g.arcTo(px+w,py,px+w,py+h,r);g.arcTo(px+w,py+h,px,py+h,r);g.arcTo(px,py+h,px,py,r);g.arcTo(px,py,px+w,py,r);g.closePath()};
const speck=(g,n,col,a0,a1,sz)=>{for(let i=0;i<n;i++){g.fillStyle='rgba('+col+','+rnd(a0,a1)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,sz),rnd(1,sz))}};
const pool=(g,px,py,r,col,a)=>{const rg=g.createRadialGradient(px,py,0,px,py,r);rg.addColorStop(0,'rgba('+col+','+a+')');rg.addColorStop(1,'rgba('+col+',0)');g.fillStyle=rg;g.fillRect(px-r,py-r,r*2,r*2)};
const grid=(g,s,line,hi)=>{g.lineWidth=2;for(let i=0;i<=W;i+=s){g.strokeStyle=line;g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();if(hi){g.strokeStyle=hi;g.beginPath();g.moveTo(i+2,0);g.lineTo(i+2,H);g.stroke()}}
 for(let i=0;i<=H;i+=s){g.strokeStyle=line;g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();if(hi){g.strokeStyle=hi;g.beginPath();g.moveTo(0,i+2);g.lineTo(W,i+2);g.stroke()}}};
const wave=(g,sx,sy,len,amp,ph)=>{g.beginPath();g.moveTo(sx,sy);for(let k=0;k<=len;k+=6)g.lineTo(sx+k,sy+Math.sin(k/9+ph)*amp);g.stroke()};
const lin=(g,c0,c1)=>{const q=g.createLinearGradient(0,0,0,H);q.addColorStop(0,c0);q.addColorStop(1,c1);g.fillStyle=q;g.fillRect(0,0,W,H)};
function jag(g,px,py,ang,len,ph){g.moveTo(px,py);for(let k=0;k<len;k+=14){ph+=rnd(-.9,.9);px+=Math.cos(ang+ph*.5)*14;py+=Math.sin(ang+ph*.5)*14;g.lineTo(px,py)}}
/* 1 WATER */ const fWater=g=>{lin(g,'#0f4a78','#082f52');for(let i=0;i<14;i++)pool(g,rnd(0,W),rnd(0,H),rnd(80,200),'90,170,220',.22);
 g.strokeStyle='rgba(150,210,240,.16)';g.lineWidth=1.6;for(let i=0;i<90;i++)wave(g,rnd(0,W),rnd(0,H),rnd(30,80),3,i);speck(g,160,'200,235,255',.05,.2,3);
 fxC=document.createElement('canvas');fxC.width=W+40;fxC.height=H+30;const f=fxC.getContext('2d');f.strokeStyle='rgba(205,238,255,.3)';f.lineWidth=2.2;for(let i=0;i<46;i++)wave(f,rnd(0,W),rnd(0,H+30),rnd(40,110),4,i*2)};
/* 2 WHITE TILES */ const fTiles=g=>{lin(g,'#eef0f2','#d9dde1');for(let ix=0;ix<W;ix+=75)for(let iy=0;iy<H;iy+=75){g.fillStyle='rgba(0,0,0,'+rnd(0,.045)+')';g.fillRect(ix,iy,75,75)}
 grid(g,75,'rgba(105,114,125,.55)','rgba(255,255,255,.9)');for(let i=0;i<14;i++){g.strokeStyle='rgba(90,98,110,.18)';g.lineWidth=1.2;g.beginPath();g.moveTo(rnd(0,W),rnd(0,H));g.lineTo(rnd(0,W),rnd(0,H));g.stroke()}
 const q=g.createLinearGradient(0,0,W,H);q.addColorStop(0,'rgba(255,255,255,.35)');q.addColorStop(.5,'rgba(255,255,255,0)');q.addColorStop(1,'rgba(255,255,255,.25)');g.fillStyle=q;g.fillRect(0,0,W,H);speck(g,120,'80,90,100',.03,.1,3)};
/* 3 DESERT */ const fDesert=g=>{lin(g,'#dcb96e','#c29a52');for(let i=0;i<70;i++){const sy=rnd(0,H),sx=rnd(-40,W);g.strokeStyle=i%2?'rgba(150,108,48,.22)':'rgba(255,236,176,.22)';g.lineWidth=rnd(2,4);wave(g,sx,sy,rnd(120,300),5,i)}
 speck(g,520,'120,84,40',.05,.2,3);speck(g,200,'255,240,190',.05,.16,3);for(let i=0;i<26;i++){g.fillStyle='rgba(110,90,66,'+rnd(.25,.5)+')';g.beginPath();g.ellipse(rnd(0,W),rnd(0,H),rnd(2,5),rnd(1.5,3.5),rnd(0,3),0,6.283);g.fill()}};
/* 4 RED-LIT ROOM */ const fRed=g=>{lin(g,'#2a0a0e','#190508');grid(g,75,'rgba(0,0,0,.6)','rgba(255,70,70,.08)');for(let i=0;i<5;i++)pool(g,rnd(60,W-60),rnd(60,H-60),rnd(150,230),'255,40,40',.3);
 g.fillStyle='rgba(255,40,50,.55)';g.shadowColor='#ff2a2a';g.shadowBlur=18;g.fillRect(40,40,W-80,5);g.fillRect(40,H-45,W-80,5);g.shadowBlur=0;speck(g,260,'255,90,90',.02,.08,3);
 fxC=document.createElement('canvas');fxC.width=W;fxC.height=H;const f=fxC.getContext('2d');for(let i=0;i<5;i++)pool(f,rnd(60,W-60),rnd(60,H-60),rnd(160,240),'255,50,50',.5)};
/* 5 ROAD + GARDEN */ const fRoad=g=>{lin(g,'#3b3e43','#2f3237');speck(g,700,'0,0,0',.04,.14,3);speck(g,300,'200,200,205',.03,.09,2);
 g.fillStyle='#8d9096';g.fillRect(0,0,W,64);g.fillRect(0,H-64,W,64);g.fillStyle='#6f7278';g.fillRect(0,60,W,5);g.fillRect(0,H-65,W,5);g.fillStyle='#3d7a3a';g.fillRect(0,0,W,14);g.fillRect(0,H-14,W,14);
 for(let i=0;i<W;i+=26){g.fillStyle='rgba(60,130,55,.7)';g.fillRect(i,rnd(0,10),12,6);g.fillRect(i+8,H-rnd(8,16),12,6)}
 g.fillStyle='rgba(245,245,245,.85)';for(let i=0;i<W;i+=70)g.fillRect(i,H/2-3,40,6);g.fillStyle='rgba(235,195,40,.8)';g.fillRect(0,H/2-70,W,4);g.fillRect(0,H/2+66,W,4);
 for(let i=0;i<9;i++)g.fillRect(430+i*14,70,8,H-140);g.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<5;i++){g.beginPath();g.ellipse(rnd(0,W),rnd(70,H-70),rnd(14,30),rnd(8,16),0,0,6.283);g.fill()}
 g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.4;for(let i=0;i<14;i++){g.beginPath();jag(g,rnd(0,W),rnd(80,H-80),rnd(0,6),rnd(60,140),0);g.stroke()}};
/* 6 SNOW + ICE */ const fSnow=g=>{lin(g,'#e3edf4','#c4d6e4');for(let i=0;i<16;i++)pool(g,rnd(0,W),rnd(0,H),rnd(70,170),'255,255,255',.5);for(let i=0;i<10;i++)pool(g,rnd(0,W),rnd(0,H),rnd(60,130),'110,150,190',.18);
 g.strokeStyle='rgba(120,170,210,.4)';g.lineWidth=1.3;for(let i=0;i<22;i++){g.beginPath();jag(g,rnd(0,W),rnd(0,H),rnd(0,6),rnd(60,160),0);g.stroke()}speck(g,300,'255,255,255',.2,.6,3);speck(g,120,'120,160,200',.05,.15,2)};
/* 7 JUNGLE */ const fJungle=g=>{lin(g,'#235a27','#173b1b');for(let i=0;i<9;i++)pool(g,rnd(0,W),rnd(0,H),rnd(50,110),'110,80,45',.45);for(let i=0;i<14;i++)pool(g,rnd(0,W),rnd(0,H),rnd(60,140),'60,150,70',.25);
 for(let i=0;i<700;i++){g.strokeStyle='rgba('+(Math.random()<.5?'40,110,45':'90,170,80')+','+rnd(.25,.6)+')';g.lineWidth=1.4;const px=rnd(0,W),py=rnd(0,H),a=rnd(-2.2,-.9);g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(a)*rnd(6,13),py+Math.sin(a)*rnd(6,13));g.stroke()}
 for(let i=0;i<40;i++){g.fillStyle='rgba(30,'+(90+rnd(0,50)|0)+',40,.6)';g.beginPath();g.ellipse(rnd(0,W),rnd(0,H),rnd(5,10),rnd(2.5,5),rnd(0,3),0,6.283);g.fill()}};
/* 8 LAVA CAVERN */ const fLava=g=>{lin(g,'#1a1211','#0c0807');for(let i=0;i<10;i++)pool(g,rnd(0,W),rnd(0,H),rnd(60,150),'60,40,36',.4);speck(g,500,'255,255,255',.01,.05,3);
 const veins=[];for(let i=0;i<9;i++)veins.push([rnd(0,W),rnd(0,H),rnd(0,6.28)]);fxC=document.createElement('canvas');fxC.width=W;fxC.height=H;const f=fxC.getContext('2d');
 for(const [vx,vy,va] of veins){g.save();g.strokeStyle='#ff6a1a';g.lineWidth=3;g.lineCap='round';g.shadowColor='rgba(255,90,20,.9)';g.shadowBlur=10;g.beginPath();jag(g,vx,vy,va,rnd(180,360),0);g.stroke();g.restore();
  f.save();f.strokeStyle='rgba(255,120,30,.75)';f.lineWidth=9;f.lineCap='round';f.shadowColor='rgba(255,90,20,1)';f.shadowBlur=26;f.beginPath();jag(f,vx,vy,va,rnd(180,360),0);f.stroke();f.restore()}
 for(let i=0;i<90;i++){g.fillStyle='rgba(255,'+(120+rnd(0,80)|0)+',40,'+rnd(.2,.8)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,3),rnd(1,3))}};
/* 9 FACTORY */ const fFactory=g=>{lin(g,'#3d4249','#2e3238');for(let ix=0;ix<W;ix+=24)for(let iy=0;iy<H;iy+=24){g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1.4;g.beginPath();g.moveTo(ix+4,iy+12);g.lineTo(ix+12,iy+6);g.moveTo(ix+12,iy+18);g.lineTo(ix+20,iy+12);g.stroke()}
 grid(g,150,'rgba(0,0,0,.45)','rgba(255,255,255,.06)');for(let i=0;i<8;i++)pool(g,rnd(0,W),rnd(0,H),rnd(30,70),'0,0,0',.35);
 for(let k=0;k<2;k++){const bx=k?W-34:12;for(let iy=-40;iy<H+40;iy+=30){g.fillStyle='#e0b72a';g.beginPath();g.moveTo(bx,iy);g.lineTo(bx+22,iy-22);g.lineTo(bx+22,iy+8);g.lineTo(bx,iy+30);g.closePath();g.fill()}g.fillStyle='rgba(20,20,20,.55)';g.fillRect(bx,0,22,H)}
 g.fillStyle='rgba(120,130,140,.9)';for(let ix=150;ix<W;ix+=150)for(let iy=150;iy<H;iy+=150){g.beginPath();g.arc(ix-6,iy-6,2.6,0,6.283);g.arc(ix+6,iy-6,2.6,0,6.283);g.fill()}};
/* 10 BOSS ARENA */ const fBoss=g=>{lin(g,'#34091a','#1c0510');for(let i=0;i<46;i++){g.strokeStyle=i%2?'rgba(255,140,150,.13)':'rgba(0,0,0,.35)';g.lineWidth=rnd(1,2.6);g.beginPath();jag(g,rnd(0,W),rnd(0,H),rnd(0,6),rnd(120,300),0);g.stroke()}
 grid(g,100,'rgba(210,150,60,.28)','rgba(255,220,150,.07)');pool(g,W/2,H/2,300,'190,15,35',.4);g.strokeStyle='rgba(255,50,60,.3)';g.lineWidth=7;g.beginPath();g.arc(W/2,H/2,150,0,6.283);g.stroke();g.lineWidth=3;g.beginPath();g.arc(W/2,H/2,112,0,6.283);g.stroke();
 g.beginPath();for(let k=0;k<5;k++){const a=-1.5708+k*2.5133;g.lineTo(W/2+Math.cos(a)*150,H/2+Math.sin(a)*150)}g.closePath();g.stroke();
 fxC=document.createElement('canvas');fxC.width=W;fxC.height=H;const f=fxC.getContext('2d');pool(f,W/2,H/2,330,'255,40,60',.55)};
const THEMES=[fWater,fTiles,fDesert,fRed,fRoad,fSnow,fJungle,fLava,fFactory,fBoss];
function floorFor(l){if(floorC&&floorL===l)return floorC;
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');fxC=null;THEMES[(l-1)%THEMES.length](g);
 g.strokeStyle='rgba(230,190,40,.45)';g.lineWidth=6;g.setLineDash([22,16]);g.strokeRect(14,14,W-28,H-28);g.setLineDash([]);
 g.fillStyle='rgba(255,255,255,.06)';g.font='900 90px Impact,"Arial Black",sans-serif';g.textAlign='center';g.fillText('SECTOR '+String(l).padStart(2,'0'),W/2,H/2+30);
 floorC=c;floorL=l;return c}
/* animated touches drawn over the floor: water shimmer, red-room pulse, lava glow, boss-arena pulse */
function floorFx(){if(!fxC||!G)return;const l=((G.lvl-1)%10)+1;x.save();
 if(l===1){x.globalAlpha=.55;x.drawImage(fxC,Math.sin(T*.7)*12-20,Math.cos(T*.5)*7-15)}
 else{x.globalCompositeOperation='lighter';x.globalAlpha=l===8?.35+.3*Math.sin(T*2.2):l===10?.22+.14*Math.sin(T*1.4):.25+.18*Math.sin(T*1.8);x.drawImage(fxC,0,0)}x.restore()}
/* ---------- obstacles: same boxes, a different look in every sector ---------- */
const shad=(b,extra)=>{x.fillStyle='rgba(0,0,0,.5)';x.fillRect(b.x+7,b.y+9,b.w,b.h)};
function oRock(b){const R=sr(b.x*31+b.y*17),cx=b.x+b.w/2,cy=b.y+b.h/2,n=11,pts=[];for(let i=0;i<n;i++){const a=i*6.283/n,k=.8+R()*.2;pts.push([cx+Math.cos(a)*b.w*.52*k,cy+Math.sin(a)*b.h*.52*k])}
 x.save();x.strokeStyle='rgba(190,230,255,'+(.3+.15*Math.sin(T*2+b.x))+')';x.lineWidth=3;x.beginPath();x.ellipse(cx,cy+4,b.w*.62+Math.sin(T*2+b.y)*2,b.h*.6,0,0,6.283);x.stroke();x.restore();
 x.fillStyle='rgba(0,0,0,.45)';x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0]+6,p[1]+8):x.moveTo(p[0]+6,p[1]+8));x.closePath();x.fill();
 const g=x.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);g.addColorStop(0,'#868c92');g.addColorStop(1,'#3b4046');x.fillStyle=g;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();x.strokeStyle='#23272b';x.lineWidth=2.5;x.stroke();
 x.fillStyle='rgba(255,255,255,.13)';x.beginPath();x.ellipse(cx-b.w*.12,cy-b.h*.15,b.w*.28,b.h*.18,-.4,0,6.283);x.fill();
 x.strokeStyle='rgba(20,22,25,.7)';x.lineWidth=1.8;x.beginPath();x.moveTo(cx-b.w*.1,cy-b.h*.3);x.lineTo(cx+b.w*.02,cy);x.lineTo(cx-b.w*.12,cy+b.h*.25);x.moveTo(cx+b.w*.02,cy);x.lineTo(cx+b.w*.25,cy+b.h*.1);x.stroke();
 x.fillStyle='rgba(70,130,60,.55)';x.beginPath();x.ellipse(cx+b.w*.2,cy-b.h*.28,b.w*.1,b.h*.07,.5,0,6.283);x.ellipse(cx-b.w*.28,cy+b.h*.2,b.w*.08,b.h*.06,0,0,6.283);x.fill()}
function oBlock(b){shad(b);x.fillStyle='#2b323b';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='rgba(255,255,255,.14)';x.fillRect(b.x,b.y,b.w,5);x.fillRect(b.x,b.y,5,b.h);x.fillStyle='rgba(0,0,0,.3)';x.fillRect(b.x,b.y+b.h-5,b.w,5);x.fillRect(b.x+b.w-5,b.y,5,b.h);
 x.strokeStyle='#161b21';x.lineWidth=3;x.strokeRect(b.x+1.5,b.y+1.5,b.w-3,b.h-3);x.strokeStyle='#454f5c';x.lineWidth=1.6;x.strokeRect(b.x+9,b.y+9,b.w-18,b.h-18);
 x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=2;x.beginPath();x.moveTo(b.x+9,b.y+b.h/2);x.lineTo(b.x+b.w-9,b.y+b.h/2);x.stroke();x.fillStyle='rgba(120,170,230,.55)';x.fillRect(b.x+b.w/2-8,b.y+b.h/2-1,16,3)}
function oWood(b){shad(b);x.fillStyle='#7a5630';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='#dcc592';x.fillRect(b.x+7,b.y+7,b.w-14,b.h-14);x.strokeStyle='rgba(160,120,60,.45)';x.lineWidth=1.4;for(let i=0;i<4;i++){wave(x,b.x+9,b.y+13+i*((b.h-26)/3),b.w-18,1.6,i+b.x)}
 x.strokeStyle='#4a3317';x.lineWidth=3.5;x.strokeRect(b.x+1.5,b.y+1.5,b.w-3,b.h-3);x.strokeRect(b.x+7,b.y+7,b.w-14,b.h-14);x.strokeStyle='rgba(74,51,23,.8)';x.lineWidth=5;x.beginPath();x.moveTo(b.x+4,b.y+4);x.lineTo(b.x+b.w-4,b.y+b.h-4);x.moveTo(b.x+b.w-4,b.y+4);x.lineTo(b.x+4,b.y+b.h-4);x.stroke();
 x.fillStyle='#2a1d0e';for(const[a,c]of[[4,4],[b.w-4,4],[4,b.h-4],[b.w-4,b.h-4]]){x.beginPath();x.arc(b.x+a,b.y+c,2.3,0,6.283);x.fill()}}
function oDoor(b){shad(b);x.save();x.shadowColor='rgba(255,40,40,.7)';x.shadowBlur=14;x.fillStyle='#09090b';x.fillRect(b.x,b.y,b.w,b.h);x.restore();x.strokeStyle='#25252d';x.lineWidth=4;x.strokeRect(b.x+2,b.y+2,b.w-4,b.h-4);x.strokeStyle='#17171c';x.lineWidth=2;
 const vert=b.h>=b.w;if(vert){x.strokeRect(b.x+8,b.y+8,b.w-16,(b.h-24)/2);x.strokeRect(b.x+8,b.y+16+(b.h-24)/2,b.w-16,(b.h-24)/2)}else{x.strokeRect(b.x+8,b.y+8,(b.w-24)/2,b.h-16);x.strokeRect(b.x+16+(b.w-24)/2,b.y+8,(b.w-24)/2,b.h-16)}
 x.fillStyle='#8a7440';x.fillRect(vert?b.x+b.w-14:b.x+b.w/2-3,vert?b.y+b.h/2-3:b.y+b.h-14,vert?6:6,6);x.fillStyle='rgba(255,50,50,.5)';x.fillRect(b.x,b.y,b.w,2)}
function oGarden(b){const R=sr(b.x*13+b.y*7);shad(b);x.fillStyle='#6b3f2a';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='#3b2a1c';x.fillRect(b.x+5,b.y+5,b.w-10,b.h-10);x.strokeStyle='#4a2a1a';x.lineWidth=2;x.strokeRect(b.x+1,b.y+1,b.w-2,b.h-2);
 const n=Math.max(5,Math.round(b.w*b.h/330));for(let i=0;i<n;i++){const px=b.x+9+R()*(b.w-18),py=b.y+9+R()*(b.h-18),r=7+R()*6;x.fillStyle=['#2f7d32','#3f9a3b','#245c27'][i%3];x.beginPath();x.arc(px,py,r,0,6.283);x.fill();x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.arc(px-r*.3,py-r*.3,r*.45,0,6.283);x.fill()}
 for(let i=0;i<n;i++){x.fillStyle=['#ff7aa8','#ffd23f','#ffffff','#ff5a5a'][i%4];x.beginPath();x.arc(b.x+8+R()*(b.w-16),b.y+8+R()*(b.h-16),2.2,0,6.283);x.fill()}}
function oIce(b){shad(b);const g=x.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);g.addColorStop(0,'#d4f0fb');g.addColorStop(1,'#7fb8d8');x.fillStyle=g;x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='rgba(255,255,255,.45)';x.beginPath();x.moveTo(b.x+4,b.y+4);x.lineTo(b.x+b.w*.55,b.y+4);x.lineTo(b.x+4,b.y+b.h*.55);x.closePath();x.fill();
 x.strokeStyle='rgba(60,120,160,.55)';x.lineWidth=1.6;x.beginPath();x.moveTo(b.x+b.w*.2,b.y+b.h);x.lineTo(b.x+b.w*.45,b.y+b.h*.35);x.lineTo(b.x+b.w*.8,b.y);x.moveTo(b.x+b.w*.45,b.y+b.h*.35);x.lineTo(b.x+b.w,b.y+b.h*.6);x.stroke();x.strokeStyle='#4f8db0';x.lineWidth=3;x.strokeRect(b.x+1.5,b.y+1.5,b.w-3,b.h-3)}
function oStump(b){const cx=b.x+b.w/2,cy=b.y+b.h/2;shad(b);if(Math.max(b.w,b.h)/Math.min(b.w,b.h)<1.4){const r=Math.min(b.w,b.h)/2;x.fillStyle='#4a3320';x.beginPath();x.ellipse(cx,cy,b.w/2,b.h/2,0,0,6.283);x.fill();x.strokeStyle='#2a1c10';x.lineWidth=3;x.stroke();
  for(let k=1;k<=4;k++){x.strokeStyle=k%2?'#8a6a45':'#6f5232';x.lineWidth=2;x.beginPath();x.ellipse(cx,cy,b.w/2*(1-k*.2),b.h/2*(1-k*.2),0,0,6.283);x.stroke()}x.fillStyle='#a98557';x.beginPath();x.arc(cx,cy,r*.12,0,6.283);x.fill();x.fillStyle='rgba(60,130,60,.6)';x.beginPath();x.ellipse(cx+r*.5,cy-r*.45,r*.22,r*.14,.4,0,6.283);x.fill()}
 else{rr(x,b.x,b.y,b.w,b.h,10);x.fillStyle='#5a3d25';x.fill();x.strokeStyle='#2a1c10';x.lineWidth=3;x.stroke();x.strokeStyle='rgba(30,20,10,.5)';x.lineWidth=1.6;const h=b.w>b.h;for(let k=1;k<5;k++){x.beginPath();if(h){x.moveTo(b.x+12,b.y+k*b.h/5);x.lineTo(b.x+b.w-12,b.y+k*b.h/5)}else{x.moveTo(b.x+k*b.w/5,b.y+12);x.lineTo(b.x+k*b.w/5,b.y+b.h-12)}x.stroke()}
  for(const s of[0,1]){x.fillStyle='#a98557';x.beginPath();x.ellipse(h?(s?b.x+b.w-8:b.x+8):cx,h?cy:(s?b.y+b.h-8:b.y+8),h?7:b.w/2-3,h?b.h/2-3:7,0,0,6.283);x.fill();x.strokeStyle='#6f5232';x.lineWidth=1.4;x.stroke()}}}
function oObsidian(b){const R=sr(b.x*19+b.y*5),cx=b.x+b.w/2,by=b.y+b.h;x.fillStyle='rgba(0,0,0,.5)';x.fillRect(b.x+7,b.y+9,b.w,b.h);
 for(let k=0;k<4;k++){const bx=b.x+b.w*(.12+k*.25)+R()*8,w=b.w*(.22+R()*.12),h=b.h*(.55+R()*.45);x.save();x.shadowColor='rgba(255,90,30,.85)';x.shadowBlur=12;const g=x.createLinearGradient(bx,by-h,bx+w,by);g.addColorStop(0,'#3a2342');g.addColorStop(1,'#050308');x.fillStyle=g;x.beginPath();x.moveTo(bx,by);x.lineTo(bx+w*.15,by-h*.7);x.lineTo(bx+w*.5,by-h);x.lineTo(bx+w*.85,by-h*.6);x.lineTo(bx+w,by);x.closePath();x.fill();x.strokeStyle='#ff5a1f';x.lineWidth=2;x.stroke();x.restore();
  x.strokeStyle='rgba(220,190,255,.5)';x.lineWidth=1.4;x.beginPath();x.moveTo(bx+w*.5,by-h);x.lineTo(bx+w*.4,by-h*.3);x.stroke()}}
const CON=['#a33a2c','#2b5d8a','#3a6b3c','#b08a2a'];
function oContainer(b){const col=CON[((b.x>>4)+(b.y>>4))%4];shad(b);x.fillStyle=col;x.fillRect(b.x,b.y,b.w,b.h);const h=b.w>=b.h;x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let k=8;k<(h?b.w:b.h)-4;k+=8){x.beginPath();if(h){x.moveTo(b.x+k,b.y+3);x.lineTo(b.x+k,b.y+b.h-3)}else{x.moveTo(b.x+3,b.y+k);x.lineTo(b.x+b.w-3,b.y+k)}x.stroke()}
 x.fillStyle='rgba(255,255,255,.16)';x.fillRect(b.x,b.y,b.w,4);x.fillRect(b.x,b.y,4,b.h);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(b.x,b.y+b.h-4,b.w,4);x.strokeStyle='#15171a';x.lineWidth=3;x.strokeRect(b.x+1.5,b.y+1.5,b.w-3,b.h-3);x.fillStyle='rgba(230,230,230,.8)';x.fillRect(b.x+6,b.y+6,Math.min(26,b.w-12),4)}
function oPillar(b){shad(b);x.save();x.shadowColor='rgba(255,40,60,.6)';x.shadowBlur=12;x.fillStyle='#0a0709';x.fillRect(b.x,b.y,b.w,b.h);x.restore();x.strokeStyle='#8a2a2f';x.lineWidth=3;x.strokeRect(b.x+2,b.y+2,b.w-4,b.h-4);x.fillStyle='#17111a';x.fillRect(b.x+9,b.y+9,b.w-18,b.h-18);x.strokeStyle='rgba(210,150,60,.55)';x.lineWidth=1.6;x.strokeRect(b.x+9,b.y+9,b.w-18,b.h-18);
 x.beginPath();x.moveTo(b.x+9,b.y+9);x.lineTo(b.x+b.w-9,b.y+b.h-9);x.moveTo(b.x+b.w-9,b.y+9);x.lineTo(b.x+9,b.y+b.h-9);x.stroke();x.fillStyle='rgba(180,20,40,.6)';x.beginPath();x.arc(b.x+b.w/2,b.y+b.h/2,5,0,6.283);x.fill()}
const OBSTYLE=[oRock,oBlock,oWood,oDoor,oGarden,oIce,oStump,oObsidian,oContainer,oPillar];
function crate(b){(OBSTYLE[(G.lvl-1)%OBSTYLE.length]||oBlock)(b)}
/* Ghost only (top-down): a black hooded cloak, a wide-brimmed hat with a blood-red band, and a pale mask with two glowing red eyes on the front of the hat */
function ghostCloak(r,hit){x.fillStyle=hit?'#fff':'#07070a';x.beginPath();x.ellipse(-r*.12,0,r*1.05,r*1.28,0,0,6.283);x.fill();
 x.strokeStyle=hit?'#fff':'#1d1d24';x.lineWidth=1.5;x.beginPath();x.moveTo(-r*.7,-r*.9);x.lineTo(-r*1.05,-r*.2);x.moveTo(-r*.7,r*.9);x.lineTo(-r*1.05,r*.2);x.moveTo(-r*.95,0);x.lineTo(-r*.4,0);x.stroke()}
function ghostHat(r,hit){circ(r*.04,r*.05,r*.86,'rgba(0,0,0,.35)');circ(0,0,r*.84,hit?'#fff':'#0b0b0e');
 x.strokeStyle=hit?'#fff':'#4a4a55';x.lineWidth=2;x.beginPath();x.arc(0,0,r*.84,0,6.283);x.stroke();
 circ(0,0,r*.5,hit?'#fff':'#131318');x.strokeStyle=hit?'#fff':'#9a1020';x.lineWidth=r*.13;x.beginPath();x.arc(0,0,r*.5,0,6.283);x.stroke();circ(-r*.04,0,r*.2,hit?'#fff':'#0a0a0d');
 x.fillStyle=hit?'#fff':'#ece6d6';x.beginPath();x.ellipse(r*.7,0,r*.23,r*.36,0,0,6.283);x.fill();
 x.fillStyle='#111';x.fillRect(r*.62,-r*.02,r*.18,r*.04);
 x.fillStyle='#ff2a2a';x.shadowColor='#ff2a2a';x.shadowBlur=8;x.fillRect(r*.66,-r*.22,r*.1,r*.11);x.fillRect(r*.66,r*.11,r*.1,r*.11);x.shadowBlur=0}
function soldier(px,py,r,a,o){r*=VIS();
 const c=BODY[o.type]||BODY.grunt,hit=o.flash>0,P=o.type==='player',body=hit?'#fff':P?'#0c0c10':c[0],helm=hit?'#fff':c[1],vest=hit?'#fff':P?'#15151b':c[2],gl=o.gl||((o.type==='shooter'||o.type==='elite')?2.3:1.8);
 x.fillStyle='rgba(0,0,0,.45)';x.beginPath();x.ellipse(px+4,py+r*.8+4,r,r*.55,0,0,6.283);x.fill();
 x.save();x.translate(px,py);x.rotate(a);x.lineCap='round';
 if(P)ghostCloak(r,hit);
 const w=Math.sin(T*12+px*.1)*(o.mv?r*.28:0);
 x.fillStyle='#14170f';x.beginPath();x.ellipse(w,-r*.4,r*.5,r*.24,0,0,6.283);x.ellipse(-w,r*.4,r*.5,r*.24,0,0,6.283);x.fill();
 if(o.type==='boss'){x.fillStyle='rgba(120,10,25,.75)';x.beginPath();x.moveTo(-r*.4,-r*1.3);x.lineTo(-r*1.9,0);x.lineTo(-r*.4,r*1.3);x.closePath();x.fill()}
 x.fillStyle=vest;x.fillRect(-r,-r*.5,r*.5,r);
 x.fillStyle=body;x.beginPath();x.ellipse(0,0,r*.72,r,0,0,6.283);x.fill();
 x.fillStyle=vest;x.beginPath();x.ellipse(r*.05,0,r*.52,r*.72,0,0,6.283);x.fill();
 x.fillStyle='rgba(255,255,255,.1)';x.fillRect(r*.2,-r*.45,r*.14,r*.9);
 if(o.type==='heavy'||o.type==='boss'){circ(0,-r*.95,r*.32,'#4a4f55');circ(0,r*.95,r*.32,'#4a4f55')}
 if(o.col){x.fillStyle=o.col;x.fillRect(-r*.1,-r*1.02,r*.28,r*.22)}
 x.strokeStyle=body;x.lineWidth=r*.36;x.beginPath();x.moveTo(r*.1,-r*.8);x.lineTo(r,-r*.12);x.moveTo(r*.1,r*.8);x.lineTo(r*1.45,r*.12);x.stroke();
 x.fillStyle='#101318';x.fillRect(-r*.1,-r*.18,r*.35,r*.36);x.fillRect(r*.1,-r*.13,r*gl,r*.26);x.fillRect(r*gl*.9,-r*.06,r*.7,r*.12);
 x.fillStyle=o.type==='player'?'#6fd3ff':'#555a60';x.fillRect(r*.7,-r*.2,r*.35,r*.12);
 if(o.type==='shooter'||o.type==='elite'){x.strokeStyle='rgba(255,40,40,.25)';x.lineWidth=1;x.beginPath();x.moveTo(r*(gl+.8),0);x.lineTo(r*(gl+.8)+70,0);x.stroke()}
 if(o.mf>0){const mx=r*(.1+gl+.7);x.fillStyle='#ffe9a0';x.beginPath();x.moveTo(mx,0);for(let i=0;i<8;i++){const ang=i*.785,rad=i%2?r*.5:r*1.3;x.lineTo(mx+Math.cos(ang)*rad,Math.sin(ang)*rad)}x.closePath();x.fill()}
 if(P)ghostHat(r,hit);else{x.fillStyle=helm;x.beginPath();x.arc(r*.1,0,r*.6,0,6.283);x.fill();
 x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=2;x.beginPath();x.arc(r*.1,0,r*.6,-2.4,-.8);x.stroke();
 x.fillStyle=(o.type==='elite'||o.type==='boss')?'#ff3040':o.type==='heavy'?'#a02020':'#1a1d22';
 x.shadowColor=x.fillStyle;x.shadowBlur=o.type==='elite'||o.type==='boss'?10:0;x.fillRect(r*.52,-r*.36,r*.16,r*.72);x.shadowBlur=0}
 x.restore()}
function draw(){x.clearRect(0,0,W,H);if(!G)return;const p=G.p;
 x.save();if(G.shake>0)x.translate(rnd(-5,5)*G.shake*2,rnd(-5,5)*G.shake*2);
 x.drawImage(floorFor(G.lvl),0,0);floorFx();
 for(const d of G.decals){const g=x.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.beginPath();x.arc(d.x,d.y,d.r,0,6.283);x.fill()}
 for(const b of OBS.slice(0,Math.min(5,2+(G.lvl>>1))))crate(b);
 for(const k of G.pk){const c={a:'#d9b640',h:'#e8e8e8',b:'#7e8f5a',s:'#4aa3d9'}[k.k],by=k.y+Math.sin(T*4+k.x)*2;
  x.strokeStyle=c;x.globalAlpha=.4+.3*Math.sin(T*6);x.lineWidth=2;x.beginPath();x.arc(k.x,by,17,0,6.283);x.stroke();x.globalAlpha=1;
  x.fillStyle='#1b1f19';x.fillRect(k.x-10,by-8,20,16);x.fillStyle=c;x.fillRect(k.x-8,by-6,16,12);x.fillStyle='#111';x.font='bold 11px "Courier New",monospace';x.textAlign='center';x.fillText({a:'A',h:'+',b:'G',s:'S'}[k.k],k.x,by+4)}
 for(const e of G.enemies){const a=Math.atan2(p.y-e.y,p.x-e.x);soldier(e.x,e.y,e.r,a,{type:e.type,flash:e.flash,mv:1,col:e.t.col});
  if(e.shield){x.strokeStyle='#6fd3ff';x.lineWidth=3;x.shadowColor='#6fd3ff';x.shadowBlur=14;x.beginPath();x.arc(e.x,e.y,e.r+8+Math.sin(T*10)*2,0,6.283);x.stroke();x.shadowBlur=0}
  if((e.hp<e.max||SAVE.perks.scan)&&!e.boss){x.fillStyle='rgba(0,0,0,.6)';{const R=e.r*VIS();x.fillRect(e.x-R,e.y-R-12,R*2,4);x.fillStyle='#d9473a';x.fillRect(e.x-R,e.y-R-12,R*2*Math.max(0,e.hp/e.max),4)}}}
 for(const b of G.bombs){circ(b.x,b.y,9,'#4b5538');circ(b.x,b.y,4,'#2a3020');x.strokeStyle=Math.floor(b.t*10)%2?'#ff3b3b':'#d9b640';x.lineWidth=2;x.beginPath();x.arc(b.x,b.y,9+Math.sin(T*30),0,6.283);x.stroke()}
 x.lineCap='round';
 for(const b of G.bul){x.strokeStyle='rgba(255,170,60,.45)';x.lineWidth=5;x.beginPath();x.moveTo(b.x-b.vx*.05,b.y-b.vy*.05);x.lineTo(b.x,b.y);x.stroke();x.strokeStyle='#fff3c0';x.lineWidth=2;x.beginPath();x.moveTo(b.x-b.vx*.03,b.y-b.vy*.03);x.lineTo(b.x,b.y);x.stroke()}
 for(const b of G.eb){x.strokeStyle='rgba(255,70,40,.9)';x.lineWidth=3;x.beginPath();x.moveTo(b.x-b.vx*.04,b.y-b.vy*.04);x.lineTo(b.x,b.y);x.stroke()}
 for(const f of G.fx){
  if(f.ring){const t=1-f.life/f.max,R=Math.max(1,f.R*t),g=x.createRadialGradient(f.x,f.y,0,f.x,f.y,R);g.addColorStop(0,'rgba(255,230,150,'+(1-t)*.9+')');g.addColorStop(.5,'rgba(255,120,30,'+(1-t)*.6+')');g.addColorStop(1,'rgba(40,20,10,0)');
   x.fillStyle=g;x.beginPath();x.arc(f.x,f.y,R,0,6.283);x.fill();x.strokeStyle='rgba(255,255,255,'+(1-t)*.5+')';x.lineWidth=3;x.beginPath();x.arc(f.x,f.y,R,0,6.283);x.stroke()}
  else if(f.mg){x.save();x.translate(f.x,f.y);x.rotate(f.rot+T*6);x.globalAlpha=Math.min(1,f.life*2);x.fillStyle='#1a1d22';x.fillRect(-3,-5,6,10);x.strokeStyle='#d9b640';x.lineWidth=1;x.strokeRect(-3,-5,6,10);x.restore();x.globalAlpha=1}
  else if(f.sm){const t=1-f.life/f.max;x.globalAlpha=(1-t)*.5;circ(f.x,f.y,f.r*(1+t*1.5),'#2a2a2a');x.globalAlpha=1}
  else{x.globalAlpha=Math.min(1,f.life*2.5);x.strokeStyle=f.col;x.lineWidth=f.big?3:1.5;x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.x-f.vx*.04,f.y-f.vy*.04);x.stroke();x.globalAlpha=1}}
 soldier(p.x,p.y,p.r,p.a,{type:'player',mv:p.mv,flash:p.hurt>.15?1:0,mf:p.mf,gl:GUNLEN[p.gun]});
 if(p.sh>0){x.strokeStyle='#4aa3d9';x.lineWidth=2;x.shadowColor='#4aa3d9';x.shadowBlur=12;x.beginPath();x.arc(p.x,p.y,p.r+8+Math.sin(T*12),0,6.283);x.stroke();x.shadowBlur=0}
 if(G.hitT>0){x.strokeStyle='rgba(255,40,40,'+Math.min(1,G.hitT)+')';x.lineWidth=10;x.beginPath();x.arc(p.x,p.y,50,G.hitA-.5,G.hitA+.5);x.stroke()}
 {const nm=SAVE.name||'GHOST',ty=Math.max(24,p.y-p.r*VIS()-22);x.font='700 12px "Courier New",monospace';x.textAlign='center';x.lineWidth=3;x.strokeStyle='rgba(0,0,0,.8)';x.strokeText(nm,p.x,ty);x.fillStyle='#e8f0e0';x.fillText(nm,p.x,ty)}
 x.restore();
 /* lighting: darkness with a flashlight cone, muzzle flash and explosion light */
 if(!lightC){lightC=document.createElement('canvas');lightC.width=W;lightC.height=H}
 const L=lightC.getContext('2d');L.globalCompositeOperation='source-over';L.clearRect(0,0,W,H);L.fillStyle='rgba(2,4,8,'+DARK[G.lvl-1]+')';L.fillRect(0,0,W,H);L.globalCompositeOperation='destination-out';
 const hole=(px,py,R,al,core)=>{const g=L.createRadialGradient(px,py,R*.08,px,py,R);g.addColorStop(0,'rgba(0,0,0,'+al+')');if(core)g.addColorStop(core,'rgba(0,0,0,'+al+')');g.addColorStop(1,'rgba(0,0,0,0)');L.fillStyle=g;L.beginPath();L.arc(px,py,R,0,6.283);L.fill()};
 hole(p.x,p.y,380,1,.5);L.save();L.translate(p.x,p.y);L.rotate(p.a);{const g=L.createRadialGradient(0,0,20,0,0,780);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.6,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');L.fillStyle=g;L.beginPath();L.moveTo(0,0);L.arc(0,0,780,-.58,.58);L.closePath();L.fill()}L.restore();
 if(p.mf>0)hole(p.x+Math.cos(p.a)*30,p.y+Math.sin(p.a)*30,140,.9);
 for(const f of G.fx)if(f.ring)hole(f.x,f.y,f.R*1.4*(1-f.life/f.max)+30,Math.max(0,f.life/f.max));
 x.drawImage(lightC,0,0);
 /* Ghost's light is very bright: a warm-white glow around him and a long beam from the hat (added on top; the ring starts outside his body so the cloak stays dark) */
 x.save();x.globalCompositeOperation='lighter';
 {const g=x.createRadialGradient(p.x,p.y,10,p.x,p.y,330);g.addColorStop(0,'rgba(255,246,225,.34)');g.addColorStop(.5,'rgba(255,236,200,.15)');g.addColorStop(1,'rgba(255,230,190,0)');x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,330,0,6.283);x.fill()}
 x.translate(p.x,p.y);x.rotate(p.a);{const g=x.createRadialGradient(0,0,10,0,0,740);g.addColorStop(0,'rgba(255,248,230,.32)');g.addColorStop(.6,'rgba(255,240,210,.14)');g.addColorStop(1,'rgba(255,235,200,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,0);x.arc(0,0,740,-.52,.52);x.closePath();x.fill()}
 x.restore();
 /* Ghost is drawn again on top of his own light so the black cloak and red-banded hat stay crisp */
 soldier(p.x,p.y,p.r,p.a,{type:'player',mv:p.mv,flash:p.hurt>.15?1:0,mf:p.mf,gl:GUNLEN[p.gun]});
 const v=x.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*.9);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=v;x.fillRect(0,0,W,H);
 if(p.hurt>0){x.fillStyle='rgba(200,20,30,'+Math.min(.3,p.hurt)+')';x.fillRect(0,0,W,H)}
 if(G.flash>0){x.fillStyle='rgba(255,235,190,'+Math.min(.45,G.flash*1.8)+')';x.fillRect(0,0,W,H)}
 hudCanvas(p);crosshair(p);
}
function crosshair(p){const cx=M.x,cy=M.y,sp=(p.cd>0?7:0)+(p.rel>0?9:0);x.strokeStyle='rgba(235,240,230,.9)';x.lineWidth=2;x.lineCap='butt';
 for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){x.beginPath();x.moveTo(cx+a*(6+sp),cy+b*(6+sp));x.lineTo(cx+a*(14+sp),cy+b*(14+sp));x.stroke()}circ(cx,cy,1.5,'#fff');if(p.rel>0&&p.rt){x.strokeStyle='#39ff7a';x.lineWidth=3;x.beginPath();x.arc(cx,cy,22,-1.571,-1.571+6.283*(1-p.rel/p.rt));x.stroke()}
 const mk=(col,s,t)=>{x.strokeStyle=col;x.lineWidth=t;for(const[a,b]of[[1,1],[-1,1],[1,-1],[-1,-1]]){x.beginPath();x.moveTo(cx+a*5,cy+b*5);x.lineTo(cx+a*s,cy+b*s);x.stroke()}};
 if(G.hm>0)mk('#fff',12,2.5);if(G.kt>0)mk('#ff3b3b',16,3.5)}
function hudCanvas(p){x.textBaseline='alphabetic';const hs=HSCALE();
 const hp=Math.max(0,p.hp/CFG.hp),big='900 34px Impact,"Arial Black",sans-serif',mono='11px "Courier New",monospace';
 x.save();x.translate(0,H);x.scale(hs,hs);x.translate(0,-H);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(14,H-70,250,58);x.textAlign='left';x.fillStyle='#e6ecdc';x.font=big;x.fillText(Math.ceil(Math.max(0,p.hp)),24,H-22);
 x.font=mono;x.fillStyle='#9aa593';x.fillText('HEALTH'+(p.sh>0?'  +ARMOR':''),24,H-54);
 for(let i=0;i<10;i++){x.fillStyle=i<Math.ceil(hp*10)?(hp<.3?'#e0443a':'#d9e0cf'):'rgba(255,255,255,.12)';x.fillRect(96+i*15,H-42,11,18)}
 x.restore();
 x.save();x.translate(W,H);x.scale(hs,hs);x.translate(-W,-H);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(W-264,H-84,250,72);gunSprite(x,p.gun||'pistol',W-258,H-82,66,24);x.textAlign='right';x.fillStyle=p.mag<=3?'#e0443a':'#f1f5ea';x.font='900 52px Impact,"Arial Black",sans-serif';x.fillText(p.mag,W-100,H-30);
 x.font='900 24px Impact,"Arial Black",sans-serif';x.fillStyle='#aeb7a4';x.fillText('/ '+p.reserve,W-24,H-30);x.font=mono;x.fillStyle='#9aa593';x.fillText(gun().name+'  |  '+(p.rel>0?'RELOADING':'READY'),W-24,H-72);
 for(let i=0;i<p.bombs;i++)circ(W-250+i*16,H-20,5,'#8a9a6a');
 x.textAlign='left';x.font='11px "Courier New",monospace';x.fillStyle='#9aa593';x.fillText('x'+p.bombs,W-250+Math.max(p.bombs,1)*16+2,H-16);
 if(p.rel>0&&p.rt){x.fillStyle='rgba(255,255,255,.15)';x.fillRect(W-244,H-16,150,3);x.fillStyle='#fff';x.fillRect(W-244,H-16,150*(1-p.rel/p.rt),3)}
 x.restore();
 x.save();x.translate(W/2,0);x.scale(hs,hs);x.translate(-W/2,0);const left=(G.total-G.spawned)+G.enemies.length;x.textAlign='center';x.fillStyle='#eef2e8';x.font='900 18px Impact,"Arial Black",sans-serif';
 x.fillText(G.boss?'ELIMINATE THE COMMANDER':'HOSTILES REMAINING  '+left,W/2,26);x.font=mono;x.fillStyle='#9aa593';x.fillText((G.boss?'':'WAVE '+G.wave+'/'+G.waves+'   |   ')+'SCORE '+score+'   |   KILLS '+kills,W/2,44);
 if(G.combo>1&&G.comboT>0){x.fillStyle='#ffd54f';x.font='900 22px Impact,"Arial Black",sans-serif';x.fillText(['DOUBLE KILL','TRIPLE KILL','MULTI KILL'][Math.min(G.combo,4)-2],W/2,74)}
 if(G.boss&&G.enemies.includes(G.boss)){x.fillStyle='rgba(0,0,0,.6)';x.fillRect(W/2-210,84,420,10);x.fillStyle='#c0392b';x.fillRect(W/2-210,84,420*Math.max(0,G.boss.hp/G.boss.max),10);x.fillStyle='#eee';x.font=mono;x.fillText('THE COMMANDER  -  PHASE '+G.boss.ph,W/2,110)}
 x.restore();
 x.save();x.translate(W,0);x.scale(hs,hs);x.translate(-W,0);x.textAlign='right';x.font='12px "Courier New",monospace';G.feed.forEach((f,i)=>{x.globalAlpha=Math.min(1,f.life);x.fillStyle='#d6dccb';x.fillText(f.txt,W-16,(G.boss?132:100)+i*18)});x.globalAlpha=1;x.restore();
 x.save();x.scale(hs,hs);const mx=82,my=88,R=62,s=.13;x.save();x.beginPath();x.arc(mx,my,R,0,6.283);x.clip();x.fillStyle='rgba(6,14,9,.7)';x.fillRect(mx-R,my-R,R*2,R*2);
 x.strokeStyle='rgba(120,200,140,.18)';x.lineWidth=1;x.beginPath();x.arc(mx,my,R/2,0,6.283);x.moveTo(mx-R,my);x.lineTo(mx+R,my);x.moveTo(mx,my-R);x.lineTo(mx,my+R);x.stroke();
 x.fillStyle='rgba(120,130,110,.5)';for(const b of OBS.slice(0,Math.min(5,2+(G.lvl>>1))))x.fillRect(mx+(b.x-p.x)*s,my+(b.y-p.y)*s,b.w*s,b.h*s);
 for(const e of G.enemies){let dx=(e.x-p.x)*s,dy=(e.y-p.y)*s;const d=Math.hypot(dx,dy);if(d>R-4){dx*=(R-4)/d;dy*=(R-4)/d}circ(mx+dx,my+dy,e.boss?4:2.6,'#ff4040')}
 x.translate(mx,my);x.rotate(p.a);x.fillStyle='#6cf08a';x.beginPath();x.moveTo(7,0);x.lineTo(-5,-4.5);x.lineTo(-5,4.5);x.closePath();x.fill();x.restore();
 x.strokeStyle='rgba(180,220,190,.6)';x.lineWidth=2;x.beginPath();x.arc(mx,my,R,0,6.283);x.stroke();x.restore()}
