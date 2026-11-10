"use strict";
/* render.js - all canvas drawing: gritty tactical top-down look, dynamic lighting, tracers, and a military-style HUD */
/* visibility: characters and guns are drawn ~20% larger (30% on phones); the HUD blocks scale from their own corner, so the layout stays the same */
const VIS=()=>(typeof Orient!=='undefined'&&Orient.mobile)?1.3:1.2,HSCALE=()=>(typeof Orient!=='undefined'&&Orient.mobile)?1.28:1.12;
function circ(px,py,r,col){x.beginPath();x.arc(px,py,r,0,6.283);x.fillStyle=col;x.fill()}
const ENV=[[350,52,17],[346,48,16],[354,56,20],[348,50,14],[356,58,18],[350,44,24],[344,48,15],[352,54,17],[348,46,12],[355,62,14]];  // floor colour per level (CTS-4: deep crimson)
const DARK=[.45,.5,.3,.7,.5,.35,.65,.58,.7,.55];                                                                              // how dark each level is
const BODY={player:['#3f5a3a','#2d4129','#1f2c1c'],grunt:['#5a3c3a','#3a2826','#2a1c1b'],runner:['#6b5b4a','#4a3f33','#33291f'],
 shooter:['#4c4f58','#33363e','#22252b'],heavy:['#3a2a2a','#262020','#161212'],elite:['#1c1c22','#101015','#0a0a0d'],boss:['#201418','#130b0e','#0a0507']};
let floorC=null,floorL=0,lightC=null;
/* backgrounds: every sector 1-10 has its own floor + obstacle look: 1 water+rocks, 2 white tiles+stone blocks, 3 desert+sandboxes, 4 red-lit room+black doors, 5 road+garden beds, 6 ice field+ice blocks, 7 silver metal+steel blocks, 8 forest+trees, 9 space+asteroids, 10 sky+storm clouds.
   floorFor() and crate() below use BGX; the old crimson floor code is kept inside floorFor() only as a safety fallback. Gameplay, collisions, lighting, HUD and minimap are unchanged. */
