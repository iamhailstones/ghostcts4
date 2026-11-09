"use strict";
/* layout.js - full-screen battlefield for every device.
   The canvas always fills the whole window (no black bars). The world keeps the original 900x600 height/width as a MINIMUM and simply grows
   to match the screen's shape: a wide phone gets extra room left and right, a 4:3 tablet gets extra room up and down. The picture is never stretched
   (the world's aspect ratio always equals the screen's, to within 1%). The original obstacle layout stays centred in the larger world.
   It also sizes the on-screen touch controls (read by css/style.css through CSS variables) and tells the canvas HUD how much room the controls take. */
const OBS0=OBS.map(o=>({x:o.x,y:o.y,w:o.w,h:o.h}));   /* the original obstacle positions */
const Layout={rs:1,U:1,inL:0,inR:0,sl:0,sr:0,st:0,touch:false,js:0,btn:0,gap:0,edge:12,probe:null,tm:0,
 /* css px of the notch / rounded corners (0 on most screens) */
 safe(){if(!this.probe){const p=document.createElement('div');p.setAttribute('aria-hidden','true');
   p.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
   document.body.appendChild(p);this.probe=p}
  const c=getComputedStyle(this.probe);return{t:parseFloat(c.paddingTop)||0,r:parseFloat(c.paddingRight)||0,b:parseFloat(c.paddingBottom)||0,l:parseFloat(c.paddingLeft)||0}},
 fit(){const w=$('wrap'),r=w.getBoundingClientRect(),vw=r.width||innerWidth,vh=r.height||innerHeight;if(vw<80||vh<80)return;
  const a=vw/vh,coarse=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches),q=n=>Math.round(n/10)*10;let nw,nh;
  if(a>=WB/HB){nh=HB;nw=q(HB*a)}else{nw=WB;nh=q(WB/a)}
  nw=Math.max(480,nw);nh=Math.max(480,nh);
  if(Math.abs(nw/nh-a)/a>.012){if(a>=WB/HB)nw=Math.round(nh*a);else nh=Math.round(nw/a)}   /* safety: never let the picture stretch */
  nw=Math.min(nw,4000);nh=Math.min(nh,3000);
  /* sharpness: phones keep the original 1:1 canvas (fast); desktops draw at up to 2x so the larger picture stays crisp */
  const dpr=Math.min(2,window.devicePixelRatio||1),rs=coarse?1:Math.max(1,Math.min(2,Math.round(vh*dpr/nh*4)/4));
  const sf=this.safe();
  this.touch=coarse;this.U=vh/nh;
  /* touch control sizes in css px - all bigger than before, with wide gaps between them */
  const js=Math.max(100,Math.min(150,Math.round(vh*.3))),btn=Math.max(54,Math.min(78,Math.round(vh*.155))),gap=Math.max(10,Math.min(18,Math.round(vh*.03)));
  this.js=js;this.btn=btn;this.gap=gap;
  const ds=document.documentElement.style;ds.setProperty('--js',js+'px');ds.setProperty('--btn',btn+'px');ds.setProperty('--gap',gap+'px');ds.setProperty('--edge',this.edge+'px');
  /* canvas HUD insets (logical px): keep the health / ammo panels clear of the joysticks and the notch */
  this.sl=sf.l/this.U;this.sr=sf.r/this.U;this.st=sf.t/this.U;
  this.inL=coarse?(sf.l+this.edge+js)/this.U:this.sl;this.inR=this.sr;
  const ox0=Math.max(0,(W-WB)/2),oy0=Math.max(0,(H-HB)/2);
  this.place(sf);if(coarse)this.inR=(Math.max(sf.r+this.edge+js,this.ext)+gap)/this.U;
  const changed=nw!==W||nh!==H||rs!==this.rs||cv.width!==Math.round(nw*rs);
  W=nw;H=nh;this.rs=rs;
  if(changed){cv.width=Math.round(W*rs);cv.height=Math.round(H*rs);
   const ox=Math.max(0,(W-WB)/2),oy=Math.max(0,(H-HB)/2);OBS.forEach((o,i)=>{o.x=OBS0[i].x+ox;o.y=OBS0[i].y+oy});
   floorC=null;lightC=null;
   /* if the screen changed shape mid-battle, everything slides with the obstacles so nothing ends up inside a block */
   if(typeof G!=='undefined'&&G&&G.p){const dx=ox-ox0,dy=oy-oy0;if(dx||dy)for(const k of['enemies','bul','eb','bombs','fx','pk','decals'])for(const o of(G[k]||[]))if(typeof o.x==='number'){o.x+=dx;o.y+=dy;if(o.px!==undefined){o.px+=dx;o.py+=dy}}
    const p=G.p;p.x=clamp(p.x+dx,p.r,W-p.r);p.y=clamp(p.y+dy,p.r,H-p.r)}}},
 /* positions of the touch controls (css px): joysticks in the bottom corners, GUN above the left one, R / BOMB / Q / SW fanned in an arc around FIRE, AUTO bottom centre.
    Everything is derived from the screen size and the notch, with a gap between buttons wider than a fingertip, so nothing overlaps on any phone or tablet. */
 place(sf){if(!this.touch)return;const js=this.js,btn=this.btn,gap=this.gap,eL=this.edge+sf.l,eR=this.edge+sf.r,eB=Math.max(this.edge,sf.b+6),S=(id,o)=>{const e=document.getElementById(id);if(!e)return;e.style.left=e.style.right=e.style.bottom='auto';for(const k in o)e.style[k]=Math.round(o[k])+'px'};
  S('jl',{left:eL,bottom:eB});S('jr',{right:eR,bottom:eB});
  S('tg',{left:eL+(js-btn)/2,bottom:eB+js+gap});S('ta',{left:eL+(js-btn)/2+btn+gap,bottom:eB+js+gap});
  const cx=eR+js/2,cy=eB+js/2,rr=js/2+btn/2+gap,step=2*Math.asin(Math.min(1,(btn+gap)/(2*rr))),lo=Math.asin(Math.max(-1,Math.min(1,(4+btn/2-cy)/rr)));let th=Math.max(lo,-.45);
  this.ext=0;['tr','tb','tq','tw'].forEach(id=>{const rx=cx+rr*Math.cos(th)-btn/2;S(id,{right:rx,bottom:cy+rr*Math.sin(th)-btn/2});if(cy+rr*Math.sin(th)-btn/2<110)this.ext=Math.max(this.ext,rx+btn);th+=step});
    document.documentElement.style.setProperty('--rlb',(eB+btn+gap+4)+'px')},
 init(){const go=()=>{clearTimeout(this.tm);this.tm=setTimeout(()=>this.fit(),90)};
  this.fit();addEventListener('resize',go);addEventListener('orientationchange',()=>setTimeout(go,250));
  if(window.visualViewport)visualViewport.addEventListener('resize',go);
  /* a phone often reports its final size a moment after load / entering full screen */
  [300,1200].forEach(t=>setTimeout(()=>this.fit(),t))}};
