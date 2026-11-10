"use strict";
/* utils.js - shared helpers: canvas handles, clamp, random */
const $=id=>document.getElementById(id),cv=$('c'),x=cv.getContext('2d'),WB=900,HB=600;
let W=WB,H=HB;   /* the battlefield size: layout.js re-fits it to the screen's shape (never smaller than the original 900x600) */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a);
