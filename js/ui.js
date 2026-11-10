"use strict";
/* ui.js - overlays, menu, challenge terminal, HUD */
/* ---------- UI ---------- */
function showEnd(t,s,b,fn){$('et').textContent=t;if(typeof s==='string'&&s.includes('<'))$('es').innerHTML=s;else $('es').textContent=s;$('eb').textContent=b;$('eb').onclick=fn;show('end')}
function toMenu(){state='menu';G=null;updSnd();$('pname').value=SAVE.name||'';$('saveinfo').textContent='Best score '+SAVE.best+' | Highest level '+SAVE.lvl+' | Total kills '+SAVE.kills+' | Challenges solved '+SAVE.done.length+'/'+CH.length;
 $('play').textContent=SAVE.lvl>1?'CONTINUE (LEVEL '+SAVE.lvl+')':'PLAY';show('menu')}

function showVictoryEnding(finalScore,finalKills){
 state='end';sfx('win');Voice.event('win');Music.stinger('win');
 for(let i=0;i<12;i++){
  setTimeout(()=>{
   if(G)fxBurst(rnd(80,W-80),rnd(60,H-100),45,['#ffd700','#00ffff','#ff007f','#39ff7a','#ffffff','#ff9900'][i%6],220);
  },i*220);
 }
 const vicHtml=`
  <div style="color:#39ff7a;font-size:18px;font-weight:900;letter-spacing:2px;margin:8px 0 12px;text-shadow:0 0 14px rgba(57,255,122,.7)">
   FACILITY LIBERATED — THE COMMANDER HAS FALLEN!
  </div>
  <div style="font-size:13px;line-height:1.6;color:#e8e8e8;max-width:580px;margin:0 auto 14px;text-align:center">
   The Commander's supreme cybernetic stronghold has been completely neutralized across all 50 sectors! Ghost CTS-4 has mastered Python systems architecture, dismantled the hostile network, and secured absolute victory.
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;background:rgba(12,14,24,0.85);border:1px solid #39ff7a;border-radius:6px;padding:12px 16px;max-width:520px;margin:0 auto 16px;text-align:left;font-family:'Courier New',monospace;font-size:13px">
   <div>OPERATIVE: <b style="color:#fff">${(SAVE.name||'GHOST').toUpperCase()}</b> (${SAVE.gender==='f'?'FEMALE':'MALE'})</div>
   <div>FINAL SCORE: <b style="color:#ffd700">${finalScore}</b></div>
   <div>HOSTILES NEUTRALIZED: <b style="color:#ff3b4a">${finalKills}</b></div>
   <div>SECTORS CONQUERED: <b style="color:#39ff7a">50 / 50</b></div>
   <div>PYTHON PROTOCOLS: <b style="color:#6fd3ff">50 VERIFIED</b></div>
   <div>CAMPAIGN STATUS: <b style="color:#ffd700">COMPLETED</b></div>
  </div>`;
 showEnd('★ CAMPAIGN VICTORY ★',vicHtml,'CONCLUDE CAMPAIGN (MAIN MENU)',toMenu);
}