const BGX=(()=>{
 const sr=seed=>{let s=(seed|0)||1;return()=>{s=(Math.imul(s,1664525)+1013904223)|0;return(s>>>0)/4294967296}};
 const PAD=16,OBC=new Map(),KIND={1:'rock',2:'stone',3:'sandbox',4:'orb',5:'garden',6:'ice',7:'steel',8:'tree',9:'asteroid',10:'storm'};
 /* ---------- floors (drawn once per level into a cached canvas) ---------- */
 const FLOOR=SCENES;   /* the ten environments live in scenes.js */
 /* ---------- obstacles: drawn once into a small cached canvas per obstacle, then just blitted each frame ---------- */
 const blob=(g,w,h,r,off,n,jit)=>{const cx=w/2+off,cy=h/2+off;g.beginPath();for(let i=0;i<n;i++){const a=i/n*6.283,c=Math.cos(a),s=Math.sin(a),e=1/Math.pow(Math.pow(Math.abs(c),3)+Math.pow(Math.abs(s),3),1/3),j=1-r()*jit,px=cx+c*e*w/2*j,py=cy+s*e*h/2*j;i?g.lineTo(px,py):g.moveTo(px,py)}g.closePath()};
 const shRect=(g,w,h,col)=>{g.fillStyle=col||'rgba(0,0,0,.5)';g.fillRect(7,9,w,h)};
 const OBJ={
  rock(g,w,h,r){g.fillStyle='rgba(0,0,0,.45)';blob(g,w,h,sr(7),8,16,.12);g.fill();
   const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,'#9a9fa3');q.addColorStop(1,'#4b5055');g.fillStyle=q;blob(g,w,h,sr(7),0,16,.12);g.fill();
   g.fillStyle='rgba(255,255,255,.16)';g.save();g.translate(w*.06,h*.06);g.scale(.62,.55);blob(g,w,h,sr(11),0,12,.2);g.fill();g.restore();
   g.strokeStyle='rgba(20,22,26,.65)';g.lineWidth=2;for(let i=0;i<3;i++){let px=rnd(w*.2,w*.8),py=rnd(h*.2,h*.5);g.beginPath();g.moveTo(px,py);for(let k=0;k<3;k++){px+=rnd(-12,12);py+=rnd(8,16);g.lineTo(px,py)}g.stroke()}
   g.fillStyle='rgba(60,95,45,.55)';for(let i=0;i<7;i++){g.beginPath();g.ellipse(rnd(w*.2,w*.85),h*rnd(.72,.92),rnd(4,9),rnd(2,4),0,0,6.283);g.fill()}
   g.strokeStyle='#1c1f23';g.lineWidth=2.5;blob(g,w,h,sr(7),0,16,.12);g.stroke();
   g.fillStyle='rgba(180,225,245,.5)';for(let i=0;i<5;i++)g.fillRect(rnd(w*.1,w*.9),h*.95+rnd(-2,3),rnd(4,9),2)},
  stone(g,w,h,r){shRect(g,w,h);const q=g.createLinearGradient(0,0,0,h);q.addColorStop(0,'#6b7684');q.addColorStop(1,'#4a535f');g.fillStyle=q;g.fillRect(0,0,w,h);
   g.fillStyle='rgba(255,255,255,.2)';g.fillRect(0,0,w,5);g.fillRect(0,0,5,h);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,h-5,w,5);g.fillRect(w-5,0,5,h);
   g.strokeStyle='rgba(20,26,34,.6)';g.lineWidth=2;g.strokeRect(12,12,w-24,h-24);g.beginPath();g.moveTo(12,h/2);g.lineTo(w-12,h/2);g.stroke();
   g.strokeStyle='#232a33';g.lineWidth=3;g.strokeRect(1.5,1.5,w-3,h-3);g.fillStyle='rgba(120,170,220,.55)';g.fillRect(w/2-10,h/2-2,20,4)},
  sandbox(g,w,h,r){shRect(g,w,h);g.fillStyle='#6a4526';g.fillRect(0,0,w,h);
   g.fillStyle='rgba(255,220,170,.14)';for(let y=0;y<h;y+=11)g.fillRect(0,y,w,1.5);g.fillStyle='#e9cf92';const m=9;g.fillRect(m,m,w-m*2,h-m*2);
   g.strokeStyle='rgba(150,105,45,.5)';g.lineWidth=1.5;for(let y=m+8;y<h-m;y+=9){g.beginPath();g.moveTo(m,y);for(let px=m;px<=w-m;px+=8)g.lineTo(px,y+Math.sin(px*.3+y)*1.6);g.stroke()}
   const q=g.createRadialGradient(w*.5,h*.45,2,w*.5,h*.45,Math.max(w,h)*.5);q.addColorStop(0,'rgba(255,245,210,.55)');q.addColorStop(1,'rgba(255,245,210,0)');g.fillStyle=q;g.fillRect(m,m,w-m*2,h-m*2);
   g.fillStyle='rgba(0,0,0,.28)';g.fillRect(m,m,w-m*2,3);g.fillRect(m,m,3,h-m*2);
   g.strokeStyle='#33200f';g.lineWidth=3;g.strokeRect(1.5,1.5,w-3,h-3);g.fillStyle='#4a2f17';for(const[a,b]of[[0,0],[w-10,0],[0,h-10],[w-10,h-10]])g.fillRect(a,b,10,10)},
  orb(g,w,h,r){const rx=w/2,ry=h/2,R=1+PAD/Math.max(rx,ry),f=1/R;g.save();g.translate(rx,ry);g.scale(rx,ry);
   const q=g.createRadialGradient(0,0,0,0,0,R);q.addColorStop(0,'rgba(255,250,240,1)');q.addColorStop(f*.4,'rgba(255,214,170,.96)');q.addColorStop(f*.85,'rgba(255,130,80,.78)');q.addColorStop(f,'rgba(255,85,55,.45)');q.addColorStop(1,'rgba(255,60,40,0)');
   g.fillStyle=q;g.beginPath();g.arc(0,0,R,0,6.2832);g.fill();
   const hl=g.createRadialGradient(-.25,-.3,0,-.25,-.3,.45);hl.addColorStop(0,'rgba(255,255,255,.75)');hl.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=hl;g.beginPath();g.arc(0,0,f,0,6.2832);g.fill();g.restore()},
  door(g,w,h,r){shRect(g,w,h,'rgba(0,0,0,.6)');g.fillStyle='#120708';g.fillRect(0,0,w,h);const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,'#1a1a20');q.addColorStop(1,'#050507');g.fillStyle=q;g.fillRect(4,4,w-8,h-8);
   const vert=h>=w,L=vert?h:w,S=vert?w:h,n=Math.max(1,Math.round(L/(S*1.05))),pw=L/n;
   for(let i=0;i<n;i++){const a=i*pw+8,b=pw-16,rx=vert?12:a,ry=vert?a:12,rw=vert?w-24:b,rh=vert?b:h-24;g.fillStyle='rgba(255,255,255,.04)';g.fillRect(rx,ry,rw,rh);g.strokeStyle='rgba(0,0,0,.8)';g.lineWidth=2;g.strokeRect(rx,ry,rw,rh);g.strokeStyle='rgba(255,255,255,.1)';g.lineWidth=1;g.beginPath();g.moveTo(rx+1,ry+rh);g.lineTo(rx+1,ry+1);g.lineTo(rx+rw,ry+1);g.stroke()}
   g.strokeStyle='#7a1014';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);g.fillStyle='rgba(255,70,50,.22)';g.fillRect(0,0,w,3);g.fillRect(0,0,3,h);
   const hx=vert?w-12:L*.82,hy=vert?L*.5:h-12;g.save();g.shadowColor='#d9a83a';g.shadowBlur=6;g.fillStyle='#d9a83a';g.beginPath();g.arc(hx,hy,4.5,0,6.283);g.fill();g.restore();g.fillStyle='#fff3c0';g.beginPath();g.arc(hx-1,hy-1,1.5,0,6.283);g.fill()},
  garden(g,w,h,r){shRect(g,w,h,'rgba(0,0,0,.45)');g.fillStyle='#8d8f8a';g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.2)';g.fillRect(0,0,w,3);g.fillRect(0,0,3,h);g.fillStyle='#3a291b';g.fillRect(6,6,w-12,h-12);
   for(let i=0;i<Math.round(w*h/55);i++){const px=rnd(10,w-10),py=rnd(10,h-10);g.fillStyle='hsl('+rnd(95,135)+','+rnd(40,62)+'%,'+rnd(20,38)+'%)';g.beginPath();g.arc(px,py,rnd(4,9),0,6.283);g.fill()}
   const cols=['#f04f6e','#ffd84a','#ffffff','#ff8a3d','#c36bff'];for(let i=0;i<Math.round(w*h/230);i++){g.fillStyle=cols[(Math.random()*cols.length)|0];g.beginPath();g.arc(rnd(12,w-12),rnd(12,h-12),rnd(1.8,3.2),0,6.283);g.fill()}
   g.strokeStyle='#5d5f5b';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);g.strokeStyle='rgba(0,0,0,.25)';g.strokeRect(6,6,w-12,h-12)},
  ice(g,w,h,r){g.fillStyle='rgba(10,40,80,.35)';blob(g,w,h,sr(5),8,9,.28);g.fill();
   const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,'#e6f7ff');q.addColorStop(.5,'#9fd3ee');q.addColorStop(1,'#5a9cc4');g.fillStyle=q;blob(g,w,h,sr(5),0,9,.28);g.fill();
   g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=2;g.beginPath();g.moveTo(w*.18,h*.3);g.lineTo(w*.5,h*.14);g.lineTo(w*.82,h*.3);g.moveTo(w*.5,h*.14);g.lineTo(w*.52,h*.62);g.stroke();
   g.strokeStyle='rgba(40,95,140,.55)';g.lineWidth=1.5;g.beginPath();g.moveTo(w*.3,h*.9);g.lineTo(w*.52,h*.62);g.lineTo(w*.78,h*.82);g.stroke();
   g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(w*.34,h*.32,w*.1,h*.05,-.5,0,6.283);g.fill();
   g.strokeStyle='#2d6a94';g.lineWidth=2.5;blob(g,w,h,sr(5),0,9,.28);g.stroke()}
  ,steel(g,w,h,r){shRect(g,w,h);const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,'#e3e7ec');q.addColorStop(.5,'#aeb5bf');q.addColorStop(1,'#7b828d');g.fillStyle=q;g.fillRect(0,0,w,h);
   g.fillStyle='rgba(255,255,255,.55)';g.fillRect(0,0,w,4);g.fillRect(0,0,4,h);g.fillStyle='rgba(20,28,40,.35)';g.fillRect(0,h-5,w,5);g.fillRect(w-5,0,5,h);
   g.strokeStyle='rgba(40,50,64,.55)';g.lineWidth=2;g.strokeRect(11,11,w-22,h-22);g.beginPath();g.moveTo(11,h/2);g.lineTo(w-11,h/2);g.stroke();
   for(const[a,b]of[[6,6],[w-6,6],[6,h-6],[w-6,h-6]]){g.fillStyle='#59616d';g.beginPath();g.arc(a,b,2.8,0,6.283);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(a-.8,b-.8,1,0,6.283);g.fill()}
   g.save();g.beginPath();g.rect(w*.5-18,h*.5-5,36,10);g.clip();g.fillStyle='#f0c32e';g.fillRect(w*.5-18,h*.5-5,36,10);g.fillStyle='#1b1b1b';for(let k=-2;k<4;k++){g.beginPath();g.moveTo(w*.5-18+k*10,h*.5+5);g.lineTo(w*.5-18+k*10+5,h*.5+5);g.lineTo(w*.5-18+k*10+15,h*.5-5);g.lineTo(w*.5-18+k*10+10,h*.5-5);g.fill()}g.restore();
   g.strokeStyle='#454c57';g.lineWidth=3;g.strokeRect(1.5,1.5,w-3,h-3)},
  tree(g,w,h,r){g.fillStyle='rgba(0,0,0,.4)';blob(g,w,h,sr(3),9,14,.1);g.fill();
   const q=g.createRadialGradient(w*.38,h*.35,4,w*.5,h*.5,Math.max(w,h)*.62);q.addColorStop(0,'#4f9a3a');q.addColorStop(1,'#1d4a1c');g.fillStyle=q;blob(g,w,h,sr(3),0,14,.1);g.fill();
   for(let i=0;i<Math.round(w*h/120);i++){const a=r()*6.283,d=Math.sqrt(r())*.42,px=w/2+Math.cos(a)*d*w,py=h/2+Math.sin(a)*d*h,R=4+r()*9;g.fillStyle='hsla('+(85+r()*40)+','+(45+r()*25)+'%,'+(22+r()*26)+'%,.75)';g.beginPath();g.arc(px,py,R,0,6.283);g.fill()}
   g.fillStyle='rgba(210,245,150,.25)';g.beginPath();g.ellipse(w*.36,h*.3,w*.16,h*.1,-.5,0,6.283);g.fill();g.strokeStyle='#123512';g.lineWidth=2.5;blob(g,w,h,sr(3),0,14,.1);g.stroke()},
  asteroid(g,w,h,r){g.fillStyle='rgba(0,0,10,.45)';blob(g,w,h,sr(9),8,11,.22);g.fill();
   const q=g.createLinearGradient(0,0,w,h);q.addColorStop(0,'#8a8397');q.addColorStop(1,'#34303f');g.fillStyle=q;blob(g,w,h,sr(9),0,11,.22);g.fill();
   for(let i=0;i<5;i++){const px=w*(.2+r()*.6),py=h*(.2+r()*.6),R=4+r()*Math.min(w,h)*.12;g.fillStyle='rgba(20,18,28,.5)';g.beginPath();g.ellipse(px,py,R,R*.8,0,0,6.283);g.fill();g.strokeStyle='rgba(210,200,230,.4)';g.lineWidth=1.5;g.beginPath();g.ellipse(px-.8,py-.8,R,R*.8,0,3.4,5.6);g.stroke()}
   g.save();g.shadowColor='rgba(150,130,255,.85)';g.shadowBlur=9;g.strokeStyle='rgba(170,150,255,.65)';g.lineWidth=2;blob(g,w,h,sr(9),0,11,.22);g.stroke();g.restore()},
  storm(g,w,h,r){g.fillStyle='rgba(15,40,90,.32)';for(let i=0;i<Math.round(w*h/260)+6;i++){g.beginPath();g.arc(7+w*(.1+r()*.8),9+h*(.1+r()*.8),10+r()*14,0,6.283);g.fill()}
   const pu=[];for(let i=0;i<Math.round(w*h/230)+8;i++)pu.push([w*(.12+r()*.76),h*(.12+r()*.76),12+r()*16]);
   pu.forEach(p=>{g.fillStyle='#69768e';g.beginPath();g.arc(p[0],p[1]+3,p[2],0,6.283);g.fill()});
   pu.forEach(p=>{const q=g.createRadialGradient(p[0]-p[2]*.3,p[1]-p[2]*.4,1,p[0],p[1],p[2]);q.addColorStop(0,'#f2f6fc');q.addColorStop(1,'#a9b6cb');g.fillStyle=q;g.beginPath();g.arc(p[0],p[1],p[2]*.86,0,6.283);g.fill()});
   g.save();g.shadowColor='#ffe45c';g.shadowBlur=8;g.strokeStyle='#ffe45c';g.lineWidth=2;g.lineJoin='round';g.beginPath();g.moveTo(w*.52,h*.3);g.lineTo(w*.44,h*.52);g.lineTo(w*.54,h*.52);g.lineTo(w*.46,h*.74);g.stroke();g.restore()}
 };
 function obstacle(b,kind){const rs=Layout.rs,key=kind+':'+b.x+','+b.y+','+b.w+','+b.h,ck=key+'@'+rs;let c=OBC.get(ck);
  if(!c){if(OBC.size>60)OBC.clear();c=document.createElement('canvas');c.width=Math.ceil((Math.ceil(b.w)+PAD*2)*rs);c.height=Math.ceil((Math.ceil(b.h)+PAD*2)*rs);const g=c.getContext('2d');g.scale(rs,rs);g.translate(PAD,PAD);let h=0;for(const ch of key)h=(h*31+ch.charCodeAt(0))|0;OBJ[kind](g,b.w,b.h,sr(h));OBC.set(ck,c)}
  x.drawImage(c,b.x-PAD,b.y-PAD,c.width/rs,c.height/rs)}
 function frame(g,l){g.strokeStyle='rgba(230,190,40,.45)';g.lineWidth=6;g.setLineDash([22,16]);g.strokeRect(14,14,W-28,H-28);g.setLineDash([]);
  g.fillStyle='rgba(255,255,255,.06)';g.font='900 90px Impact,"Arial Black",sans-serif';g.textAlign='center';g.fillText('SECTOR '+String(l).padStart(2,'0'),W/2,H/2+30)}
 return{FLOOR,KIND,obstacle,frame}
})();
let floorG='';
function floorFor(l){
 const gMode=(typeof SAVE!=='undefined'&&SAVE.gender==='f')?'f':'m';
 if(floorC&&floorL===l&&floorG===gMode)return floorC;
 const c=document.createElement('canvas'),rs=Layout.rs;c.width=Math.round(W*rs);c.height=Math.round(H*rs);const g=c.getContext('2d');g.scale(rs,rs);
 if(gMode==='f'){
  if(SCENES.female)SCENES.female(g,l,SCENES.rng(l*8191+73));
  BGX.frame(g,l);floorC=c;floorL=l;floorG='f';return c;
 }
 const idx=((l-1)%10)+1;
 if(BGX.FLOOR[idx]){BGX.FLOOR[idx](g,BGX.FLOOR.rng(l*7919+13));BGX.frame(g,l);floorC=c;floorL=l;floorG='m';return c}
 const e=ENV[idx-1]||[350,52,17];
 g.fillStyle='hsl('+e[0]+','+e[1]+'%,'+e[2]+'%)';g.fillRect(0,0,W,H);
 for(let i=0;i<600;i++){g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+rnd(.02,.07)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,4),rnd(1,3))}
 BGX.frame(g,l);floorC=c;floorL=l;floorG='m';return c}
