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
 const PAD=16,OBC=new Map(),KIND={1:'rock',2:'stone',3:'sandbox',4:'door',5:'garden',6:'ice',7:'steel',8:'tree',9:'asteroid',10:'storm'};
 /* ---------- floors (drawn once per level into a cached canvas) ---------- */
 const FLOOR={
  1(g){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#0e5f86');gr.addColorStop(.5,'#0b4d74');gr.addColorStop(1,'#08385c');g.fillStyle=gr;g.fillRect(0,0,W,H);
   for(let i=0;i<26;i++){const px=rnd(0,W),py=rnd(0,H),R=rnd(60,160),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,Math.random()<.5?'rgba(120,210,235,.16)':'rgba(2,20,40,.22)');q.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(px-R,py-R,R*2,R*2)}
   g.lineCap='round';for(let i=0;i<130;i++){const px=rnd(0,W),py=rnd(0,H),w=rnd(30,110),ph=rnd(0,6);g.strokeStyle='rgba(190,235,255,'+rnd(.06,.2)+')';g.lineWidth=rnd(1,2.4);g.beginPath();for(let k=0;k<=w;k+=5){const yy=py+Math.sin(k*.14+ph)*3.5;k?g.lineTo(px+k,yy):g.moveTo(px,yy)}g.stroke()}
   for(let i=0;i<70;i++){g.fillStyle='rgba(255,255,255,'+rnd(.05,.22)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,3),rnd(1,2))}},
  2(g){g.fillStyle='#cfcec8';g.fillRect(0,0,W,H);const T=75;
   for(let ty=0;ty<H;ty+=T)for(let tx=0;tx<W;tx+=T){g.fillStyle=Math.random()<.5?'rgba(0,0,0,'+rnd(0,.045)+')':'rgba(255,255,255,'+rnd(0,.25)+')';g.fillRect(tx,ty,T,T)}
   g.lineWidth=2;for(let i=0;i<=W;i+=T){g.strokeStyle='rgba(95,100,112,.4)';g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.strokeStyle='rgba(255,255,255,.8)';g.beginPath();g.moveTo(i+2,0);g.lineTo(i+2,H);g.stroke()}
   for(let i=0;i<=H;i+=T){g.strokeStyle='rgba(95,100,112,.4)';g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();g.strokeStyle='rgba(255,255,255,.8)';g.beginPath();g.moveTo(0,i+2);g.lineTo(W,i+2);g.stroke()}
   for(let i=0;i<260;i++){g.fillStyle='rgba(60,65,75,'+rnd(.03,.1)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,3),rnd(1,2))}
   for(let i=0;i<6;i++){const sx=rnd(0,W),sy=rnd(0,H),gr=g.createRadialGradient(sx,sy,0,sx,sy,rnd(50,110));gr.addColorStop(0,'rgba(120,125,140,.14)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(sx-120,sy-120,240,240)}},
  3(g){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#e2bd76');gr.addColorStop(1,'#cfa55f');g.fillStyle=gr;g.fillRect(0,0,W,H);
   for(let i=0;i<8;i++){const by=rnd(0,H),amp=rnd(14,34),f=rnd(.004,.009),ph=rnd(0,6);g.beginPath();g.moveTo(0,by);for(let px=0;px<=W;px+=15)g.lineTo(px,by+Math.sin(px*f+ph)*amp);for(let px=W;px>=0;px-=15)g.lineTo(px,by+rnd(40,70)+Math.sin(px*f+ph)*amp);g.closePath();g.fillStyle=i%2?'rgba(255,238,190,.16)':'rgba(120,80,30,.12)';g.fill()}
   g.lineCap='round';for(let i=0;i<220;i++){const px=rnd(0,W),py=rnd(0,H),w=rnd(14,46);g.strokeStyle='rgba('+(Math.random()<.5?'255,240,200':'120,80,35')+','+rnd(.06,.16)+')';g.lineWidth=rnd(1,2);g.beginPath();g.moveTo(px,py);g.quadraticCurveTo(px+w/2,py-rnd(2,6),px+w,py);g.stroke()}
   for(let i=0;i<500;i++){g.fillStyle='rgba('+(Math.random()<.5?'90,60,25':'255,250,225')+','+rnd(.05,.2)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,2.5),rnd(1,2))}
   for(let i=0;i<16;i++){const px=rnd(0,W),py=rnd(0,H),r=rnd(2,5);g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(px+2,py+2,r,r*.7,0,0,6.283);g.fill();g.fillStyle='#a98457';g.beginPath();g.ellipse(px,py,r,r*.7,0,0,6.283);g.fill()}},
  4(g){g.fillStyle='#2a0709';g.fillRect(0,0,W,H);
   for(let y=0;y<H;y+=40){g.fillStyle='hsl(355,52%,'+rnd(9,15)+'%)';g.fillRect(0,y,W,40);g.fillStyle='rgba(0,0,0,.65)';g.fillRect(0,y,W,2);
    for(let k=0;k<3;k++){g.fillStyle='rgba(0,0,0,.5)';g.fillRect(rnd(0,W),y+2,2,38)}
    for(let k=0;k<5;k++){g.strokeStyle='rgba(255,120,110,.05)';g.lineWidth=1;const gy=y+rnd(6,34),gx=rnd(0,W);g.beginPath();g.moveTo(gx,gy);g.lineTo(gx+rnd(60,200),gy+rnd(-2,2));g.stroke()}}
   g.save();g.globalCompositeOperation='lighter';const L=[[150,120],[450,100],[760,150],[240,330],[650,330],[120,520],[450,500],[800,520]];
   for(const[lx,ly]of L){const R=rnd(150,210),q=g.createRadialGradient(lx,ly,4,lx,ly,R);q.addColorStop(0,'rgba(255,60,45,.48)');q.addColorStop(.5,'rgba(220,25,30,.2)');q.addColorStop(1,'rgba(150,0,10,0)');g.fillStyle=q;g.fillRect(lx-R,ly-R,R*2,R*2)}g.restore();
   for(const[lx,ly]of L){g.save();g.shadowColor='#ff3a2a';g.shadowBlur=16;g.fillStyle='rgba(255,170,150,.55)';g.beginPath();g.arc(lx,ly,5,0,6.283);g.fill();g.restore()}
   const v=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.85);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');g.fillStyle=v;g.fillRect(0,0,W,H)},
  5(g){g.fillStyle='#3a3c41';g.fillRect(0,0,W,H);
   for(let i=0;i<900;i++){g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+rnd(.02,.08)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,3),rnd(1,3))}
   for(let i=0;i<9;i++){g.fillStyle='rgba(0,0,0,'+rnd(.05,.12)+')';g.fillRect(rnd(0,W),rnd(100,H-100),rnd(60,170),rnd(20,60))}
   for(let i=0;i<7;i++){const ox=rnd(0,W),oy=rnd(120,H-120),q=g.createRadialGradient(ox,oy,0,ox,oy,rnd(14,30));q.addColorStop(0,'rgba(0,0,0,.4)');q.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(ox-35,oy-35,70,70)}
   const grass=(y0,y1)=>{g.fillStyle='#3f7a34';g.fillRect(0,y0,W,y1-y0);for(let i=0;i<1100;i++){g.fillStyle='hsl('+rnd(92,125)+','+rnd(40,60)+'%,'+rnd(22,40)+'%)';g.fillRect(rnd(0,W),rnd(y0,y1),rnd(1,2),rnd(3,7))}};
   grass(0,92);grass(H-92,H);g.fillStyle='#b9b9b4';g.fillRect(0,92,W,7);g.fillRect(0,H-99,W,7);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,99,W,4);g.fillRect(0,H-103,W,4);
   g.fillStyle='rgba(235,235,225,.85)';for(let px=10;px<W;px+=75){g.fillRect(px,H*.3-3,42,6);g.fillRect(px,H*.7-3,42,6)}
   g.fillStyle='#e0b72e';g.fillRect(0,H/2-6,W,3);g.fillRect(0,H/2+3,W,3);
   g.fillStyle='rgba(240,240,232,.8)';for(let k=0;k<9;k++)g.fillRect(W*.62+k*13,H*.3+10,8,H*.4-20);
   g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=1.5;for(let i=0;i<7;i++){let px=rnd(0,W),py=rnd(120,H-120);g.beginPath();g.moveTo(px,py);for(let k=0;k<6;k++){px+=rnd(-14,18);py+=rnd(-12,14);g.lineTo(px,py)}g.stroke()}
   g.fillStyle='#2b2d31';g.beginPath();g.arc(W*.25,H*.62,17,0,6.283);g.fill();g.strokeStyle='#4a4d53';g.lineWidth=3;g.stroke();g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(W*.25-12,H*.62+k*5);g.lineTo(W*.25+12,H*.62+k*5);g.stroke()}},
  6(g){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#a9d2e6');gr.addColorStop(1,'#78afcc');g.fillStyle=gr;g.fillRect(0,0,W,H);
   for(let i=0;i<14;i++){const sx=rnd(0,W),sy=rnd(0,H),R=rnd(60,150),q=g.createRadialGradient(sx,sy,0,sx,sy,R);q.addColorStop(0,'rgba(255,255,255,.32)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(sx-R,sy-R,R*2,R*2)}
   for(let i=0;i<9;i++){let px=rnd(0,W),py=rnd(0,H),a=rnd(0,6.283);const pts=[[px,py]];for(let k=0;k<rnd(6,12);k++){a+=rnd(-.7,.7);px+=Math.cos(a)*rnd(18,46);py+=Math.sin(a)*rnd(18,46);pts.push([px,py])}
    for(const[col,w,o]of[['rgba(255,255,255,.55)',3,1.5],['rgba(50,105,150,.55)',1.6,0]]){g.strokeStyle=col;g.lineWidth=w;g.beginPath();pts.forEach((p,k)=>k?g.lineTo(p[0]+o,p[1]+o):g.moveTo(p[0]+o,p[1]+o));g.stroke()}}
   for(let i=0;i<500;i++){g.fillStyle='rgba('+(Math.random()<.6?'255,255,255':'70,120,160')+','+rnd(.08,.3)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,2.5),rnd(1,2))}
   const sh=g.createLinearGradient(0,H,W,0);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.5,'rgba(255,255,255,.22)');sh.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sh;g.fillRect(0,0,W,H)}
  ,7(g){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#aeb4bd');gr.addColorStop(.5,'#8f96a1');gr.addColorStop(1,'#757c87');g.fillStyle=gr;g.fillRect(0,0,W,H);
   for(let i=0;i<900;i++){g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'40,50,65')+','+rnd(.03,.1)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(40,160),1)}
   const PW=150,PH=75;for(let py=0;py<H;py+=PH)for(let px=0;px<W;px+=PW){g.fillStyle=Math.random()<.5?'rgba(255,255,255,'+rnd(0,.1)+')':'rgba(30,40,60,'+rnd(0,.08)+')';g.fillRect(px,py,PW,PH);
    for(const[a,b]of[[8,8],[PW-8,8],[8,PH-8],[PW-8,PH-8]]){g.fillStyle='rgba(40,48,60,.55)';g.beginPath();g.arc(px+a,py+b,2.6,0,6.283);g.fill();g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.arc(px+a-.8,py+b-.8,1,0,6.283);g.fill()}}
   g.lineWidth=2;for(let i=0;i<=W;i+=PW){g.strokeStyle='rgba(50,58,72,.55)';g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.strokeStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(i+2,0);g.lineTo(i+2,H);g.stroke()}
   for(let i=0;i<=H;i+=PH){g.strokeStyle='rgba(50,58,72,.55)';g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();g.strokeStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(0,i+2);g.lineTo(W,i+2);g.stroke()}
   g.lineCap='round';for(let i=0;i<60;i++){const px=rnd(0,W),py=rnd(0,H),a=rnd(0,3.14),l=rnd(8,26);g.strokeStyle='rgba(255,255,255,'+rnd(.1,.3)+')';g.lineWidth=1;g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);g.stroke()}
   const sh=g.createLinearGradient(0,H,W,0);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.5,'rgba(255,255,255,.14)');sh.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sh;g.fillRect(0,0,W,H)},
  8(g){g.fillStyle='#294421';g.fillRect(0,0,W,H);
   for(let i=0;i<18;i++){const sx=rnd(0,W),sy=rnd(0,H),R=rnd(60,150),q=g.createRadialGradient(sx,sy,0,sx,sy,R);q.addColorStop(0,Math.random()<.5?'rgba(110,160,70,.22)':'rgba(5,20,5,.3)');q.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=q;g.fillRect(sx-R,sy-R,R*2,R*2)}
   for(let i=0;i<1700;i++){g.fillStyle='hsl('+rnd(80,125)+','+rnd(35,60)+'%,'+rnd(18,38)+'%)';g.fillRect(rnd(0,W),rnd(0,H),1.5,rnd(3,8))}
   g.lineCap='round';g.lineJoin='round';for(const[w,c]of[[60,'#41331f'],[46,'#65502f'],[30,'#7a6244']]){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(-20,H*.78);g.bezierCurveTo(W*.25,H*.45,W*.5,H*1.0,W*.72,H*.5);g.bezierCurveTo(W*.85,H*.28,W*.95,H*.35,W+20,H*.2);g.stroke()}
   for(let i=0;i<220;i++){g.fillStyle='rgba('+(Math.random()<.5?'150,95,40':'190,140,50')+','+rnd(.25,.6)+')';g.beginPath();g.ellipse(rnd(0,W),rnd(0,H),rnd(2,4.5),rnd(1,2.2),rnd(0,3),0,6.283);g.fill()}
   for(let i=0;i<22;i++){const px=rnd(0,W),py=rnd(0,H),r=rnd(2,5);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(px+2,py+2,r,r*.7,0,0,6.283);g.fill();g.fillStyle='#7d8078';g.beginPath();g.ellipse(px,py,r,r*.7,0,0,6.283);g.fill()}
   for(let i=0;i<30;i++){const sx=rnd(0,W),sy=rnd(0,H),R=rnd(20,44);g.fillStyle='rgba(3,15,3,.2)';g.beginPath();g.ellipse(sx,sy,R*1.4,R,rnd(0,3),0,6.283);g.fill()}},
  9(g){const gr=g.createRadialGradient(W*.5,H*.5,40,W*.5,H*.5,W*.8);gr.addColorStop(0,'#10133a');gr.addColorStop(1,'#03030d');g.fillStyle=gr;g.fillRect(0,0,W,H);
   g.save();g.globalCompositeOperation='lighter';for(const col of['120,60,200','50,110,230','30,170,170','200,60,140','90,70,220']){const nx=rnd(0,W),ny=rnd(0,H),R=rnd(140,300),q=g.createRadialGradient(nx,ny,0,nx,ny,R);q.addColorStop(0,'rgba('+col+',.2)');q.addColorStop(1,'rgba('+col+',0)');g.fillStyle=q;g.fillRect(nx-R,ny-R,R*2,R*2)}g.restore();
   for(let i=0;i<560;i++){const px=rnd(0,W),py=rnd(0,H),big=Math.random()<.06;g.fillStyle='rgba('+(Math.random()<.7?'255,255,255':Math.random()<.5?'170,200,255':'255,225,170')+','+rnd(.25,1)+')';g.fillRect(px,py,big?2.4:rnd(.8,1.7),big?2.4:rnd(.8,1.7));
    if(big){g.strokeStyle='rgba(200,220,255,.3)';g.lineWidth=1;g.beginPath();g.moveTo(px-6,py+1);g.lineTo(px+8,py+1);g.moveTo(px+1,py-6);g.lineTo(px+1,py+8);g.stroke()}}
   const pxx=W*.86,pyy=H*.22,pr=78,pg=g.createRadialGradient(pxx-26,pyy-26,6,pxx,pyy,pr);pg.addColorStop(0,'#8cc3ff');pg.addColorStop(.55,'#2a63b8');pg.addColorStop(1,'#07163f');g.fillStyle=pg;g.beginPath();g.arc(pxx,pyy,pr,0,6.283);g.fill();
   g.save();g.beginPath();g.arc(pxx,pyy,pr,0,6.283);g.clip();g.fillStyle='rgba(255,255,255,.14)';for(let k=0;k<5;k++)g.fillRect(pxx-pr,pyy-pr+k*30+rnd(0,8),pr*2,8);const sd=g.createRadialGradient(pxx-40,pyy-40,pr*.5,pxx-40,pyy-40,pr*1.7);sd.addColorStop(0,'rgba(0,0,0,0)');sd.addColorStop(1,'rgba(0,0,10,.75)');g.fillStyle=sd;g.fillRect(pxx-pr,pyy-pr,pr*2,pr*2);g.restore();
   g.strokeStyle='rgba(130,190,255,.5)';g.lineWidth=2;g.beginPath();g.arc(pxx,pyy,pr+1,0,6.283);g.stroke();
   g.strokeStyle='rgba(200,215,255,.5)';g.lineWidth=3;g.beginPath();g.ellipse(pxx,pyy,pr*1.7,pr*.36,-.35,3.4,6.0);g.stroke()},
  10(g){const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2a78cc');gr.addColorStop(1,'#a4d6f8');g.fillStyle=gr;g.fillRect(0,0,W,H);
   const sg=g.createRadialGradient(W*.15,H*.08,0,W*.15,H*.08,420);sg.addColorStop(0,'rgba(255,252,225,.75)');sg.addColorStop(1,'rgba(255,252,225,0)');g.fillStyle=sg;g.fillRect(0,0,W,H);
   for(let i=0;i<46;i++){const cx=rnd(0,W),cy=rnd(0,H),n=(rnd(4,9))|0,a=rnd(.1,.3);for(let k=0;k<n;k++){const px=cx+rnd(-50,50),py=cy+rnd(-16,16),R=rnd(18,46),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,'rgba(255,255,255,'+a+')');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(px-R,py-R,R*2,R*2)}}
   g.lineCap='round';for(let i=0;i<70;i++){const px=rnd(0,W),py=rnd(0,H);g.strokeStyle='rgba(255,255,255,'+rnd(.08,.28)+')';g.lineWidth=rnd(1,2);g.beginPath();g.moveTo(px,py);g.lineTo(px+rnd(50,150),py);g.stroke()}
   for(let i=0;i<10;i++){const px=rnd(0,W),py=rnd(0,H),R=rnd(70,130),q=g.createRadialGradient(px,py,0,px,py,R);q.addColorStop(0,'rgba(20,70,140,.13)');q.addColorStop(1,'rgba(20,70,140,0)');g.fillStyle=q;g.fillRect(px-R,py-R,R*2,R*2)}}
 };
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
 function obstacle(b,kind){const key=kind+':'+b.x+','+b.y+','+b.w+','+b.h;let c=OBC.get(key);
  if(!c){if(OBC.size>60)OBC.clear();c=document.createElement('canvas');c.width=Math.ceil(b.w)+PAD*2;c.height=Math.ceil(b.h)+PAD*2;const g=c.getContext('2d');g.translate(PAD,PAD);let h=0;for(const ch of key)h=(h*31+ch.charCodeAt(0))|0;OBJ[kind](g,b.w,b.h,sr(h));OBC.set(key,c)}
  x.drawImage(c,b.x-PAD,b.y-PAD)}
 function frame(g,l){g.strokeStyle='rgba(230,190,40,.45)';g.lineWidth=6;g.setLineDash([22,16]);g.strokeRect(14,14,W-28,H-28);g.setLineDash([]);
  g.fillStyle='rgba(255,255,255,.06)';g.font='900 90px Impact,"Arial Black",sans-serif';g.textAlign='center';g.fillText('SECTOR '+String(l).padStart(2,'0'),W/2,H/2+30)}
 return{FLOOR,KIND,obstacle,frame}
})();
function floorFor(l){if(floorC&&floorL===l)return floorC;
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),e=ENV[l-1];
 if(BGX.FLOOR[l]){BGX.FLOOR[l](g);BGX.frame(g,l);floorC=c;floorL=l;return c}
 g.fillStyle='hsl('+e[0]+','+e[1]+'%,'+e[2]+'%)';g.fillRect(0,0,W,H);
 for(let i=0;i<600;i++){g.fillStyle='rgba('+(Math.random()<.5?'0,0,0':'255,255,255')+','+rnd(.02,.07)+')';g.fillRect(rnd(0,W),rnd(0,H),rnd(1,4),rnd(1,3))}
 for(let i=0;i<8;i++){const sx=rnd(0,W),sy=rnd(0,H),gr=g.createRadialGradient(sx,sy,0,sx,sy,rnd(40,90));gr.addColorStop(0,'rgba(0,0,0,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(sx-100,sy-100,200,200)}
 g.lineWidth=2;for(let i=0;i<=W;i+=75){g.strokeStyle='rgba(0,0,0,.35)';g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.strokeStyle='rgba(255,255,255,.05)';g.beginPath();g.moveTo(i+2,0);g.lineTo(i+2,H);g.stroke()}
 for(let i=0;i<=H;i+=75){g.strokeStyle='rgba(0,0,0,.35)';g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();g.strokeStyle='rgba(255,255,255,.05)';g.beginPath();g.moveTo(0,i+2);g.lineTo(W,i+2);g.stroke()}
 BGX.frame(g,l);floorC=c;floorL=l;return c}
function crate(b){const k=BGX.KIND[G&&G.lvl];if(k){BGX.obstacle(b,k);return}
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
 x.drawImage(floorFor(G.lvl),0,0);
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