function startMCQ(lvl,qNum,onComplete){
 if(state==='chal'&&cur&&cur.mcq&&cur.qNum===qNum)return;
 prev=state;state='chal';
 const qItem=MCQ.find(m=>m.lvl===lvl&&m.qNum===qNum)||MCQ[0];
 cur={mcq:true,lvl,qNum,qItem,onComplete,fails:0,attempted:false,done:false};
 $('cnext').style.display='none';$('cmenu').style.display='none';$('cclose').style.display='none';
 $('cin').style.display='none';$('csub').style.display='none';$('cc').style.display='none';
 Voice.event('lesson');
 $('ct').textContent='LEVEL '+lvl+' GATE - QUESTION '+qNum+'/3: '+qItem.title;
 $('cm').textContent='CONCEPT: '+qItem.concept+'  |  QUESTION '+qNum+' OF 3 (REQUIRED TO PROCEED)';
 $('cl').textContent='Clearance requirement: Solve 3 Python questions to unlock Level '+(lvl+1)+'.';
 $('cb').textContent=qItem.q;
 $('cguide').textContent='';
 $('cfb').textContent='';

 const oldOpts=$('copts');if(oldOpts)oldOpts.remove();
 const repOld=$('chalReplay');if(repOld)repOld.remove();

 const d=document.createElement('div');d.id='copts';
 qItem.opts.forEach((optText,idx)=>{
  const b=document.createElement('button');
  b.innerHTML='<b style="color:#39ff7a">'+'ABCD'[idx]+')</b>  '+optText;
  b.onclick=()=>{
   if(!cur||cur.done)return;
   cur.attempted=true;
   if(idx===qItem.a){
    cur.done=true;sfx('ok');Voice.event('solved');
    Array.from(d.querySelectorAll('button')).forEach(btn=>btn.disabled=true);
    b.style.borderColor='#39ff7a';b.style.background='rgba(57,255,122,0.18)';
    const rOld=$('chalReplay');if(rOld)rOld.remove();
    let exp='<div style="color:#39ff7a;font-weight:bold;margin-bottom:6px">ACCESS GRANTED — CORRECT!</div>'
     +'<b>VERIFIED SOLUTION:</b> '+qItem.sol+'\n\n'
     +'<b>HOW IT WORKS:</b> '+qItem.why;
    if(qNum<3)exp+='\n\n<span style="color:#6fd3ff">Protocol '+qNum+'/3 cleared. Proceed to next question.</span>';
    else exp+='\n\n<span style="color:#39ff7a;font-weight:bold">ALL 3 PROTOCOLS VERIFIED! LEVEL '+(lvl+1)+' CLEARANCE GRANTED.</span>';
    $('cfb').innerHTML=exp;
    const contBtn=document.createElement('button');
    contBtn.style.marginTop='10px';contBtn.style.padding='10px 18px';contBtn.style.background='#39ff7a';contBtn.style.color='#000';contBtn.style.fontWeight='bold';
    if(qNum<3){
     contBtn.textContent='PROCEED TO QUESTION '+(qNum+1)+' / 3';
     contBtn.onclick=()=>{d.remove();startMCQ(lvl,qNum+1,onComplete)};
    } else {
     contBtn.textContent='ENTER LEVEL '+(lvl+1);
     contBtn.onclick=()=>{d.remove();cur=null;show(null);onComplete()};
    }
    d.appendChild(contBtn);
   } else {
    cur.fails++;sfx('no');Voice.event('wrong');
    b.style.borderColor='#ff3b4a';b.style.background='rgba(255,59,74,0.18)';
    let msgText='ACCESS DENIED. Option ('+'ABCD'[idx]+') is incorrect.';
    if(cur.fails>=1)msgText+='\n\nHINT: '+qItem.hint;
    $('cfb').textContent=msgText;
    if(cur.fails>=2&&!$('chalReplay')){
     const rep=document.createElement('button');rep.id='chalReplay';
     rep.textContent='REPLAY LEVEL '+lvl;
     rep.style.marginTop='10px';rep.style.background='#ff3b4a';rep.style.color='#fff';rep.style.fontWeight='bold';
     rep.onclick=()=>{d.remove();cur=null;show(null);newLevel(lvl)};
     d.appendChild(rep);
    }
   }
  };
  d.appendChild(b);
 });
 $('cinfo').appendChild(d);
 show('chal');
}

function openCh(i,req,win,train,gate){
 if(state==='chal')return;prev=state;state='chal';const c=CH[i];
 cur={i,req,win,train,gate,done:false,fails:0,attempted:false};
 const oldOpts=$('copts');if(oldOpts)oldOpts.remove();
 const repOld=$('chalReplay');if(repOld)repOld.remove();
 $('cin').style.display='';$('csub').style.display='';
 $('cnext').style.display=gate?'none':'';$('cmenu').style.display=gate?'none':'';Voice.event('lesson');
 $('cguide').textContent=SAVE.done.length<2?'How to: 1) read the task  2) type your Python code  3) press RUN CHECK. Stuck? Press HINT after an attempt.':'';
 $('ct').textContent=c.title;$('cl').textContent=c.lesson||'';$('cm').textContent='CONCEPT: '+c.concept+'  |  DIFFICULTY: '+(c.diff||'INTERMEDIATE');
 $('cc').textContent=c.code||'# write your code below';$('cc').style.display=c.code?'':'none';
 $('cb').textContent=c.brief;$('cin').value=c.code||'';$('cfb').textContent='';$('csub').disabled=false;
 $('cclose').textContent='BACK';$('cclose').style.display=req?'none':'';show('chal');$('cin').focus();
}