function crate(b){
 if(typeof SAVE!=='undefined'&&SAVE.gender==='f'){
  x.fillStyle='rgba(0,0,0,.5)';x.fillRect(b.x+6,b.y+8,b.w,b.h);
  x.fillStyle='#101826';x.fillRect(b.x,b.y,b.w,b.h);
  x.strokeStyle='rgba(0,240,255,0.7)';x.lineWidth=2;x.strokeRect(b.x+1,b.y+1,b.w-2,b.h-2);
  x.fillStyle='rgba(0,240,255,0.2)';for(let y=b.y+8;y<b.y+b.h-8;y+=9)x.fillRect(b.x+6,y,b.w-12,2);
  x.fillStyle='#39ff7a';x.fillRect(b.x+6,b.y+6,6,3);
  x.fillStyle='#ff007f';x.fillRect(b.x+b.w-12,b.y+6,6,3);
  return;
 }
 const k=BGX.KIND[G&&(((G.lvl-1)%10)+1)];if(k){BGX.obstacle(b,k);return}
 x.fillStyle='rgba(0,0,0,.5)';x.fillRect(b.x+7,b.y+9,b.w,b.h);x.fillStyle='#3a3f33';x.fillRect(b.x,b.y,b.w,b.h);
 x.fillStyle='rgba(255,255,255,.09)';x.fillRect(b.x,b.y,b.w,4);x.fillRect(b.x,b.y,4,b.h);
 x.strokeStyle='#161912';x.lineWidth=3;x.strokeRect(b.x+1.5,b.y+1.5,b.w-3,b.h-3);
 x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=2;x.beginPath();x.moveTo(b.x,b.y);x.lineTo(b.x+b.w,b.y+b.h);x.moveTo(b.x+b.w,b.y);x.lineTo(b.x,b.y+b.h);x.stroke();
 x.fillStyle='rgba(215,185,60,.6)';x.fillRect(b.x+6,b.y+6,12,3)}
