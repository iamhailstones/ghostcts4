"use strict";
/* scenes.js - the ten battlefield environments (one per sector). Each one is painted ONCE into a cached canvas by floorFor() in render.js.
   Every scene reads the current battlefield size (W x H), so it always covers the whole screen with no seams or gaps, and uses a seeded random
   generator, so the same sector always looks the same (it never "re-rolls" when the phone is rotated or the window is resized).
   The in-game darkness / flashlight lighting is applied on top of these in draw(), so the original dark military mood stays.
   Obstacles (rocks, doors, trees ...) are unchanged and still match their sector: 1 river + rocks, 2 lab + stone blocks, 3 desert + sandboxes,
   4 BLACKOUT ash tiles + glowing orbs, 5 night road + garden beds, 6 aurora ice + ice blocks, 7 hangar + steel crates, 8 jungle + trees, 9 nebula + asteroids, 10 storm sky + clouds. */
const SCENES=(()=>{
 const TAU=6.2832;
 const rng=seed=>{let s=(seed|0)||1;return(a,b)=>{s=(Math.imul(s,1664525)+1013904223)|0;return a+((s>>>0)/4294967296)*(b-a)}};
 const rgba=(c,a)=>'rgba('+c+','+a+')';
 /* soft round light / shadow blob */
 const glow=(g,px,py,R,c,a)=>{const q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,rgba(c,a));q.addColorStop(1,rgba(c,0));g.fillStyle=q;g.fillRect(px-R,py-R,R*2,R*2)};
 const add=(g,fn)=>{g.save();g.globalCompositeOperation='lighter';fn();g.restore()};
 const specks=(g,rnd,n,cols,s0,s1,a0,a1)=>{for(let i=0;i<n;i++){g.fillStyle=rgba(cols[(rnd(0,cols.length))|0],rnd(a0,a1));const s=rnd(s0,s1);g.fillRect(rnd(0,W),rnd(0,H),s,s)}};
 const vignette=(g,a)=>{const v=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,'+a+')');g.fillStyle=v;g.fillRect(0,0,W,H)};
 /* irregular band along the top (dir=1) or bottom (dir=-1) edge: river banks, grass verges */
 const band=(g,rnd,dir,th,jit,fill,edge)=>{const y0=dir>0?0:H,ph=rnd(0,6);g.beginPath();g.moveTo(0,y0);
  for(let px=0;px<=W;px+=14){const d=th+Math.sin(px*.011+ph)*jit+Math.sin(px*.037+ph*2)*jit*.45;g.lineTo(px,y0+dir*d)}
  g.lineTo(W,y0);g.closePath();g.fillStyle=fill;g.fill();
  if(edge){g.strokeStyle=edge;g.lineWidth=3;g.beginPath();for(let px=0;px<=W;px+=14){const d=th+Math.sin(px*.011+ph)*jit+Math.sin(px*.037+ph*2)*jit*.45;px?g.lineTo(px,y0+dir*d):g.moveTo(px,y0+dir*d)}g.stroke()}};
 const grassTufts=(g,rnd,y0,y1,n,h0,h1,hue0,hue1)=>{g.lineCap='round';for(let i=0;i<n;i++){const px=rnd(0,W),py=rnd(y0,y1),hh=rnd(h0,h1);g.strokeStyle='hsl('+rnd(hue0,hue1)+','+rnd(35,60)+'%,'+rnd(18,36)+'%)';g.lineWidth=1.4;g.beginPath();g.moveTo(px,py);g.lineTo(px+rnd(-3,3),py-hh);g.stroke()}};
 const crack=(g,rnd,px,py,len,col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.lineJoin='round';g.beginPath();g.moveTo(px,py);let a=rnd(0,TAU);for(let k=0;k<len;k++){a+=rnd(-.8,.8);px+=Math.cos(a)*rnd(8,20);py+=Math.sin(a)*rnd(8,20);g.lineTo(px,py)}g.stroke()};
 const hazard=(g,px,py,w,h,a,cA,cB)=>{g.save();g.beginPath();g.rect(px,py,w,h);g.clip();g.fillStyle=rgba(cA,a);g.fillRect(px,py,w,h);g.fillStyle=rgba(cB,a);for(let k=-h;k<w+h;k+=h*1.4){g.beginPath();g.moveTo(px+k,py+h);g.lineTo(px+k+h*.7,py+h);g.lineTo(px+k+h*1.7,py);g.lineTo(px+k+h,py);g.fill()}g.restore()};
 const fireflies=(g,rnd,n,c)=>{add(g,()=>{for(let i=0;i<n;i++){const px=rnd(0,W),py=rnd(0,H);glow(g,px,py,rnd(9,20),c,rnd(.3,.6));g.fillStyle=rgba('255,255,220',.9);g.fillRect(px-1,py-1,2,2)}})};
 return{
  rng,
  /* 1 - MIDNIGHT RIVER OUTPOST: murky teal water, mud banks with reeds, lily pads, moon glitter, fireflies */
  1(g,rnd){
   const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#0f6a6e');gr.addColorStop(.5,'#0a4d58');gr.addColorStop(1,'#0a3552');g.fillStyle=gr;g.fillRect(0,0,W,H);
   for(let i=0;i<Math.round(W*H/9000);i++)glow(g,rnd(0,W),rnd(0,H),rnd(70,190),rnd(0,1)<.55?'30,130,84':'3,22,40',rnd(.14,.32));
   g.lineCap='round';for(let i=0;i<Math.round(W*H/3600);i++){const px=rnd(0,W),py=rnd(0,H),w=rnd(30,110),ph=rnd(0,6);g.strokeStyle=rgba('190,240,255',rnd(.05,.18));g.lineWidth=rnd(1,2.4);g.beginPath();for(let k=0;k<=w;k+=5){const yy=py+Math.sin(k*.14+ph)*3.5;k?g.lineTo(px+k,yy):g.moveTo(px,yy)}g.stroke()}
   for(let i=0;i<14;i++){const px=rnd(0,W),py=rnd(110,H-110);for(let k=1;k<=3;k++){g.strokeStyle=rgba('200,245,255',.16-k*.03);g.lineWidth=1.3;g.beginPath();g.ellipse(px,py,k*9,k*4.5,0,0,TAU);g.stroke()}}
   for(let i=0;i<Math.round(W/38);i++){const px=rnd(0,W),py=rnd(90,H-90),r=rnd(9,17);g.fillStyle='#1f7a3d';g.beginPath();g.arc(px,py,r,.35,TAU-.1);g.lineTo(px,py);g.fill();g.fillStyle=rgba('180,255,150',.22);g.beginPath();g.arc(px-2,py-2,r*.6,0,TAU);g.fill()}
   band(g,rnd,1,78,16,'#4a3a28','rgba(170,235,230,.45)');band(g,rnd,-1,78,16,'#463625','rgba(170,235,230,.45)');
   for(const dir of[1,-1]){const y0=dir>0?0:H;for(let i=0;i<Math.round(W/3);i++){g.fillStyle=rgba(rnd(0,1)<.5?'20,12,6':'120,95,60',rnd(.08,.3));g.fillRect(rnd(0,W),y0+dir*rnd(0,60),rnd(2,6),rnd(1,4))}
    grassTufts(g,rnd,dir>0?6:H-60,dir>0?60:H-6,Math.round(W/1.6),8,20,78,125)}
   g.lineWidth=2;for(let i=0;i<Math.round(W/55);i++){const px=rnd(0,W),dir=rnd(0,1)<.5?1:-1,py=dir>0?rnd(50,86):H-rnd(50,86);g.strokeStyle='#2d5a2a';g.beginPath();g.moveTo(px,py);g.lineTo(px+rnd(-4,4),py-dir*rnd(22,40));g.stroke();g.fillStyle='#6b4423';g.fillRect(px-2,py-dir*rnd(34,46),4,8)}
   add(g,()=>{const sh=g.createLinearGradient(W*.1,0,W*.7,H);sh.addColorStop(0,'rgba(120,230,255,0)');sh.addColorStop(.5,'rgba(120,230,255,.16)');sh.addColorStop(1,'rgba(120,230,255,0)');g.fillStyle=sh;g.fillRect(0,0,W,H);for(let i=0;i<Math.round(W*H/5000);i++){g.fillStyle=rgba('220,250,255',rnd(.1,.4));g.fillRect(rnd(0,W),rnd(0,H),rnd(1,3),1.5)}});
   fireflies(g,rnd,Math.round(W/45),'190,255,90');vignette(g,.35)},
  /* 2 - NEON RESEARCH LAB: glossy dark tiles, glowing cyan / magenta light strips, hazard stripes, vents */
  2(g,rnd){const T=75;g.fillStyle='#1b2634';g.fillRect(0,0,W,H);
   for(let ty=0;ty<H;ty+=T)for(let tx=0;tx<W;tx+=T){g.fillStyle=rnd(0,1)<.5?rgba('120,170,220',rnd(0,.07)):rgba('0,0,0',rnd(0,.14));g.fillRect(tx,ty,T,T)}
   g.lineWidth=2;for(let i=0;i<=W;i+=T){g.strokeStyle='rgba(5,10,18,.7)';g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.strokeStyle='rgba(120,170,220,.12)';g.beginPath();g.moveTo(i+2,0);g.lineTo(i+2,H);g.stroke()}
   for(let i=0;i<=H;i+=T){g.strokeStyle='rgba(5,10,18,.7)';g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();g.strokeStyle='rgba(120,170,220,.12)';g.beginPath();g.moveTo(0,i+2);g.lineTo(W,i+2);g.stroke()}
   specks(g,rnd,Math.round(W*H/2200),['200,220,255','0,0,0'],1,3,.03,.1);
   for(let i=0;i<9;i++)glow(g,rnd(0,W),rnd(0,H),rnd(50,110),'0,0,0',rnd(.18,.34));
   const strips=Math.round(W/150)+3;for(let i=0;i<strips;i++){const vert=rnd(0,1)<.5,cy=rnd(0,1)<.6?'40,225,255':'255,50,170',len=rnd(150,380),px=Math.round(rnd(1,W/T-1))*T+1,py=Math.round(rnd(1,H/T-1))*T+1;
    add(g,()=>{g.shadowColor='rgb('+cy+')';g.shadowBlur=14;g.strokeStyle='rgba('+cy+',.85)';g.lineWidth=3;g.beginPath();g.moveTo(px,py);vert?g.lineTo(px,py+len):g.lineTo(px+len,py);g.stroke();glow(g,vert?px:px+len/2,vert?py+len/2:py,120,cy,.12)})}
   hazard(g,0,H-26,W,18,.5,'235,190,30','12,12,16');hazard(g,0,8,W,18,.5,'235,190,30','12,12,16');
   for(let i=0;i<Math.round(W/260);i++){const px=rnd(40,W-110),py=rnd(110,H-110);g.fillStyle='#0a0f16';g.fillRect(px,py,64,40);g.fillStyle='#2a3a4c';for(let k=0;k<6;k++)g.fillRect(px+4,py+4+k*6,56,2.5);g.strokeStyle='rgba(60,225,255,.5)';g.strokeRect(px+.5,py+.5,64,40)}
   add(g,()=>{const rx=W*.18,ry=H*.72;g.shadowColor='#2be0ff';g.shadowBlur=12;g.strokeStyle='rgba(60,225,255,.6)';g.lineWidth=2;for(const r of[44,64]){g.beginPath();g.arc(rx,ry,r,0,TAU);g.stroke()}g.setLineDash([6,9]);g.beginPath();g.arc(rx,ry,84,0,TAU);g.stroke();g.setLineDash([]);glow(g,rx,ry,110,'40,225,255',.16)});
   const gl=g.createLinearGradient(0,0,W,H);gl.addColorStop(0,'rgba(255,255,255,.07)');gl.addColorStop(.5,'rgba(255,255,255,0)');gl.addColorStop(1,'rgba(255,255,255,.05)');g.fillStyle=gl;g.fillRect(0,0,W,H);vignette(g,.4)},
  /* 3 - DESERT CANYON AT DUSK: golden sand, violet dune shadows, cracked earth, tyre tracks, dry bushes, low sun glow */
  3(g,rnd){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#e6a55a');gr.addColorStop(.55,'#c5763f');gr.addColorStop(1,'#8c4a3e');g.fillStyle=gr;g.fillRect(0,0,W,H);
   for(let i=0;i<Math.round(H/60);i++){const by=rnd(0,H),amp=rnd(16,40),f=rnd(.004,.009),ph=rnd(0,6),th=rnd(50,90);g.beginPath();g.moveTo(0,by);for(let px=0;px<=W;px+=15)g.lineTo(px,by+Math.sin(px*f+ph)*amp);for(let px=W;px>=0;px-=15)g.lineTo(px,by+th+Math.sin(px*f+ph)*amp);g.closePath();g.fillStyle=i%2?'rgba(255,225,150,.16)':'rgba(70,35,110,.2)';g.fill()}
   g.lineCap='round';for(let i=0;i<Math.round(W*H/2400);i++){const px=rnd(0,W),py=rnd(0,H),w=rnd(14,46);g.strokeStyle=rgba(rnd(0,1)<.5?'255,236,190':'90,45,30',rnd(.06,.16));g.lineWidth=rnd(1,2);g.beginPath();g.moveTo(px,py);g.quadraticCurveTo(px+w/2,py-rnd(2,6),px+w,py);g.stroke()}
   for(let i=0;i<Math.round(W/110);i++)crack(g,rnd,rnd(0,W),rnd(0,H),rnd(4,9),'rgba(60,25,15,.38)',1.3);
   for(const off of[-9,9]){g.strokeStyle='rgba(60,30,20,.3)';g.lineWidth=5;g.beginPath();g.moveTo(-20,H*.82+off);g.bezierCurveTo(W*.3,H*.5+off,W*.55,H*.95+off,W+20,H*.4+off);g.stroke()}
   specks(g,rnd,Math.round(W*H/700),['110,60,30','255,244,214'],1,2.5,.06,.2);
   for(let i=0;i<Math.round(W/55);i++){const px=rnd(0,W),py=rnd(0,H),r=rnd(2,6);g.fillStyle='rgba(30,10,30,.25)';g.beginPath();g.ellipse(px+4,py+3,r*1.4,r*.8,-.4,0,TAU);g.fill();g.fillStyle='#8b6a4c';g.beginPath();g.ellipse(px,py,r,r*.7,0,0,TAU);g.fill()}
   for(let i=0;i<Math.round(W/130);i++){const px=rnd(20,W-20),py=rnd(20,H-20);g.strokeStyle='#5a3a22';g.lineWidth=1.5;for(let k=0;k<9;k++){const a=rnd(0,TAU),l=rnd(7,15);g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);g.stroke()}}
   add(g,()=>{glow(g,W*.1,H*.12,Math.max(W,H)*.55,'255,190,90',.34);glow(g,W*.95,H*.98,Math.max(W,H)*.4,'150,60,200',.16)});vignette(g,.38)},
  /* 4 - BLACKOUT: cold ash-grey tiled floor - soot, drifting ash, cracked and chipped tiles, scorch marks (the orbs supply the light) */
  4(g,rnd){const T=80;g.fillStyle='#7c7e82';g.fillRect(0,0,W,H);
   for(let ty=0;ty<H;ty+=T)for(let tx=0;tx<W;tx+=T){g.fillStyle='hsl(215,4%,'+rnd(40,54)+'%)';g.fillRect(tx,ty,T,T);
    const q=g.createLinearGradient(tx,ty,tx+T,ty+T);q.addColorStop(0,'rgba(255,255,255,.12)');q.addColorStop(.5,'rgba(255,255,255,0)');q.addColorStop(1,'rgba(0,0,0,.14)');g.fillStyle=q;g.fillRect(tx,ty,T,T);
    if(rnd(0,1)<.22){g.fillStyle=rgba('0,0,0',rnd(.05,.13));g.fillRect(tx,ty,T,T)}}
   g.lineWidth=3;for(let i=0;i<=W;i+=T){g.strokeStyle='rgba(18,19,22,.75)';g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.strokeStyle='rgba(255,255,255,.14)';g.beginPath();g.moveTo(i+2.5,0);g.lineTo(i+2.5,H);g.stroke()}
   for(let i=0;i<=H;i+=T){g.strokeStyle='rgba(18,19,22,.75)';g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();g.strokeStyle='rgba(255,255,255,.14)';g.beginPath();g.moveTo(0,i+2.5);g.lineTo(W,i+2.5);g.stroke()}
   for(let i=0;i<Math.round(W*H/16000);i++)glow(g,rnd(0,W),rnd(0,H),rnd(60,150),rnd(0,1)<.5?'235,235,238':'20,20,24',rnd(.1,.24));
   specks(g,rnd,Math.round(W*H/380),['235,235,240','30,30,34','160,160,166'],1,2.6,.08,.3);
   for(let i=0;i<Math.round(W/90);i++)crack(g,rnd,rnd(0,W),rnd(0,H),rnd(3,7),'rgba(15,15,18,.55)',1.4);
   for(let i=0;i<Math.round(W/150);i++){const px=rnd(0,W),py=rnd(0,H),R=rnd(26,60),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,'rgba(10,10,12,.5)');q.addColorStop(1,'rgba(10,10,12,0)');g.fillStyle=q;g.beginPath();g.ellipse(px,py,R,R*.7,rnd(0,3),0,TAU);g.fill()}
   for(let i=0;i<Math.round(W/70);i++){const px=rnd(0,W),py=rnd(0,H);g.fillStyle=rgba('20,20,24',.4);g.beginPath();g.moveTo(px,py);g.lineTo(px+rnd(4,10),py+rnd(-3,3));g.lineTo(px+rnd(2,8),py+rnd(4,9));g.closePath();g.fill()}
   for(let i=0;i<Math.round(W/110);i++){const px=rnd(0,W),py=rnd(0,H),R=rnd(18,44),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,'rgba(228,228,232,.4)');q.addColorStop(1,'rgba(228,228,232,0)');g.fillStyle=q;g.beginPath();g.ellipse(px,py,R*1.4,R*.8,rnd(-.5,.5),0,TAU);g.fill()}
   vignette(g,.38)},
  /* 5 - NIGHT HIGHWAY RUINS: cracked asphalt, sodium street-lamp pools, neon puddles, lane paint, wild verges */
  5(g,rnd){g.fillStyle='#262b38';g.fillRect(0,0,W,H);
   specks(g,rnd,Math.round(W*H/500),['255,255,255','0,0,0'],1,3,.02,.08);
   for(let i=0;i<9;i++){g.fillStyle=rgba('0,0,0',rnd(.06,.14));g.fillRect(rnd(0,W),rnd(100,H-100),rnd(60,170),rnd(20,60))}
   for(let i=0;i<Math.round(W/90);i++)crack(g,rnd,rnd(0,W),rnd(110,H-110),rnd(5,9),'rgba(0,0,0,.5)',1.5);
   g.fillStyle='rgba(240,240,232,.7)';for(let px=10;px<W;px+=75){g.fillRect(px,H*.3-3,42,6);g.fillRect(px,H*.7-3,42,6)}
   g.fillStyle='#d9a82a';g.fillRect(0,H/2-6,W,3);g.fillRect(0,H/2+3,W,3);
   g.fillStyle='rgba(240,240,232,.7)';for(let k=0;k<9;k++)g.fillRect(W*.62+k*13,H*.3+10,8,H*.4-20);
   for(let i=0;i<4;i++){g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=6;g.beginPath();const px=rnd(0,W),py=rnd(130,H-130);g.moveTo(px,py);g.bezierCurveTo(px+60,py+rnd(-30,30),px+120,py+rnd(-40,40),px+190,py+rnd(-20,20));g.stroke()}
   const vh=88;band(g,rnd,1,vh,6,'#2f5a2c');band(g,rnd,-1,vh,6,'#2c5429');
   for(const dir of[1,-1]){const y0=dir>0?0:H;grassTufts(g,rnd,dir>0?4:H-vh,dir>0?vh:H-4,Math.round(W*1.1),5,11,90,130);
    for(let i=0;i<Math.round(W/9);i++){g.fillStyle=['#f06292','#ffd54a','#ffffff','#ff8a3d','#b388ff'][(rnd(0,5))|0];g.beginPath();g.arc(rnd(0,W),y0+dir*rnd(10,vh-12),rnd(1.3,2.4),0,TAU);g.fill()}
    g.fillStyle='#8d8f98';g.fillRect(0,dir>0?vh-1:H-vh-6,W,7);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,dir>0?vh+6:H-vh-10,W,4)}
   for(let i=0;i<5;i++){const px=rnd(80,W-80),py=rnd(vh+30,H-vh-30),R=rnd(20,42),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,'rgba(110,150,255,.45)');q.addColorStop(.6,'rgba(170,90,230,.28)');q.addColorStop(1,'rgba(20,20,40,.5)');g.fillStyle=q;g.beginPath();g.ellipse(px,py,R*1.5,R*.7,rnd(-.4,.4),0,TAU);g.fill()}
   g.fillStyle='#1a1d26';g.beginPath();g.arc(W*.25,H*.62,17,0,TAU);g.fill();g.strokeStyle='#4a4d58';g.lineWidth=3;g.stroke();
   const lamps=Math.max(2,Math.round(W/380));add(g,()=>{for(let i=0;i<lamps;i++){const lx=(i+.5)*W/lamps,ly=i%2?H*.62:H*.38;glow(g,lx,ly,230,'255,160,50',.34);glow(g,lx,ly,70,'255,215,140',.2)}});
   for(let i=0;i<lamps;i++){const lx=(i+.5)*W/lamps,ly=i%2?H*.62:H*.38;g.save();g.shadowColor='#ffb347';g.shadowBlur=14;g.fillStyle='rgba(255,225,170,.8)';g.beginPath();g.arc(lx,ly,4,0,TAU);g.fill();g.restore()}
   vignette(g,.4)},
  /* 6 - ARCTIC AURORA FIELD: deep blue ice, glowing teal cracks, snow drifts, green / violet aurora light */
  6(g,rnd){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#1b4a7a');gr.addColorStop(1,'#10345e');g.fillStyle=gr;g.fillRect(0,0,W,H);
   for(let i=0;i<Math.round(W*H/12000);i++)glow(g,rnd(0,W),rnd(0,H),rnd(60,150),rnd(0,1)<.5?'150,220,255':'10,30,70',rnd(.14,.3));
   add(g,()=>{for(let b=0;b<3;b++){const col=['60,255,170','130,110,255','50,220,255'][b],y0=H*(.12+b*.22),ph=rnd(0,6);for(let px=-40;px<=W+40;px+=24){const yy=y0+Math.sin(px*.006+ph)*H*.1;glow(g,px,yy,rnd(70,120),col,.1)}}});
   for(let i=0;i<Math.round(W/80);i++){let px=rnd(0,W),py=rnd(0,H),a=rnd(0,TAU);const pts=[[px,py]];for(let k=0;k<rnd(6,12);k++){a+=rnd(-.7,.7);px+=Math.cos(a)*rnd(18,46);py+=Math.sin(a)*rnd(18,46);pts.push([px,py])}
    for(const[col,w,o]of[['rgba(60,230,230,.35)',6,0],['rgba(235,250,255,.7)',2.2,0],['rgba(10,40,90,.6)',1.4,1.5]]){g.strokeStyle=col;g.lineWidth=w;g.lineJoin='round';g.beginPath();pts.forEach((p,k)=>k?g.lineTo(p[0]+o,p[1]+o):g.moveTo(p[0]+o,p[1]+o));g.stroke()}}
   for(let i=0;i<Math.round(W/60);i++){const px=rnd(0,W),py=rnd(0,H),R=rnd(30,90),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,'rgba(235,248,255,.4)');q.addColorStop(1,'rgba(235,248,255,0)');g.fillStyle=q;g.beginPath();g.ellipse(px,py,R*1.6,R*.5,rnd(-.4,.4),0,TAU);g.fill()}
   specks(g,rnd,Math.round(W*H/450),['255,255,255','120,190,255'],1,2.4,.1,.4);
   add(g,()=>{for(let i=0;i<Math.round(W/70);i++){const px=rnd(0,W),py=rnd(0,H);g.strokeStyle='rgba(220,245,255,'+rnd(.2,.6)+')';g.lineWidth=1;for(let k=0;k<3;k++){const a=k*1.0472;g.beginPath();g.moveTo(px-Math.cos(a)*5,py-Math.sin(a)*5);g.lineTo(px+Math.cos(a)*5,py+Math.sin(a)*5);g.stroke()}}});
   vignette(g,.36)},
  /* 7 - INDUSTRIAL HANGAR: gunmetal plates, amber light strips, caution lanes, oil sheen, spotlight pools */
  7(g,rnd){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#363c47');gr.addColorStop(1,'#232830');g.fillStyle=gr;g.fillRect(0,0,W,H);
   const PW=150,PH=75;for(let py=0;py<H;py+=PH)for(let px=0;px<W;px+=PW){g.fillStyle=rnd(0,1)<.5?rgba('255,255,255',rnd(0,.07)):rgba('0,0,0',rnd(0,.12));g.fillRect(px,py,PW,PH);
    for(const[a,b]of[[8,8],[PW-8,8],[8,PH-8],[PW-8,PH-8]]){g.fillStyle='rgba(10,12,16,.6)';g.beginPath();g.arc(px+a,py+b,2.6,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.arc(px+a-.8,py+b-.8,1,0,TAU);g.fill()}}
   g.lineWidth=2;for(let i=0;i<=W;i+=PW){g.strokeStyle='rgba(8,10,14,.7)';g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.strokeStyle='rgba(255,255,255,.13)';g.beginPath();g.moveTo(i+2,0);g.lineTo(i+2,H);g.stroke()}
   for(let i=0;i<=H;i+=PH){g.strokeStyle='rgba(8,10,14,.7)';g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();g.strokeStyle='rgba(255,255,255,.13)';g.beginPath();g.moveTo(0,i+2);g.lineTo(W,i+2);g.stroke()}
   for(let i=0;i<Math.round(W*H/4500);i++){g.fillStyle=rgba(rnd(0,1)<.5?'255,255,255':'0,0,0',rnd(.03,.09));g.fillRect(rnd(0,W),rnd(0,H),rnd(40,160),1)}
   hazard(g,0,H*.14,W,16,.38,'235,170,30','14,14,16');hazard(g,0,H*.86-16,W,16,.38,'235,170,30','14,14,16');
   g.fillStyle='rgba(255,200,70,.22)';for(let px=60;px<W;px+=260){g.beginPath();g.moveTo(px,H*.5-26);g.lineTo(px+46,H*.5);g.lineTo(px,H*.5+26);g.lineTo(px+14,H*.5);g.fill()}
   for(let i=0;i<5;i++){g.strokeStyle='rgba(6,8,10,.85)';g.lineWidth=rnd(5,9);g.lineCap='round';g.beginPath();const px=rnd(0,W),py=rnd(0,H);g.moveTo(px,py);g.bezierCurveTo(px+rnd(60,140),py+rnd(-60,60),px+rnd(150,260),py+rnd(-60,60),px+rnd(280,380),py+rnd(-40,40));g.stroke()}
   for(let i=0;i<Math.round(W/160);i++){const px=rnd(0,W),py=rnd(0,H),R=rnd(24,52),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,'rgba(0,0,0,.6)');q.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=q;g.beginPath();g.arc(px,py,R,0,TAU);g.fill();
    add(g,()=>{g.lineWidth=2;['120,255,200','255,120,220','120,170,255'].forEach((c,k)=>{g.strokeStyle='rgba('+c+',.22)';g.beginPath();g.arc(px,py,R*(.45+k*.2),rnd(0,3),rnd(3.5,5.5)+3);g.stroke()})})}
   add(g,()=>{for(let i=0;i<Math.round(W/150);i++){const px=rnd(0,W),py=i%2?H*.3:H*.7;g.shadowColor='#ffa030';g.shadowBlur=12;g.strokeStyle='rgba(255,160,50,.85)';g.lineWidth=3;g.beginPath();g.moveTo(px,py);g.lineTo(px+rnd(70,140),py);g.stroke();glow(g,px+60,py,110,'255,150,40',.16)}
    for(let i=0;i<Math.round(W/260)+1;i++)glow(g,rnd(0,W),rnd(0,H),rnd(160,230),'150,200,255',.14)});
   add(g,()=>{for(let i=0;i<Math.round(W/20);i++){g.fillStyle=rgba('255,190,90',rnd(.4,.9));g.fillRect(rnd(0,W),rnd(0,H),rnd(1,2.4),rnd(1,2.4))}});vignette(g,.42)},
  /* 8 - MOONLIT JUNGLE: deep green undergrowth, ferns, dirt trail, moon shafts, glowing mushrooms, fireflies */
  8(g,rnd){g.fillStyle='#10301f';g.fillRect(0,0,W,H);
   for(let i=0;i<Math.round(W*H/7500);i++)glow(g,rnd(0,W),rnd(0,H),rnd(60,150),rnd(0,1)<.55?'50,140,80':'2,16,10',rnd(.18,.34));
   for(let i=0;i<Math.round(W*H/320);i++){g.fillStyle='hsl('+rnd(100,150)+','+rnd(35,60)+'%,'+rnd(14,34)+'%)';g.fillRect(rnd(0,W),rnd(0,H),1.5,rnd(3,8))}
   g.lineCap='round';g.lineJoin='round';for(const[w,c]of[[62,'#2e2416'],[48,'#4d3a22'],[30,'#65502f']]){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(-20,H*.78);g.bezierCurveTo(W*.25,H*.45,W*.5,H*1.0,W*.72,H*.5);g.bezierCurveTo(W*.85,H*.28,W*.95,H*.35,W+20,H*.2);g.stroke()}
   for(let i=0;i<Math.round(W*H/2800);i++){g.fillStyle=rgba(rnd(0,1)<.5?'170,100,40':'210,150,50',rnd(.25,.6));g.beginPath();g.ellipse(rnd(0,W),rnd(0,H),rnd(2,4.5),rnd(1,2.2),rnd(0,3),0,TAU);g.fill()}
   for(let i=0;i<Math.round(W*H/5200);i++){const px=rnd(0,W),py=rnd(0,H),n=7;g.strokeStyle='hsl('+rnd(105,140)+',55%,'+rnd(24,38)+'%)';g.lineWidth=2;for(let k=0;k<n;k++){const a=k/n*TAU+rnd(-.2,.2),l=rnd(12,22);g.beginPath();g.moveTo(px,py);g.quadraticCurveTo(px+Math.cos(a)*l*.6,py+Math.sin(a)*l*.6-4,px+Math.cos(a)*l,py+Math.sin(a)*l);g.stroke()}}
   for(let i=0;i<Math.round(W/190);i++){const px=rnd(40,W-40),py=rnd(40,H-40),a=rnd(0,3),L=rnd(50,90);g.save();g.translate(px,py);g.rotate(a);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-L/2+3,-6+4,L,13);g.fillStyle='#4a3420';g.fillRect(-L/2,-7,L,14);g.fillStyle='#6a4c2e';g.fillRect(-L/2,-7,L,4);g.fillStyle='#2f2113';g.beginPath();g.arc(L/2,0,7,0,TAU);g.fill();g.restore()}
   for(let i=0;i<Math.round(W/70);i++){const px=rnd(0,W),py=rnd(0,H),c=rnd(0,1)<.5?'80,255,230':'200,120,255';add(g,()=>glow(g,px,py,rnd(18,32),c,.45));g.fillStyle=rnd(0,1)<.5?'#7fe8dc':'#d9a8ff';g.beginPath();g.arc(px,py,3,Math.PI,0);g.fill();g.fillStyle='rgba(240,240,230,.8)';g.fillRect(px-1,py,2,4)}
   add(g,()=>{for(let i=0;i<Math.max(3,Math.round(W/260));i++){const sx=rnd(0,W),w=rnd(60,110),len=H*1.3;g.fillStyle='rgba(150,220,255,.07)';g.beginPath();g.moveTo(sx,-20);g.lineTo(sx+w,-20);g.lineTo(sx+w-len*.4,len);g.lineTo(sx-len*.4,len);g.closePath();g.fill()}});
   fireflies(g,rnd,Math.round(W/40),'200,255,100');vignette(g,.46)},
  /* 9 - NEBULA DEBRIS FIELD: multicolour nebula, coloured stars, ringed gas giant, comet, wrecked station pieces */
  9(g,rnd){const gr=g.createRadialGradient(W*.5,H*.5,40,W*.5,H*.5,Math.max(W,H)*.8);gr.addColorStop(0,'#141847');gr.addColorStop(1,'#04030f');g.fillStyle=gr;g.fillRect(0,0,W,H);
   add(g,()=>{for(const col of['150,60,220','40,120,255','30,200,190','235,70,150','255,140,60','100,80,255','60,220,140']){const nx=rnd(0,W),ny=rnd(0,H),R=rnd(160,340);glow(g,nx,ny,R,col,.24);for(let k=0;k<5;k++)glow(g,nx+rnd(-R*.6,R*.6),ny+rnd(-R*.4,R*.4),R*rnd(.25,.45),col,.14)}});
   for(let i=0;i<Math.round(W*H/900);i++){const px=rnd(0,W),py=rnd(0,H),big=rnd(0,1)<.05;g.fillStyle=rgba(rnd(0,1)<.6?'255,255,255':rnd(0,1)<.5?'170,200,255':'255,205,150',rnd(.25,1));g.fillRect(px,py,big?2.4:rnd(.8,1.7),big?2.4:rnd(.8,1.7));
    if(big){g.strokeStyle='rgba(200,220,255,.3)';g.lineWidth=1;g.beginPath();g.moveTo(px-6,py+1);g.lineTo(px+8,py+1);g.moveTo(px+1,py-6);g.lineTo(px+1,py+8);g.stroke()}}
   g.save();g.translate(W*.28,H*.74);g.rotate(-.5);add(g,()=>{glow(g,0,0,110,'200,160,255',.22);g.strokeStyle='rgba(220,200,255,.22)';g.lineWidth=2;g.beginPath();g.ellipse(0,0,95,26,0,0,TAU);g.stroke();g.strokeStyle='rgba(120,200,255,.14)';g.beginPath();g.ellipse(0,0,60,16,0,0,TAU);g.stroke()});g.restore();
   const pxx=W*.86,pyy=H*.24,pr=Math.min(86,H*.14),pg=g.createRadialGradient(pxx-pr*.35,pyy-pr*.35,6,pxx,pyy,pr);pg.addColorStop(0,'#ffcf9a');pg.addColorStop(.5,'#c0603a');pg.addColorStop(1,'#2a0f2e');g.fillStyle=pg;g.beginPath();g.arc(pxx,pyy,pr,0,TAU);g.fill();
   g.save();g.beginPath();g.arc(pxx,pyy,pr,0,TAU);g.clip();g.fillStyle='rgba(255,230,190,.14)';for(let k=0;k<6;k++)g.fillRect(pxx-pr,pyy-pr+k*pr*.34+rnd(0,8),pr*2,pr*.09);const sd=g.createRadialGradient(pxx-pr*.5,pyy-pr*.5,pr*.5,pxx-pr*.5,pyy-pr*.5,pr*1.7);sd.addColorStop(0,'rgba(0,0,0,0)');sd.addColorStop(1,'rgba(0,0,12,.8)');g.fillStyle=sd;g.fillRect(pxx-pr,pyy-pr,pr*2,pr*2);g.restore();
   g.strokeStyle='rgba(255,190,140,.45)';g.lineWidth=2;g.beginPath();g.arc(pxx,pyy,pr+1,0,TAU);g.stroke();g.strokeStyle='rgba(235,210,255,.5)';g.lineWidth=3;g.beginPath();g.ellipse(pxx,pyy,pr*1.75,pr*.34,-.35,3.4,6.0);g.stroke();
   add(g,()=>{const cx=W*.55,cy=H*.1,q=g.createLinearGradient(cx,cy,cx-170,cy+60);q.addColorStop(0,'rgba(180,240,255,.8)');q.addColorStop(1,'rgba(180,240,255,0)');g.strokeStyle=q;g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(cx,cy);g.lineTo(cx-170,cy+60);g.stroke();glow(g,cx,cy,22,'200,245,255',.7)});
   for(let i=0;i<Math.round(W/150);i++){const px=rnd(0,W),py=rnd(0,H),a=rnd(0,TAU);g.save();g.translate(px,py);g.rotate(a);g.fillStyle='#3a3a52';g.beginPath();g.moveTo(-14,-5);g.lineTo(10,-8);g.lineTo(16,4);g.lineTo(-8,9);g.closePath();g.fill();g.strokeStyle='#8a8ab0';g.lineWidth=1;g.stroke();g.fillStyle='#46e0ff';g.fillRect(-4,-1,3,2);g.restore()}
   vignette(g,.3)},
  /* 10 - STORM CITADEL SKY (boss): violet storm clouds, ember-lit horizon, lightning, driving rain */
  10(g,rnd){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#14083a');gr.addColorStop(.55,'#3b1048');gr.addColorStop(1,'#8c2a3a');g.fillStyle=gr;g.fillRect(0,0,W,H);
   add(g,()=>{glow(g,W*.5,H*1.05,Math.max(W,H)*.6,'255,110,50',.38);glow(g,W*.12,H*.1,420,'170,90,255',.14)});
   for(let i=0;i<Math.round(W*H/5200);i++){const cx=rnd(0,W),cy=rnd(0,H),n=(rnd(4,9))|0;for(let k=0;k<n;k++){const px=cx+rnd(-60,60),py=cy+rnd(-18,18),R=rnd(22,54);glow(g,px,py,R,'30,18,60',rnd(.16,.3));glow(g,px-R*.25,py+R*.3,R*.7,'255,130,70',.05)}}
   for(let i=0;i<Math.round(W/50);i++){const px=rnd(0,W),py=rnd(0,H);g.strokeStyle='rgba(255,170,120,'+rnd(.05,.16)+')';g.lineWidth=rnd(1,2);g.lineCap='round';g.beginPath();g.moveTo(px,py);g.lineTo(px+rnd(50,150),py+rnd(-4,4));g.stroke()}
   for(let n=0;n<2;n++){let px=rnd(W*.15,W*.85),py=-10;const pts=[[px,py]];while(py<H*rnd(.55,.9)){px+=rnd(-28,28);py+=rnd(18,36);pts.push([px,py])}
    add(g,()=>{for(const[col,w]of[['rgba(170,130,255,.28)',12],['rgba(255,245,200,.85)',2.4]]){g.shadowColor='#b9a0ff';g.shadowBlur=22;g.strokeStyle=col;g.lineWidth=w;g.lineJoin='round';g.beginPath();pts.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke()}glow(g,px,pts[pts.length-1][1],180,'190,160,255',.12)})}
   g.lineCap='butt';g.strokeStyle='rgba(200,190,255,.1)';g.lineWidth=1;g.beginPath();for(let i=0;i<Math.round(W*H/1500);i++){const px=rnd(0,W+60),py=rnd(0,H);g.moveTo(px,py);g.lineTo(px-6,py+16)}g.stroke();vignette(g,.4)},
  /* FEMALE MODE: Original, non-repeating futuristic technological environments for ALL 50 levels (Levels 1-50), inspired by Level 2 */
  female(g,l,rnd){
   const PALETTES=[
    {bg:'#0a1420',tile:'#122234',cy:'0,240,255',mg:'255,40,150',accent:'40,220,255',name:'QUANTUM CORE'},
    {bg:'#181226',tile:'#241c38',cy:'255,40,180',mg:'120,50,255',accent:'240,100,255',name:'CYBER CLEANROOM'},
    {bg:'#0c1c1a',tile:'#142a26',cy:'40,255,180',mg:'0,200,255',accent:'80,255,200',name:'NEURAL MATRIX'},
    {bg:'#221810',tile:'#322416',cy:'255,170,40',mg:'255,60,40',accent:'255,200,80',name:'PLASMA FOUNDRY'},
    {bg:'#0d1b2a',tile:'#1b263b',cy:'65,190,255',mg:'224,251,252',accent:'120,220,255',name:'CRYO ARCHIVE'},
    {bg:'#1a0d24',tile:'#2b143a',cy:'180,60,255',mg:'255,70,160',accent:'210,120,255',name:'TACHYON CHAMBER'},
    {bg:'#141c10',tile:'#202c18',cy:'120,255,60',mg:'40,230,190',accent:'160,255,80',name:'BIO-SYNAPSE LAB'},
    {bg:'#1c1c24',tile:'#2a2a36',cy:'255,215,0',mg:'0,225,255',accent:'255,230,100',name:'MAGLEV TERMINAL'},
    {bg:'#240c14',tile:'#381420',cy:'255,46,99',mg:'255,150,50',accent:'255,80,120',name:'FUSION REACTOR'},
    {bg:'#0a1024',tile:'#141a36',cy:'0,210,255',mg:'150,80,255',accent:'100,220,255',name:'ORBITAL UPLINK'},
    {bg:'#141220',tile:'#221e34',cy:'230,70,255',mg:'40,240,255',accent:'200,100,255',name:'HOLO VAULT'},
    {bg:'#1e1e24',tile:'#2e2e38',cy:'255,190,60',mg:'255,50,130',accent:'255,210,90',name:'NANOBOT CRUCIBLE'}
   ];
   const P=PALETTES[(l-1)%PALETTES.length];
   const T=60+((l*7)%35);
   const pat=l%4;
   const gr=g.createLinearGradient(0,0,W,H);
   gr.addColorStop(0,P.bg);gr.addColorStop(0.5,P.tile);gr.addColorStop(1,P.bg);
   g.fillStyle=gr;g.fillRect(0,0,W,H);
   if(pat===0){
    for(let ty=0;ty<H;ty+=T)for(let tx=0;tx<W;tx+=T){
     g.fillStyle=rnd(0,1)<.48?rgba(P.cy,rnd(0.01,0.05)):rgba('0,0,0',rnd(0.04,0.16));
     g.fillRect(tx,ty,T,T);
    }
    g.lineWidth=1.5;
    for(let i=0;i<=W;i+=T){
     g.strokeStyle='rgba(5,10,18,0.7)';g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();
     g.strokeStyle=rgba(P.cy,0.14);g.beginPath();g.moveTo(i+1.5,0);g.lineTo(i+1.5,H);g.stroke();
    }
    for(let i=0;i<=H;i+=T){
     g.strokeStyle='rgba(5,10,18,0.7)';g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();
     g.strokeStyle=rgba(P.cy,0.14);g.beginPath();g.moveTo(0,i+1.5);g.lineTo(W,i+1.5);g.stroke();
    }
   }else if(pat===1){
    const TW=T*1.5,TH=T;let row=0;
    for(let ty=0;ty<H;ty+=TH){
     const off=(row%2)*(TW/2);
     for(let tx=-TW/2;tx<W+TW;tx+=TW){
      g.fillStyle=rnd(0,1)<.5?rgba(P.mg,rnd(0.02,0.06)):rgba('0,0,0',rnd(0.06,0.18));
      g.fillRect(tx+off,ty,TW-2,TH-2);
      g.strokeStyle=rgba(P.accent,0.2);g.lineWidth=1;
      g.strokeRect(tx+off+1,ty+1,TW-4,TH-4);
      for(const[bx,by]of[[tx+off+6,ty+6],[tx+off+TW-8,ty+6],[tx+off+6,ty+TH-8],[tx+off+TW-8,ty+TH-8]]){
       g.fillStyle=rgba(P.cy,0.4);g.beginPath();g.arc(bx,by,1.8,0,TAU);g.fill();
      }
     }
     row++;
    }
   }else if(pat===2){
    for(let ty=0;ty<H;ty+=T)for(let tx=0;tx<W;tx+=T){
     g.fillStyle=rgba('0,0,0',rnd(0.05,0.18));g.fillRect(tx,ty,T,T);
    }
    g.lineWidth=2;
    for(let d=-H;d<W+H;d+=T){
     g.strokeStyle=rgba(P.cy,0.1);g.beginPath();g.moveTo(d,0);g.lineTo(d+H,H);g.stroke();
     g.strokeStyle=rgba(P.mg,0.08);g.beginPath();g.moveTo(d,H);g.lineTo(d+H,0);g.stroke();
    }
   }else{
    const cx=W*(0.3+((l*13)%40)/100),cy=H*(0.3+((l*17)%40)/100);
    for(let r=40;r<Math.max(W,H);r+=T){
     g.strokeStyle=rgba(P.cy,0.15);g.lineWidth=1.5;
     g.beginPath();g.arc(cx,cy,r,0,TAU);g.stroke();
     g.strokeStyle=rgba(P.mg,0.08);g.setLineDash([8,12]);
     g.beginPath();g.arc(cx,cy,r+T/2,0,TAU);g.stroke();
     g.setLineDash([]);
    }
   }
   specks(g,rnd,Math.round(W*H/2000),[P.cy,P.mg,'255,255,255'],1,2.8,0.04,0.2);
   const numStrips=4+(l%5);
   for(let i=0;i<numStrips;i++){
    const vert=rnd(0,1)<.5,cyc=rnd(0,1)<.6?P.cy:P.mg;
    const len=rnd(180,420),px=Math.round(rnd(1,W/T-1))*T,py=Math.round(rnd(1,H/T-1))*T;
    add(g,()=>{
     g.shadowColor='rgb('+cyc+')';g.shadowBlur=15;
     g.strokeStyle='rgba('+cyc+',0.9)';g.lineWidth=3;
     g.beginPath();g.moveTo(px,py);
     vert?g.lineTo(px,py+len):g.lineTo(px+len,py);
     g.stroke();
     glow(g,vert?px:px+len/2,vert?py+len/2:py,110,cyc,0.14);
    });
   }
   const vents=3+(l%4);
   for(let i=0;i<vents;i++){
    const px=rnd(40,W-140),py=rnd(60,H-120);
    g.fillStyle='#080d14';g.fillRect(px,py,72,44);
    g.fillStyle=rgba(P.accent,0.25);
    for(let k=0;k<7;k++)g.fillRect(px+5,py+4+k*5.5,62,2.2);
    g.strokeStyle=rgba(P.cy,0.6);g.lineWidth=1;
    g.strokeRect(px+0.5,py+0.5,72,44);
    for(let k=0;k<3;k++){
     g.fillStyle=k===1?'#39ff7a':(k===0?'rgb('+P.cy+')':'rgb('+P.mg+')');
     g.beginPath();g.arc(px+12+k*10,py+40,1.8,0,TAU);g.fill();
    }
   }
   add(g,()=>{
    const hx=W*(0.2+((l*23)%60)/100),hy=H*(0.25+((l*29)%50)/100);
    g.shadowColor='rgb('+P.cy+')';g.shadowBlur=14;
    g.strokeStyle='rgba('+P.cy+',0.7)';g.lineWidth=2;
    for(const r of[38,58]){g.beginPath();g.arc(hx,hy,r,0,TAU);g.stroke();}
    g.setLineDash([5,8]);
    g.beginPath();g.arc(hx,hy,78,0,TAU);g.stroke();
    g.setLineDash([]);
    g.beginPath();
    g.moveTo(hx-88,hy);g.lineTo(hx-64,hy);
    g.moveTo(hx+64,hy);g.lineTo(hx+88,hy);
    g.moveTo(hx,hy-88);g.lineTo(hx-64,hy);
    g.moveTo(hx,hy+64);g.lineTo(hx+88,hy);
    g.stroke();
    glow(g,hx,hy,120,P.cy,0.18);
   });
   const hazCol=rnd(0,1)<.5?'235,190,30':P.mg;
   hazard(g,0,H-24,W,16,0.45,hazCol,'10,12,18');
   hazard(g,0,8,W,16,0.45,hazCol,'10,12,18');
   g.fillStyle=rgba(P.accent,0.08);
   g.font='900 80px Impact,"Arial Black",sans-serif';
   g.textAlign='center';
   g.fillText('CYBER LAB '+String(l).padStart(2,'0')+' // '+P.name,W/2,H/2+28);
   vignette(g,0.38);
  }
 }})();
