"use strict";
/* nozoom.js - while you are playing, the picture never zooms: no pinch, no double-tap zoom, no Ctrl+wheel / trackpad pinch, no Ctrl/Cmd +/-/0.
   Menus and lessons stay zoomable (accessibility). The browser's own menu zoom cannot be blocked by a web page. */
(function(){
 if(typeof document.querySelector!=='function'||!document.querySelector('meta[name=viewport]'))return;
 const playing=()=>document.body&&document.body.classList.contains('playing');
 const meta=document.querySelector('meta[name=viewport]'),open=meta.content,locked=open.replace(/,?\s*(maximum-scale|user-scalable)=[^,]*/g,'')+',maximum-scale=1,user-scalable=no';
 const sync=()=>{const c=playing()?locked:open;if(meta.content!==c)meta.content=c};
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});sync();
 const stop=e=>{if(playing()&&e.cancelable)e.preventDefault()};
 ['gesturestart','gesturechange','gestureend','dblclick'].forEach(n=>document.addEventListener(n,stop,{passive:false}));
 document.addEventListener('touchmove',e=>{if(playing()&&e.touches.length>1)stop(e)},{passive:false});
 document.addEventListener('wheel',e=>{if(playing()&&e.ctrlKey)stop(e)},{passive:false});
 addEventListener('keydown',e=>{if(playing()&&(e.ctrlKey||e.metaKey)&&['+','-','=','_','0'].includes(e.key))stop(e)},true);
})();