/* Ghost only (top-down): a black hooded cloak, a wide-brimmed hat with a blood-red band, and a pale mask with two glowing red eyes on the front of the hat */
function ghostCloak(r,hit){x.fillStyle=hit?'#fff':'#07070a';x.beginPath();x.ellipse(-r*.12,0,r*1.05,r*1.28,0,0,6.283);x.fill();
 x.strokeStyle=hit?'#fff':'#1d1d24';x.lineWidth=1.5;x.beginPath();x.moveTo(-r*.7,-r*.9);x.lineTo(-r*1.05,-r*.2);x.moveTo(-r*.7,r*.9);x.lineTo(-r*1.05,r*.2);x.moveTo(-r*.95,0);x.lineTo(-r*.4,0);x.stroke()}
function ghostHat(r,hit){circ(r*.04,r*.05,r*.86,'rgba(0,0,0,.35)');circ(0,0,r*.84,hit?'#fff':'#0b0b0e');
 x.strokeStyle=hit?'#fff':'#4a4a55';x.lineWidth=2;x.beginPath();x.arc(0,0,r*.84,0,6.283);x.stroke();
 circ(0,0,r*.5,hit?'#fff':'#131318');x.strokeStyle=hit?'#fff':'#9a1020';x.lineWidth=r*.13;x.beginPath();x.arc(0,0,r*.5,0,6.283);x.stroke();circ(-r*.04,0,r*.2,hit?'#fff':'#0a0a0d');
 x.fillStyle=hit?'#fff':'#ece6d6';x.beginPath();x.ellipse(r*.7,0,r*.23,r*.36,0,0,6.283);x.fill();
 x.fillStyle='#111';x.fillRect(r*.62,-r*.02,r*.18,r*.04);
 x.fillStyle='#ff2a2a';x.shadowColor='#ff2a2a';x.shadowBlur=8;x.fillRect(r*.66,-r*.22,r*.1,r*.11);x.fillRect(r*.66,r*.11,r*.1,r*.11);x.shadowBlur=0}
/* SIDE-ON upright figure (Mini Militia style): head, body, two arms, two legs and feet, standing straight and turning left/right with the aim.
   The world stays top-down; only the characters are drawn from the side. The gun arm swings toward the aim angle a. */