$('csub').onclick=()=>{
 if(!cur||cur.mcq)return;const c=CH[cur.i];const val=$('cin').value;cur.attempted=true;
 const synErr=pyStrict(val)||pySyntax(val);const nVal=norm(val);
 let isCorrect=false;
 if(!synErr){
  if(c.ok(nVal))isCorrect=true;
  else if(c.testEnv){try{const env={};Py.run(nVal,env);if(c.testEnv(env))isCorrect=true}catch(e){}}
 }
 if(isCorrect){
  cur.done=true;sfx('ok');Voice.event('solved');$('csub').disabled=true;
  const repOld=$('chalReplay');if(repOld)repOld.remove();
  let r='';
  if(cur.gate&&G){r=c.win(G.p);if(!SAVE.done.includes(c.id))SAVE.done.push(c.id);store()}
  else if(prev==='play'&&G){r=c.win(G.p);if(!SAVE.done.includes(c.id))SAVE.done.push(c.id);addScore(50);store()}
  let succHtml='<div style="color:#39ff7a;font-weight:bold;margin-bottom:6px">ACCESS GRANTED.</div>'
   +'<b>VERIFIED SOLUTION:</b>\n<pre style="margin:4px 0;color:#39ff7a;font-size:13px">'+c.sol+'</pre>\n'
   +'<b>HOW IT WORKS:</b>\n'+c.why+(r?'\n\n<b style="color:#ffd700">REWARD: '+r+'</b>':'');
  $('cfb').innerHTML=succHtml;
  $('cclose').style.display='';$('cclose').textContent=cur.gate?'CONTINUE TO NEXT LEVEL':'CONTINUE';
 } else {
  sfx('no');Voice.event('wrong');cur.fails++;
  let errMsg='ACCESS DENIED.\n';
  if(synErr){errMsg+='EXACT CHECKER REQUIREMENT:\n'+synErr}
  else{
   const hintErr=pyHint(val);if(hintErr)errMsg+='SYNTAX REQUIREMENT: '+hintErr+'\n\n';
   errMsg+='CHECKER REQUIREMENT:\n'+(c.err||'Code must satisfy the Python challenge specification.');
  }
  if(cur.fails>=1)errMsg+='\n\nHINT: '+c.hint;
  $('cfb').textContent=errMsg;
  if(cur.fails>=2&&!$('chalReplay')&&G&&G.lvl){
   const rep=document.createElement('button');rep.id='chalReplay';
   rep.textContent='REPLAY LEVEL '+G.lvl;
   rep.style.marginTop='10px';rep.style.background='#ff3b4a';rep.style.color='#fff';rep.style.fontWeight='bold';
   rep.onclick=()=>{cur=null;show(null);newLevel(G.lvl)};
   const ctr=$('chal').querySelector('div:last-child');
   if(ctr)ctr.appendChild(rep);
  }
 }
};

$('chint').onclick=()=>{
 if(!cur)return;
 if(!cur.attempted&&cur.fails===0){
  $('cfb').textContent='Security Protocol: Make at least one attempt before unlocking hints.';
  return;
 }
 const h=cur.mcq?cur.qItem.hint:CH[cur.i].hint;
 $('cfb').textContent='HINT: '+h;
};