function ghA(p){x.globalAlpha=p.gh?.3+.12*Math.sin(T*9):1;if(p.gh){x.strokeStyle='rgba(170,170,255,.55)';x.lineWidth=2;x.beginPath();x.arc(p.x,p.y,p.r*2.1+Math.sin(T*6)*2,0,6.283);x.stroke()}}
function soldier(px,py,r,a,o){
 const s=r*VIS()/12,dir=Math.cos(a)>=0?1:-1,la=Math.atan2(Math.sin(a),Math.cos(a)*dir),t=o.type,P=t==='player',hit=o.flash>0,F=c=>hit?'#fff':c,
  c=BODY[t]||BODY.grunt,body=P?'#0c0c10':c[0],helm=c[1],vest=P?'#15151b':c[2],skin='#d9b48f',
  wide=t==='heavy'?1.35:t==='boss'?1.5:t==='runner'?.85:1,gl=o.gl||((t==='shooter'||t==='elite')?2.3:1.8),L=7+gl*7.5,
  wk=o.mv?Math.sin(T*13+px*.07):0,bob=o.mv?Math.abs(Math.sin(T*13+px*.07))*-1.2:Math.sin(T*2.4+px)*-.4;
 x.fillStyle='rgba(0,0,0,.4)';x.beginPath();x.ellipse(px,py+22*s,11*s*wide,3.2*s,0,0,6.283);x.fill();
 x.save();x.translate(px,py+bob*s);x.scale(s*dir,s);x.lineCap='round';x.lineJoin='round';
 const limb=(x0,y0,x1,y1,x2,y2,w,col)=>{x.strokeStyle=F(col);x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.lineTo(x2,y2);x.stroke()};
 /* legs: thigh + shin swing in a walk cycle; boots at the feet */
 for(const sg of[-1,1]){const sw=wk*.75*sg,k1=Math.sin(sw)*7.5,k2=Math.cos(sw)*7.5,bend=Math.max(0,-sg*wk)*.55,a2=sw-.12-bend,fx=2*sg*.6+k1+Math.sin(a2)*8,fy=6+k2+Math.cos(a2)*8,col=sg<0?'#0f1210':P?'#0a0a0d':c[2];
  limb(sg*1.5,6,sg*1.5+k1,6+k2,sg*1.5+fx-2*sg*.6,Math.min(22,fy),5.2*wide,col);
  x.fillStyle=F('#14170f');x.beginPath();x.ellipse(sg*1.5+fx-2*sg*.6+2.2,Math.min(22,fy)+.6,4.6,2.4,0,0,6.283);x.fill()}
 /* backpack / jetpack */
 if(t==='boss'||t==='elite'||P){x.fillStyle=F('#1a1c22');x.fillRect(-10,-9,5,14);x.fillStyle=F('#3a3d46');x.fillRect(-10,-9,5,3);if(P&&o.mv){x.fillStyle='rgba(255,170,60,.7)';x.beginPath();x.moveTo(-9,5);x.lineTo(-7.5,10+Math.random()*3);x.lineTo(-6,5);x.fill()}}
 if(t==='boss'){x.fillStyle='rgba(120,10,25,.8)';x.beginPath();x.moveTo(-5,-9);x.lineTo(-22,14+Math.sin(T*5)*2);x.lineTo(-4,10);x.fill()}
 /* body: Ghost = black flowing cloak, soldiers = armoured torso with vest and belt */
 if(P&&o.fem){x.fillStyle=F('#2a0f22');x.beginPath();x.ellipse(-5,-12,4.5,10,.15,0,6.283);x.fill();x.fillStyle=F('#07070a');x.beginPath();x.moveTo(-5,-9);x.quadraticCurveTo(-3,-3,-4,1);x.lineTo(-10-(o.mv?3:0),11);x.lineTo(-3,12+Math.sin(T*6)*.8);x.lineTo(1,9);x.lineTo(5,12);x.lineTo(10,10);x.quadraticCurveTo(5,2,6,-1);x.quadraticCurveTo(7,-5,5,-9);x.closePath();x.fill();x.strokeStyle=F('#ff5fb0');x.lineWidth=1;x.stroke();x.fillStyle=F('#1a1a22');x.beginPath();x.ellipse(3.2,-5.6,2.8,2.4,0,0,6.283);x.ellipse(.6,-4.6,2.4,2.2,0,0,6.283);x.fill();x.strokeStyle='rgba(255,120,190,.6)';x.stroke()}
 else if(P){x.fillStyle=F('#07070a');x.beginPath();x.moveTo(-6,-9);x.lineTo(5,-9);x.lineTo(8,10);x.lineTo(5,12+Math.sin(T*6)*.8);x.lineTo(1,9);x.lineTo(-3,12);x.lineTo(-9-(o.mv?3:0),10);x.closePath();x.fill();
  x.strokeStyle=F('#23232c');x.lineWidth=1.2;x.stroke();x.beginPath();x.moveTo(-1,-8);x.lineTo(-1,9);x.stroke()}
 else{x.fillStyle=F(body);x.beginPath();x.roundRect(-6*wide,-9,12*wide,17,3);x.fill();x.fillStyle=F(vest);x.beginPath();x.roundRect(-4*wide,-8,9*wide,11,2);x.fill();
  x.fillStyle=F('#0d0f0b');x.fillRect(-6*wide,5,12*wide,2.5);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(1,-7,1.6,10);
  if(t==='heavy'||t==='boss'){x.fillStyle=F('#4a4f55');x.beginPath();x.arc(-1,-9,5.5,Math.PI,0);x.fill();x.fillRect(-7,-9,12,2)}
  if(o.col){x.fillStyle=F(o.col);x.fillRect(-6*wide,-4,3,3)}}
 /* head + headgear */
 if(P){x.fillStyle=F('#0b0b0e');x.beginPath();x.arc(-1,-15,7.2,0,6.283);x.fill();   // hood
  x.fillStyle=F(o.fem?'#f6e4de':'#ece6d6');x.beginPath();x.ellipse(2,-14.5,4.6,5.6,0,0,6.283);x.fill();if(o.fem){x.fillStyle='#ff5fb0';x.fillRect(2.5,-11,3,1.2)}   // pale mask
  x.fillStyle='#111';x.fillRect(2.5,-10.5,3,.9);x.fillStyle=F('#ff2a2a');x.shadowColor='#ff2a2a';x.shadowBlur=7;x.beginPath();x.moveTo(1,-17);x.lineTo(6,-15.6);x.lineTo(2.6,-13.6);x.closePath();x.fill();x.shadowBlur=0;
  x.fillStyle=F('#0b0b0e');x.beginPath();x.moveTo(-6,-20);x.quadraticCurveTo(-1,-31,5,-20);x.closePath();x.fill();   // crown
  x.fillStyle=F('#9a1020');x.fillRect(-6,-21.6,11.4,2.6);
  x.fillStyle=F('#0b0b0e');x.beginPath();x.ellipse(0,-19.6,11.5,2.4,0,0,6.283);x.fill();x.strokeStyle=F('#4a4a55');x.lineWidth=.8;x.stroke()}
 else{x.fillStyle=F(skin);x.beginPath();x.arc(1,-15,6,0,6.283);x.fill();
  x.fillStyle=F(helm);x.beginPath();x.arc(0,-16,7,Math.PI,0);x.lineTo(7.4,-15);x.lineTo(-7,-15);x.fill();
  x.fillStyle='rgba(255,255,255,.2)';x.beginPath();x.arc(0,-16,5.2,Math.PI*1.1,Math.PI*1.55);x.lineTo(0,-16);x.fill();
  const vc=(t==='elite'||t==='boss')?'#ff3040':t==='heavy'?'#a02020':'#1a1d22';x.fillStyle=F(vc);if(t==='elite'||t==='boss'){x.shadowColor=vc;x.shadowBlur=8}
  x.fillRect(1.5,-16.2,5.6,2.6);x.shadowBlur=0;if(t==='runner'){x.fillStyle=F('#ffd93d');x.fillRect(-6,-17.6,13,2)}
  x.fillStyle='rgba(0,0,0,.5)';x.fillRect(2.5,-11.2,3.4,.9)}
 /* arms: off-hand supports the gun, gun hand holds the grip; the gun points at the aim angle */
 const sx=1,sy=-6.5,ca=Math.cos(la),sa=Math.sin(la),armc=P?'#0c0c10':body,hand=P?'#ece6d6':skin;
 limb(sx-2,sy+1,sx+ca*(L*.55+2)-1,sy+sa*(L*.55+2)+3,sx+ca*(L*.55+4),sy+sa*(L*.55+4),4.2*wide,armc);x.fillStyle=F(hand);x.beginPath();x.arc(sx+ca*(L*.55+4),sy+sa*(L*.55+4),2.2,0,6.283);x.fill();
 x.save();x.translate(sx,sy);x.rotate(la);
 x.fillStyle=F(o.gp?'#ff5fb0':'#101318');x.fillRect(0,-2.3,L,4.6);x.fillRect(L*.55,-.6,5,4.8);x.fillStyle=F(o.gc||'#555a60');x.fillRect(L*.3,-2.3,L*.3,1.3);x.fillStyle=F('#0a0b0e');x.fillRect(L,-1.2,4,2.4);
 if(o.mf>0){const m=L+5;x.fillStyle='#ffe9a0';x.beginPath();x.moveTo(m,0);for(let i=0;i<8;i++){const g=i*.785,rd=i%2?3:8;x.lineTo(m+Math.cos(g)*rd,Math.sin(g)*rd)}x.closePath();x.fill()}
 if(t==='shooter'||t==='elite'){x.strokeStyle='rgba(255,40,40,.28)';x.lineWidth=.8;x.beginPath();x.moveTo(L+4,0);x.lineTo(L+70,0);x.stroke()}
 x.restore();
 limb(sx-1,sy,sx+ca*5.5,sy+sa*5.5+3,sx+ca*9,sy+sa*9,4.4*wide,armc);x.fillStyle=F(hand);x.beginPath();x.arc(sx+ca*9,sy+sa*9,2.4,0,6.283);x.fill();
 x.restore()}
function draw(){x.setTransform(Layout.rs,0,0,Layout.rs,0,0);x.clearRect(0,0,W,H);if(!G)return;const p=G.p;
 x.save();if(G.shake>0)x.translate(rnd(-5,5)*G.shake*2,rnd(-5,5)*G.shake*2);
 x.drawImage(floorFor(G.lvl),0,0,W,H);
 for(const d of G.decals){const g=x.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.beginPath();x.arc(d.x,d.y,d.r,0,6.283);x.fill()}
 for(const b of OBS.slice(0,Math.min(5,2+(G.lvl>>1))))crate(b);
 for(const k of G.pk){const c={a:'#d9b640',h:'#e8e8e8',b:'#7e8f5a',s:'#4aa3d9'}[k.k],by=k.y+Math.sin(T*4+k.x)*2;
  x.strokeStyle=c;x.globalAlpha=.4+.3*Math.sin(T*6);x.lineWidth=2;x.beginPath();x.arc(k.x,by,17,0,6.283);x.stroke();x.globalAlpha=1;
  x.fillStyle='#1b1f19';x.fillRect(k.x-10,by-8,20,16);x.fillStyle=c;x.fillRect(k.x-8,by-6,16,12);x.fillStyle='#111';x.font='bold 11px "Courier New",monospace';x.textAlign='center';x.fillText({a:'A',h:'+',b:'G',s:'S'}[k.k],k.x,by+4)}
 for(const e of G.enemies){const a=p.gh?(e.wa!==undefined?e.wa:0):Math.atan2(p.y-e.y,p.x-e.x);soldier(e.x,e.y,e.r,a,{type:e.type,flash:e.flash,mv:1,col:e.t.col});
  if(e.shield){x.strokeStyle='#6fd3ff';x.lineWidth=3;x.shadowColor='#6fd3ff';x.shadowBlur=14;x.beginPath();x.arc(e.x,e.y,e.r+8+Math.sin(T*10)*2,0,6.283);x.stroke();x.shadowBlur=0}
  if((e.hp<e.max||SAVE.perks.scan)&&!e.boss){x.fillStyle='rgba(0,0,0,.6)';{const R=e.r*VIS();x.fillRect(e.x-R,e.y-R*2.4-8,R*2,4);x.fillStyle='#d9473a';x.fillRect(e.x-R,e.y-R*2.4-8,R*2*Math.max(0,e.hp/e.max),4)}}}
 for(const b of G.bombs){
  if(b.planted){
   x.fillStyle='#111';x.fillRect(b.x-10,b.y-10,20,20);
   x.strokeStyle='#ffd54f';x.lineWidth=2;x.strokeRect(b.x-9,b.y-9,18,18);
   circ(b.x,b.y,6,Math.floor(b.t*12)%2?'#ff2233':'#39ff7a');
   x.fillStyle='#fff';x.font='bold 9px monospace';x.textAlign='center';
   x.fillText(Math.max(0,b.t).toFixed(1),b.x,b.y+15);
  }else{
   circ(b.x,b.y,9,'#4b5538');circ(b.x,b.y,4,'#2a3020');x.strokeStyle=Math.floor(b.t*10)%2?'#ff3b3b':'#d9b640';x.lineWidth=2;x.beginPath();x.arc(b.x,b.y,9+Math.sin(T*30),0,6.283);x.stroke();
  }
 }
 x.lineCap='round';
 for(const b of G.bul){x.strokeStyle='rgba(255,170,60,.45)';x.lineWidth=5;x.beginPath();x.moveTo(b.x-b.vx*.05,b.y-b.vy*.05);x.lineTo(b.x,b.y);x.stroke();x.strokeStyle='#fff3c0';x.lineWidth=2;x.beginPath();x.moveTo(b.x-b.vx*.03,b.y-b.vy*.03);x.lineTo(b.x,b.y);x.stroke()}
 for(const b of G.eb){x.strokeStyle='rgba(255,70,40,.9)';x.lineWidth=3;x.beginPath();x.moveTo(b.x-b.vx*.04,b.y-b.vy*.04);x.lineTo(b.x,b.y);x.stroke()}
 for(const f of G.fx){
  if(f.ring){const t=1-f.life/f.max,R=Math.max(1,f.R*t),g=x.createRadialGradient(f.x,f.y,0,f.x,f.y,R);g.addColorStop(0,'rgba(255,230,150,'+(1-t)*.9+')');g.addColorStop(.5,'rgba(255,120,30,'+(1-t)*.6+')');g.addColorStop(1,'rgba(40,20,10,0)');
   x.fillStyle=g;x.beginPath();x.arc(f.x,f.y,R,0,6.283);x.fill();x.strokeStyle='rgba(255,255,255,'+(1-t)*.5+')';x.lineWidth=3;x.beginPath();x.arc(f.x,f.y,R,0,6.283);x.stroke()}
  else if(f.mg){x.save();x.translate(f.x,f.y);x.rotate(f.rot+T*6);x.globalAlpha=Math.min(1,f.life*2);x.fillStyle='#1a1d22';x.fillRect(-3,-5,6,10);x.strokeStyle='#d9b640';x.lineWidth=1;x.strokeRect(-3,-5,6,10);x.restore();x.globalAlpha=1}
  else if(f.sm){const t=1-f.life/f.max;x.globalAlpha=(1-t)*.5;circ(f.x,f.y,f.r*(1+t*1.5),'#2a2a2a');x.globalAlpha=1}
  else{x.globalAlpha=Math.min(1,f.life*2.5);x.strokeStyle=f.col;x.lineWidth=f.big?3:1.5;x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.x-f.vx*.04,f.y-f.vy*.04);x.stroke();x.globalAlpha=1}}
 ghA(p);soldier(p.x,p.y,p.r,p.a,{type:'player',fem:SAVE.gender==='f',gp:SAVE.gender==='f'&&p.gun==='pistol',mv:p.mv,flash:p.hurt>.15?1:0,mf:p.mf,gl:GUNLEN[p.gun],gc:WEAPONS[p.gun]&&WEAPONS[p.gun].col});x.globalAlpha=1;
 if(p.sh>0){x.strokeStyle='#4aa3d9';x.lineWidth=2;x.shadowColor='#4aa3d9';x.shadowBlur=12;x.beginPath();x.arc(p.x,p.y,p.r+8+Math.sin(T*12),0,6.283);x.stroke();x.shadowBlur=0}
 if(G.hitT>0){x.strokeStyle='rgba(255,40,40,'+Math.min(1,G.hitT)+')';x.lineWidth=10;x.beginPath();x.arc(p.x,p.y,50,G.hitA-.5,G.hitA+.5);x.stroke()}
 {const nm=SAVE.name||'GHOST',ty=Math.max(24,p.y-p.r*VIS()*2.6-4);x.font='700 12px "Courier New",monospace';x.textAlign='center';x.lineWidth=3;x.strokeStyle='rgba(0,0,0,.8)';x.strokeText(nm,p.x,ty);x.fillStyle='#e8f0e0';x.fillText(nm,p.x,ty)}
 x.restore();
 /* lighting: darkness with a flashlight cone, muzzle flash and explosion light */
 if(!lightC){lightC=document.createElement('canvas');lightC.width=W;lightC.height=H}
 const L=lightC.getContext('2d');L.globalCompositeOperation='source-over';L.clearRect(0,0,W,H);L.fillStyle='rgba(2,4,8,'+DARK[(G.lvl-1)%10]+')';L.fillRect(0,0,W,H);L.globalCompositeOperation='destination-out';
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
 ghA(p);soldier(p.x,p.y,p.r,p.a,{type:'player',fem:SAVE.gender==='f',gp:SAVE.gender==='f'&&p.gun==='pistol',mv:p.mv,flash:p.hurt>.15?1:0,mf:p.mf,gl:GUNLEN[p.gun],gc:WEAPONS[p.gun]&&WEAPONS[p.gun].col});x.globalAlpha=1;
 const v=x.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*.9);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');x.fillStyle=v;x.fillRect(0,0,W,H);
 if(p.hurt>0){x.fillStyle='rgba(200,20,30,'+Math.min(.3,p.hurt)+')';x.fillRect(0,0,W,H)}
 if(G.flash>0){x.fillStyle='rgba(255,235,190,'+Math.min(.45,G.flash*1.8)+')';x.fillRect(0,0,W,H)}
 hudCanvas(p);crosshair(p);if(DESK.auto||TouchUI.auto){x.font='700 10px "Courier New",monospace';x.textAlign='center';x.fillStyle='#39ff7a';x.fillText('AUTO',M.x,M.y+28)}
}
function crosshair(p){const cx=M.x,cy=M.y,sp=(p.cd>0?7:0)+(p.rel>0?9:0);x.strokeStyle='rgba(235,240,230,.9)';x.lineWidth=2;x.lineCap='butt';
 for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){x.beginPath();x.moveTo(cx+a*(6+sp),cy+b*(6+sp));x.lineTo(cx+a*(14+sp),cy+b*(14+sp));x.stroke()}circ(cx,cy,1.5,'#fff');if(p.rel>0&&p.rt){x.strokeStyle='#39ff7a';x.lineWidth=3;x.beginPath();x.arc(cx,cy,22,-1.571,-1.571+6.283*(1-p.rel/p.rt));x.stroke()}
 const mk=(col,s,t)=>{x.strokeStyle=col;x.lineWidth=t;for(const[a,b]of[[1,1],[-1,1],[1,-1],[-1,-1]]){x.beginPath();x.moveTo(cx+a*5,cy+b*5);x.lineTo(cx+a*s,cy+b*s);x.stroke()}};
 if(G.hm>0)mk('#fff',12,2.5);if(G.kt>0)mk('#ff3b3b',16,3.5)}