$('cclose').onclick=()=>{
 if(!cur)return;const c=cur;
 const repOld=$('chalReplay');if(repOld)repOld.remove();
 const optsOld=$('copts');if(optsOld)optsOld.remove();
 if(c.gate){if(!c.done)return;cur=null;show(null);c.gate();return}
 cur=null;
 if(c.train){if(c.done&&c.i<CH.length-1){state='menu';openCh(c.i+1,false,null,true);return}state='menu';toMenu();return}
 state=prev==='play'?'play':prev;show(null);if(c.done&&c.win)c.win();if(state==='menu')toMenu();
};
$('play').onclick=()=>{if(document.activeElement)document.activeElement.blur();score=0;kills=0;newLevel(SAVE.lvl)};
$('pname').addEventListener('input',e=>{SAVE.name=e.target.value.replace(/[\u0000-\u001f<>]/g,'').slice(0,12);store()});
$('pname').addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur()});
$('sndb').onclick=toggleMute;
$('musb').onclick=toggleMusic;
$('howb').onclick=()=>{const h=$('how');h.style.display=h.style.display==='none'?'':'none'};
$('reset').onclick=()=>Confirm.ask('RESET GAME','This erases your level, credits, weapons, lessons and your chosen character. Sound settings, tips and your codename are kept. You will pick Male or Female again.','RESET GAME',()=>{const k={name:SAVE.name,mute:SAVE.mute,nomusic:SAVE.nomusic,vol:SAVE.vol,voice:SAVE.voice,tips:SAVE.tips,tutDone:SAVE.tutDone,mstyle:SAVE.mstyle,voiceName:SAVE.voiceName};SAVE=Object.assign({best:0,lvl:1,kills:0,done:[],perks:{},guns:{owned:['pistol'],sel:'pistol',res:{}},credits:200,pr:[]},k);store();score=0;kills=0;Gender.apply();toMenu();Gender.ask()});
/* One pause for every screen: gameplay, lessons (challenge terminal) and the market. 'pause' is not 'play', so the world never updates while paused. */
let pausedFrom=null;
function pause(){if(state==='pause'){Voice.event('resume');state=pausedFrom||'play';pausedFrom=null;show(state==='play'?null:state)}
 else if(state==='play'||(state==='chal'&&prev==='play')||(state==='market'&&G)){pausedFrom=state;state='pause';K={};M.down=false;show('pause');Voice.event('pause')}}
/* Main menu from anywhere: stop gameplay, keep saved progress, ask once before dropping a running level. */
function leaveToMenu(btn){const live=!!G&&(state==='play'||pausedFrom==='play'||state==='pyr'||((state==='chal'||state==='pause')&&prev==='play'));
 if(live&&!btn.dataset.armed){btn.dataset.armed='1';btn.dataset.o=btn.dataset.o||btn.textContent;btn.textContent='CONFIRM: LEAVE GAME?';setTimeout(()=>{delete btn.dataset.armed;btn.textContent=btn.dataset.o},3500);return}
 delete btn.dataset.armed;if(btn.dataset.o)btn.textContent=btn.dataset.o;try{syncGuns();store()}catch(e){}Voice.cancel();K={};M.down=false;cur=null;pausedFrom=null;PR.reset();toMenu()}
function nextQuest(){if(!cur)return;const c=cur;if(c.gate)return;if(c.req&&!c.done)return msg('SOLVE THIS CHALLENGE FIRST');
 const j=c.train?(c.i+1<CH.length?c.i+1:-1):CH.findIndex((x,k)=>k!==c.i&&k<=G.lvl+1&&!SAVE.done.includes(x.id));
 if(j<0)return msg('NO MORE QUESTS HERE');const keep=prev;cur=null;state=keep;openCh(j,false,null,c.train)}
$('pbtn').onclick=e=>{e.target.blur();pause()};$('resume').onclick=pause;$('tomenu').onclick=()=>leaveToMenu($('tomenu'));
$('cnext').onclick=nextQuest;$('cmenu').onclick=()=>leaveToMenu($('cmenu'));
function hud(){if(!G){$('autorl').classList.remove('on');return}const p=G.p;PR.autoUI(p);$('hp').style.width=Math.max(0,p.hp/CFG.hp*100)+'%';$('hp').style.background=p.sh>0?'#6fd3ff':p.hp<30?'#ff3b4a':'#39ff7a';
 $('ammo').textContent=(p.rel>0?'RELOADING ':'')+p.mag+'/'+p.reserve;$('bombs').textContent=p.bombs+'/'+CFG.maxBombs;$('lvl').textContent=G.lvl+' '+LV[G.lvl-1];
 $('wave').textContent=G.boss?'BOSS':G.wave+'/'+G.waves;$('left').textContent=(G.total-G.spawned)+G.enemies.length;$('score').textContent=score;$('kills').textContent=kills}