function hudCanvas(p){x.textBaseline='alphabetic';const hs=Math.min(HSCALE(),Math.max(.7,(W-Layout.inL-Layout.inR)/548));
 const hp=Math.max(0,p.hp/CFG.hp),big='900 34px Impact,"Arial Black",sans-serif',mono='11px "Courier New",monospace';
 x.save();x.translate(Layout.inL,H);x.scale(hs,hs);x.translate(0,-H);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(14,H-70,250,58);x.textAlign='left';x.fillStyle='#e6ecdc';x.font=big;x.fillText(Math.ceil(Math.max(0,p.hp)),24,H-22);
 x.font=mono;x.fillStyle='#9aa593';x.fillText('HEALTH'+(p.sh>0?'  +ARMOR':''),24,H-54);
 for(let i=0;i<10;i++){x.fillStyle=i<Math.ceil(hp*10)?(hp<.3?'#e0443a':'#d9e0cf'):'rgba(255,255,255,.12)';x.fillRect(96+i*15,H-42,11,18)}
 x.restore();
 x.save();x.translate(W-Layout.inR,H);x.scale(hs,hs);x.translate(-W,-H);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(W-264,H-84,250,72);gunSprite(x,p.gun||'pistol',W-258,H-82,66,24);x.textAlign='right';x.fillStyle=p.mag<=3?'#e0443a':'#f1f5ea';x.font='900 52px Impact,"Arial Black",sans-serif';x.fillText(p.mag,W-100,H-30);
 x.font='900 24px Impact,"Arial Black",sans-serif';x.fillStyle='#aeb7a4';x.fillText('/ '+p.reserve,W-24,H-30);x.font=mono;x.fillStyle='#9aa593';x.fillText(gun().name+'  |  '+(p.rel>0?'RELOADING':'READY'),W-24,H-72);
 for(let i=0;i<p.bombs;i++)circ(W-250+i*16,H-20,5,'#8a9a6a');
 x.textAlign='left';x.font='11px "Courier New",monospace';x.fillStyle='#9aa593';x.fillText('x'+p.bombs,W-250+Math.max(p.bombs,1)*16+2,H-16);
 if(p.rel>0&&p.rt){x.fillStyle='rgba(255,255,255,.15)';x.fillRect(W-244,H-16,150,3);x.fillStyle='#fff';x.fillRect(W-244,H-16,150*(1-p.rel/p.rt),3)}
 x.restore();
 x.save();x.translate(W/2,Layout.st);x.scale(hs,hs);x.translate(-W/2,0);const left=(G.total-G.spawned)+G.enemies.length;x.textAlign='center';x.fillStyle='#eef2e8';x.font='900 18px Impact,"Arial Black",sans-serif';
 x.fillText(G.boss?'ELIMINATE THE COMMANDER':'HOSTILES REMAINING  '+left,W/2,26);x.font=mono;x.fillStyle='#9aa593';x.fillText((G.boss?'':'WAVE '+G.wave+'/'+G.waves+'   |   ')+'SCORE '+score+'   |   KILLS '+kills,W/2,44);
 if(G.combo>1&&G.comboT>0){x.fillStyle='#ffd54f';x.font='900 22px Impact,"Arial Black",sans-serif';x.fillText(['DOUBLE KILL','TRIPLE KILL','MULTI KILL'][Math.min(G.combo,4)-2],W/2,74)}
 if(G.boss&&G.enemies.includes(G.boss)){x.fillStyle='rgba(0,0,0,.6)';x.fillRect(W/2-210,84,420,10);x.fillStyle='#c0392b';x.fillRect(W/2-210,84,420*Math.max(0,G.boss.hp/G.boss.max),10);x.fillStyle='#eee';x.font=mono;x.fillText('THE COMMANDER  -  PHASE '+G.boss.ph,W/2,110)}
 x.restore();
 x.save();x.translate(W-Layout.sr,Layout.st);x.scale(hs,hs);x.translate(-W,0);x.textAlign='right';x.font='12px "Courier New",monospace';G.feed.forEach((f,i)=>{x.globalAlpha=Math.min(1,f.life);x.fillStyle='#d6dccb';x.fillText(f.txt,W-16,(G.boss?132:100)+i*18)});x.globalAlpha=1;x.restore();
 x.save();x.translate(Layout.sl,Layout.st);x.scale(hs,hs);const mx=82,my=88,R=62,s=.13;x.save();x.beginPath();x.arc(mx,my,R,0,6.283);x.clip();x.fillStyle='rgba(6,14,9,.7)';x.fillRect(mx-R,my-R,R*2,R*2);
 x.strokeStyle='rgba(120,200,140,.18)';x.lineWidth=1;x.beginPath();x.arc(mx,my,R/2,0,6.283);x.moveTo(mx-R,my);x.lineTo(mx+R,my);x.moveTo(mx,my-R);x.lineTo(mx,my+R);x.stroke();
 x.fillStyle='rgba(120,130,110,.5)';for(const b of OBS.slice(0,Math.min(5,2+(G.lvl>>1))))x.fillRect(mx+(b.x-p.x)*s,my+(b.y-p.y)*s,b.w*s,b.h*s);
 for(const e of G.enemies){let dx=(e.x-p.x)*s,dy=(e.y-p.y)*s;const d=Math.hypot(dx,dy);if(d>R-4){dx*=(R-4)/d;dy*=(R-4)/d}circ(mx+dx,my+dy,e.boss?4:2.6,'#ff4040')}
 x.translate(mx,my);x.rotate(p.a);x.fillStyle='#6cf08a';x.beginPath();x.moveTo(7,0);x.lineTo(-5,-4.5);x.lineTo(-5,4.5);x.closePath();x.fill();x.restore();
 x.strokeStyle='rgba(180,220,190,.6)';x.lineWidth=2;x.beginPath();x.arc(mx,my,R,0,6.283);x.stroke();x.restore()}