/* Python-style error messages for the most common beginner mistakes (the code is never run) */
function pyHint(code){const ln=code.replace(/#.*$/gm,'').split('\n');
 for(let i=0;i<ln.length;i++){const l=ln[i];
  if(/^\s*(if|elif|else|for|while|def|class|try|except)\b[^\n]*[^:\s]\s*$/.test(l)&&!/\(\s*$/.test(l))return'SyntaxError: line '+(i+1)+' needs a colon (:) at the end.';
  if(/^\s*(if|elif|while)\s+\w+\s*=[^=]/.test(l))return'SyntaxError: use == to compare. A single = assigns a value.';
  if(/:\s*$/.test(l)&&ln[i+1]!==undefined&&ln[i+1].trim()&&!/^\s/.test(ln[i+1]))return'IndentationError: line '+(i+2)+' must be indented after the colon.'}
 const o=(code.match(/[([{]/g)||[]).length,c=(code.match(/[)\]}]/g)||[]).length,q=(code.match(/"/g)||[]).length;
 if(o!==c)return'SyntaxError: brackets do not match (( ) [ ] { }).';if(q%2)return'SyntaxError: a quote mark is not closed.';return''}

/* ---------- in-page confirmation (browser pop-ups are blocked in embedded pages), exit screen, first-time tips ---------- */
const overlayOf=s=>({menu:'menu',pause:'pause',chal:'chal',market:'market',end:'end'})[s]||null;
const Confirm={fn:null,prevState:null,
 ask(title,text,yes,fn){if(state==='cfm')return;this.prevState=state;this.fn=fn;$('cfmT').textContent=title;$('cfmM').textContent=text;$('cfmYes').textContent=yes;state='cfm';show('cfm')},
 no(){if(state!=='cfm')return;state=this.prevState;this.fn=null;show(overlayOf(state))},
 yes(){if(state!=='cfm')return;const f=this.fn;this.fn=null;state=this.prevState;if(f)f()}};
const Tips={t:0,
 show(id,text){if(!SAVE.tips||SAVE.tips[id]||state!=='play')return;SAVE.tips[id]=1;store();$('tipT').textContent=text;$('tip').classList.add('on');clearTimeout(this.t);this.t=setTimeout(()=>this.hide(),9000)},
 hide(){clearTimeout(this.t);const e=$('tip');if(e)e.classList.remove('on')},
 level(n){setTimeout(()=>{if(n===1)this.show('move',Orient.mobile?'Defeat every enemy. Move with the left circle. Hold the red FIRE circle to shoot and drag it to aim; it aims at the nearest enemy when you do not drag.':'Defeat every enemy. Move: W A S D or arrow keys. Aim with the mouse, click to shoot.');
  else if(n===2)this.show('bomb','New: bombs. '+(Orient.mobile?'Tap BOMB':'Press B')+' to throw one. Enemies near the blast take the most damage.')},1200)}};
$('cfmYes').onclick=()=>Confirm.yes();$('cfmNo').onclick=()=>Confirm.no();$('tipX').onclick=()=>Tips.hide();
/* a second tap on the same button within a quarter of a second is ignored, so one action cannot run twice */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b)return;const n=Date.now();if(b._t&&n-b._t<260){e.stopImmediatePropagation();e.preventDefault();return}b._t=n},true);


/* SETTINGS: music / effects / voice volume, voice, sound and music on/off all live here; opened from the main menu or the pause screen, CANCEL (or Esc) goes back to where it came from */
const Settings={from:'menu',
 open(){if(state!=='menu'&&state!=='pause')return;this.from=state;state='settings';updSnd();Voice.refresh();show('settings')},
 close(){if(state!=='settings')return;state=this.from;show(state)}};
$('setb').onclick=()=>Settings.open();$('psetb').onclick=()=>Settings.open();$('setClose').onclick=()=>Settings.close();

/* CHARACTER choice (saved in SAVE.gender; RESET GAME clears it) */
const Gender={apply(){document.body.classList.toggle('fem',SAVE.gender==='f')},
 ask(){state='gsel';show('gsel')},
 pick(g){SAVE.gender=g;store();this.apply();state='menu';toMenu();sfx('ok');if(!SAVE.tutDone)setTimeout(()=>{if(state==='menu')Tut.open()},300)}};
$('gM').onclick=()=>Gender.pick('m');$('gF').onclick=()=>Gender.pick('f');Gender.apply();

$('cin').addEventListener('focus',()=>setTimeout(()=>{try{$('cin').scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}},350));
