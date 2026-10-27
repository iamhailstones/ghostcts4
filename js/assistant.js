 "use strict";
/* assistant.js - the smiling soldier "AI Game Assistant" (chat, voice input, voice answers) and the first-time tutorial.
   HONEST SCOPE: answers come from the game's own knowledge notes (KB below), matched to the question, so they work offline and never invent features.
   It is not a live language model. To connect a real model, set AI_CONFIG.endpoint to YOUR server proxy (keys must stay on the server, never in this file);
   if that request fails the assistant falls back to the local notes and offers a retry. */
const AI_CONFIG={override:'',timeoutMs:25000,get endpoint(){return this.override||(GHOST_CONFIG.apiBase?GHOST_CONFIG.apiBase.replace(/\/+$/,'')+'/api/ai/chat':'')},set endpoint(v){this.override=v}};
const KB = [
{id:'creator',k:['hailstones','who is hailstones','who is iam hailstones','who is iamhailstones','who created ghost cts-4','who created ghost cts4','who created ghostcts4','who created ghost cts 4','who created ghost cts 3','who created ghost cts3','who developed ghost cts4','who developed ghost cts 4','who made this game','who made ghost','who made ghost cts4','who built ghost','who is the developer','who is the creator','who owns ghost cts4','game creator','game developer','creator of ghost','developer of ghost'],a:'Hailstones (@iamhailstones) is the developer and creator of GHOST CTS-4: Code to Survive, and GHOST CTS-3.'},

{id: 'workings', k:['how does this game works', 'tell me about the game'], a: 'It is a Python Combat Simulator that teaches python using combat tools integrated with python syntaxes'},

{id:'hello',k:['hello','hi','hey','heyy','heyyy','helo','hii','hiii','hiya','yo','yoo','sup','wassup','whats up','what is up','what up','wsg','howdy','good day','hey bro','hi bro','hello bro','yo bro','sup bro'],a:"Hi, Python soldier! I'm the GHOST CTS-4 AI Game Assistant. I can explain the controls, weapons, missions, scoring, Practice Mode and Python concepts. What do you need help with?"},

{id:'identity',k:['who are you','who r u','what are you','what are u','your name','whats your name','what is your name','whats ur name','are you ai','are u ai','are you a bot','are u a bot','are you human','are u human','who am i talking to'],a:"I'm the GHOST CTS-4 AI Game Assistant. I'm here to help you understand the game, its weapons, controls, missions and Python challenges."},

{id:'how_are_you',k:['how you doing','how ya doing','how you doin','how ya doin','how are you doing','how are you','how r u','how r ya','hru','hr u','sup','wassup','what up','wsg','wyd','how yall doing','how y’all doing','how u doing','how u doin','u good','you good','howzit','how things going','how things goin','how you been','how ya been','how u been','hows it going','how is it going','how it going','how it goin','how you feelin','how ya feelin','how far','how far bro','wetin dey'],a:"I'm fine, thank you! Ready to help you with GHOST CTS-4. What can I do for you?"},

{id:'morning',k:['good morning','morning bro','morning soldier','gm'],a:'Good morning, soldier! Welcome to GHOST CTS-4. How can I help you today?'},

{id:'afternoon',k:['good afternoon','afternoon bro','good afternoon soldier'],a:'Good afternoon, soldier! Welcome to GHOST CTS-4. What do you need help with?'},

{id:'evening',k:['good evening','evening bro','good evening soldier'],a:'Good evening, soldier! Welcome to GHOST CTS-4. How can I help you today?'},

{id:'thanks',k:['thanks','thank you','thank u','thx','ty','tysm','thanks bro','thank you bro','appreciate it','much appreciated','cheers','nice one','you helped me','that helps'],a:"Any time, soldier. Stay sharp out there."},

{id:'welcome',k:['you are welcome','ur welcome','no problem','no worries','my pleasure','all good'],a:"You're welcome, soldier. Keep learning and stay alive out there."},

{id:'goodbye',k:['bye','goodbye','see ya','see you','later','catch you later','gotta go','im leaving','i am leaving','peace out','take care','good night'],a:'Stay sharp, soldier. See you on the next mission!'},

{id:'motivation',k:['motivate me','encourage me','i give up','this is hard','too difficult','i cant do it','i can’t do it','im struggling','i am struggling','need motivation','inspire me','i feel stuck','i am a beginner','im a beginner'],a:"Every skilled coder started as a beginner. Take one challenge at a time, read the instructions carefully and learn from each mistake. Keep going, soldier!"},

{id:'capabilities',k:['what can you do','what can u do','what can you help with','can you help me','can u help me','what do you know','what do u know','are you smart','how smart are you','do you know everything','can you answer questions','how do you work','how do u work','introduce yourself','help me'],a:"I can explain GHOST CTS-4 controls, weapons, missions, scoring, enemies, game mechanics and Python concepts using the game's knowledge notes. When the online AI service is available, I may also answer broader questions. Offline answers are limited to the built-in information."},

{id:'game_name',k:['what is ghost cts4','what is ghost cts-4','what is ghost cts 4','what is cts','what does cts mean','cts meaning','meaning of cts4','meaning of cts-4','tell me about ghost','about this game','game information','game info','describe the game','full game name'],a:'GHOST CTS-4 stands for GHOST: Code to Survive. It is a shooter game that combines combat, weapons, missions and Python programming challenges.'},

{id:'version',k:['ghost cts 4','ghost cts-4','ghost cts4','ghostcts4','cts 4','cts-4','cts4','version 4','game version','which version','is this cts4'],a:"You're asking about GHOST CTS-4: Code to Survive, the fourth version in the GHOST CTS series."},

{id:'previous_version',k:['ghost cts3','ghost cts 3','ghost cts-3','cts3','cts 3','cts-3','previous version','old version','last version','cts3 vs cts4','difference between cts3 and cts4','ghost 3'],a:'GHOST CTS-3 is an earlier version of the GHOST: Code to Survive series. GHOST CTS-4 is the newer version.'},

{id:'controls',k:['controls','how to play','how do i play','keys','keyboard','desktop controls','pc controls','computer controls','move','movement','wasd','arrow keys','keyboard controls','how to control','game controls'],a:'Desktop: move with W, A, S, D or the arrow keys, aim with the mouse and click or hold to shoot. R reloads, B throws a bomb, E or 1–5 switch weapons, G opens the gun market, C opens a Python challenge, P opens the Python rule console, Esc pauses, M mutes sound effects and N mutes music.'},

{id:'mobile',k:['phone','mobile','touch','android','iphone','ios','stick','joystick','tablet','landscape','rotate','mobile controls','phone controls','touch controls','controls on phone','how to play on phone','how to play on mobile','mobile buttons','phone buttons','touchscreen controls','samsung','tecno'],a:'On a touchscreen, use the left circle to move and the red FIRE circle to shoot. Hold FIRE to keep firing; drag inside it to aim, or hold it to aim at the nearest enemy if that feature is active. Other buttons handle reload, bombs, weapon switching, the gun market and Python challenges. The game is designed for landscape play on phones and small tablets. Enable Auto-rotate if needed.'},

{id:'rotate',k:['rotate phone','rotate screen','screen rotation','phone sideways','turn phone','landscape mode','portrait mode','game wont rotate','game will not rotate','rotation not working','stuck in portrait','screen is vertical','vertical screen','auto rotate','autorotate'],a:'GHOST CTS-4 is designed for landscape play on phones and small tablets. Turn on Auto-rotate in your phone settings and rotate your phone sideways. Some browsers do not support automatic orientation locking.'},

{id:'objective',k:['objective','goal','mission','what do i do','win','how to win','purpose','game objective','main objective','what is the goal','how to complete the game'],a:'Each mission is a level: defeat every required enemy. There are 10 levels, and Level 10 is THE COMMANDER boss fight. Clear levels to earn score and credits, and use Python challenges to interact with special mechanics.'},

{id:'levels',k:['level','levels','how many levels','difficulty','harder','waves','wave','number of levels','how many missions','all levels','level count'],a:'There are 10 levels. Enemy counts grow from 5 up to 40, enemies become tougher on later levels, and each level can have up to three waves. Level 10 is the boss fight.'},

{id:'boss',k:['boss','commander','final boss','level 10','shield','final boss fight','commander boss','the commander','last level'],a:'Level 10 features THE COMMANDER with three phases: ranged attacks, then faster movement with reinforcements, and finally a shield that can only be disabled by completing the required Python function challenge.'},

{id:'commander_strategy',k:['how to defeat commander','kill the commander','commander strategy','commander boss fight','final mission','final level strategy','boss strategy','boss fight tips','disable boss shield','commander shield','boss shield'],a:'THE COMMANDER is the Level 10 boss. Watch the attack patterns, keep moving and use your weapons carefully. In the final phase, complete the required Python function challenge to disable the shield.'},

{id:'enemies',k:['enemy','enemies','grunt','runner','shooter','heavy','elite','types of enemies','enemy types','different enemies','enemy classes','what enemies are there','enemy behaviour','enemy behavior','enemy abilities'],a:'Enemy types include grunts that chase you, runners that rush you, shooters that fire from a distance, heavies that are slow and tough, and elites that combine chasing, strafing and shooting. They become stronger on later levels.'},

{id:'enemy_strategy',k:['how to defeat enemies','kill enemies faster','enemies too hard','enemy strategy','combat tips','survival tips','how to survive','stay alive','avoid getting killed','combat strategy','how to kill elites','how to kill heavies','tips and tricks','beginner tips','pro tips'],a:'Keep moving, aim carefully, reload before running out of ammunition and choose the right weapon for the situation. Collect useful pickups, use bombs when enemies cluster together and learn enemy movement patterns.'},

{id:'start_game',k:['start game','how to start','begin game','begin playing','play game','start playing','new game','start mission','begin mission','how do i begin','where do i start'],a:'Start from the main menu and choose the available play or mission option. Follow the on-screen instructions to enter a mission and begin surviving.'},

{id:'pause',k:['pause','pause game','how to pause','stop game temporarily','pause button','esc key','escape key','resume game','continue game','unpause','how do i resume','game paused'],a:'Press Esc on desktop to pause the game. Use the resume option or press Esc again if supported on the current screen to continue.'},

{id:'aim',k:['aim','how to aim','aiming','mouse aim','aim with mouse','shoot accurately','accuracy','crosshair','target enemy','targeting','how do i target','how to shoot enemies'],a:'On desktop, move your mouse to aim and click or hold to shoot. On phones, use the FIRE circle to aim and fire. Keep moving to avoid enemy attacks.'},

{id:'shoot',k:['shoot','fire','shooting','how to fire','how do i shoot','how to shoot','fire gun','shoot gun','left click','mouse click','hold to shoot','keep shooting','continuous shooting'],a:'On desktop, click or hold the mouse button to fire. On mobile, hold the FIRE circle to keep shooting. Aim at enemies and watch your ammunition.'},

{id:'movement',k:['how to move','move player','move character','walk','run','run away','dodge','evade','avoid bullets','movement keys','w key','a key','s key','d key','arrow keys','character movement'],a:'Use W, A, S and D or the arrow keys on desktop. On touchscreens, move with the left joystick. Keep moving to avoid incoming attacks.'},

{id:'reload',k:['reload','reloading','how do i reload','how do i reload my gun','how to reload gun','reload weapon','reload button','reload key','r button','r key','empty magazine','magazine empty','empty gun','out of ammo','out of bullets','no bullets left','ammunition','run out'],a:'Press R to reload LIST, SET and DICT weapons. The TUPLE pistol and RANGE sniper use immutable sequences, so when their magazines empty, the game opens a Python console. For the tuple, convert it to a list, add ammunition, convert it back to a tuple, then resume. The TUPLE pistol holds 30 rounds.'},

{id:'ammo_count',k:['how much ammo','how many bullets','ammo capacity','bullet capacity','magazine capacity','how many rounds','pistol ammo','tuple ammo','sniper ammo','range ammo','ammo limit','maximum bullets','max ammo'],a:'The TUPLE pistol holds 30 rounds. Other weapons have their own ammunition rules and capacities. Check the HUD to see your current ammunition.'},

{id:'tuple',k:['tuple','immutable','immutability','convert to list','tuple error','typeerror tuple','tuple assignment error','can tuple change','why tuple immutable','tuple gun'],a:'A Python tuple is an ordered sequence that cannot be changed after creation. Changing an item directly, such as ammo[0] = 30, raises a TypeError. Convert it to a list, edit the list and create a new tuple. The TUPLE pistol follows this rule.'},

{id:'list',k:['list','append','mutable','what is a list','python list','lists in python','list in python','list example','list syntax','list methods','append method','how does append work','change a list','modify list'],a:'A Python list is an ordered collection that can be changed. For example, items = [1, 2, 3] creates a list, and items.append(4) adds an item. The LIST weapon, an SMG, demonstrates mutable lists.'},

{id:'set',k:['set','unique','duplicates','what is a set','python set','sets in python','set in python','set example','set syntax','unique values','remove duplicates','set add method','how does set work'],a:'A Python set stores unique values, so duplicates are not kept. For example, {1, 2, 2, 3} represents the unique values 1, 2 and 3. The SET weapon connects this concept to shotgun mechanics.'},

{id:'dict',k:['dict','dictionary','key value','keys','python dictionary','dictionary in python','dict in python','dict example','dictionary example','key value pairs','dictionary keys','dictionary values','how does dict work'],a:'A Python dictionary stores key-value pairs. For example, damage = {"grunt": 10, "heavy": 16}. You can retrieve a value using damage["grunt"]. The DICT rifle uses this concept for enemy-specific damage multipliers.'},

{id:'range',k:['range','sniper','pierce','python range','range in python','range function','range example','range syntax','range values','range loop','how does range work'],a:'Python range(3) produces the numbers 0, 1 and 2. The RANGE sniper uses this concept and can pierce up to three enemies with one shot. Its magazine must be rebuilt when empty.'},

{id:'python_basics',k:['python','what is python','learn coding','programming','coding','python language','programming language','teach me python','python beginner','beginner coding','coding basics','python basics'],a:'Python is a programming language used to build software, automate tasks and create games. GHOST CTS-4 teaches concepts such as lists, tuples, sets, dictionaries and range through gameplay.'},

{id:'python_loop',k:['python loop','loops in python','for loop','while loop','loop example','repeat in python','iteration','iterate over list','how to loop','loop syntax'],a:'A loop repeats instructions. A for loop can visit each item in a collection, while a while loop repeats as long as its condition is true. Practise loops to strengthen your Python skills.'},

{id:'python_function',k:['python function','functions in python','def keyword','define function','function example','what is a function','how to write a function','function syntax','return statement','python return'],a:'A Python function is a reusable block of code defined with def. For example, def greet(): followed by an indented print("Hello") defines a function that prints a greeting when called.'},

{id:'python_errors',k:['python error','syntax error','typeerror','nameerror','indentationerror','why does my code fail','code not working','fix my code','debug python','debugging','python exception','error message'],a:'Python errors often come from incorrect syntax, indentation, undefined names or incompatible data types. Read the error message carefully, check the indicated line and verify that your values have the expected types.'},

{id:'indentation',k:['indentation','indentation error','indent error','spaces in python','four spaces','4 spaces','python formatting','block indentation','unexpected indent','expected indented block','tabs vs spaces'],a:'Python uses indentation to define code blocks. GHOST CTS-4 expects four-space indentation in its code challenges. Keep indentation consistent and avoid mixing tabs and spaces.'},

{id:'weapons',k:['weapon','weapons','gun','guns','pistol','smg','shotgun','rifle','which gun','best weapon','five weapons','available weapons','weapon types','all guns'],a:'There are five weapons named after Python concepts: TUPLE (pistol, free, 30 rounds), LIST (SMG, 300 credits), SET (shotgun, 450 credits), DICT (rifle, 600 credits) and RANGE (sniper, 900 credits). Switch weapons with E or keys 1–5. Each weapon follows the rules of its data type.'},

{id:'pistol',k:['pistol','tuple gun','tuple pistol','starting gun','starter weapon','free gun','basic gun','default weapon','default gun','first weapon'],a:'The TUPLE pistol is your free starting weapon. Its magazine holds 30 rounds and follows Python tuple immutability rules. Reloading requires converting the ammunition to a list, editing it and rebuilding the tuple.'},

{id:'smg',k:['smg','submachine gun','list gun','list weapon','automatic gun','rapid fire weapon','fast firing gun'],a:'The LIST weapon is an SMG that costs 300 credits. It represents a mutable Python list, which can be edited directly.'},

{id:'shotgun',k:['shotgun','set gun','set weapon','close range gun','close range weapon','spread shot'],a:'The SET weapon is a shotgun that costs 450 credits. It represents Python sets, which keep unique values rather than duplicates.'},

{id:'rifle',k:['rifle','dict gun','dictionary weapon','dict weapon','assault rifle','rifle weapon','damage multiplier','enemy damage'],a:'The DICT weapon is a rifle that costs 600 credits. It uses a Python dictionary to apply damage multipliers based on enemy type: heavy x1.6, elite x1.5, shooter x1.2 and others x1.'},

{id:'sniper',k:['sniper','sniper rifle','range gun','range weapon','long range gun','long range weapon','piercing shot','pierce enemies','sniper weapon'],a:'The RANGE weapon is a sniper rifle that costs 900 credits. It uses Python range concepts and can pierce up to three enemies with one shot.'},

{id:'market',k:['gun market','weapon market','market','buy','credits','shop','money','price','prices','afford','purchase','where can i buy guns','where to buy guns','where do i buy guns','where is the gun shop','where is gun market','how to access gun market','how to open gun market','how to buy weapons','where can i purchase weapons','gun store','weapon shop','weapons shop','buy guns in game','get new guns'],a:'Open GUN MARKET from the main menu or press G during a level. You start with 200 credits and earn more by defeating enemies and clearing levels. Use credits to buy available weapons and extra ammunition.'},

{id:'weapon_prices',k:['how much is the pistol','how much is the smg','how much is the shotgun','how much is the rifle','how much is the sniper','smg price','shotgun price','rifle price','sniper price','pistol price','cost of weapons','weapon cost','gun prices','how much do guns cost'],a:'The TUPLE pistol is free, the LIST SMG costs 300 credits, the SET shotgun costs 450 credits, the DICT rifle costs 600 credits and the RANGE sniper costs 900 credits.'},

{id:'best_gun',k:['best gun','strongest gun','most powerful weapon','best gun in the game','which gun is strongest','which weapon is strongest','which gun should i buy','what gun should i buy','recommended weapon','best gun for boss','best weapon for boss'],a:'Each weapon has a different role. The TUPLE pistol is free, the LIST SMG offers sustained fire, the SET shotgun is suited to close-range blasts, the DICT rifle applies enemy-specific damage multipliers, and the RANGE sniper pierces up to three enemies. Choose based on your situation and credits.'},

{id:'market_money',k:['how to earn credits','earn money','get credits','get more credits','need credits','not enough credits','free credits','credit system','how do credits work','money in game','game currency','how to get money','how to get rich in game','save credits','spend credits','credit tips'],a:'Earn credits by defeating enemies and clearing levels. Save your credits for the weapons you want to unlock and the extra ammunition you need.'},

{id:'bomb',k:['bomb','bombs','explosion','grenade','blast','how to throw bomb','throw bomb','use bomb','bomb button','bomb key','grenade button','grenade key','how do bombs work','bomb damage','bomb count','how many bombs','explosive'],a:'You start with five bombs and can carry up to nine. Press B on desktop or tap BOMB on a phone to throw one toward your aim. It explodes after a short fuse and enemies near the centre take the most damage. Bomb pickups give you one extra bomb.'},

{id:'health',k:['health','hp','heal','damage','die','dying','low health','pickup','pickups','health pack','health pickup','health drop','restore health','increase health','health symbol','plus sign','how to recover health','low hp','health regeneration'],a:'You have 100 health. Enemy drops include A for ammunition, + for health, G for a bomb and S for a shield. Collect health pickups to restore health. If you die, you can retry the level.'},

{id:'score',k:['score','scoring','points','total score','level score','how is score calculated','score calculation','earn points','score points','kill score','high score','scoreboard','total points','increase score'],a:'There are two scores: total score, which is kept across levels and retries, and level score, which resets whenever a level starts or is retried. Points come from kills, bomb kills, Python challenges and clearing levels.'},

{id:'level_progress',k:['next level','unlock next level','advance level','level progression','how to advance','how to progress','level completed','mission completed','finish level','clear level','complete mission','beat a level'],a:'Defeat all required enemies to clear a mission. Clearing levels earns score and credits and advances you through the ten levels.'},

{id:'practice_mode',k:['practice','practice mode','how to practice','python practice','learn python','training mode','training','practice exercises','practice python','can i learn python','python lessons'],a:'Practice Mode lets you practise Python concepts outside the pressure of combat. Use it to build confidence with the programming ideas presented in GHOST CTS-4.'},

{id:'python_challenge',k:['python challenge','python challenges','challenge mode','how to do challenges','how to solve challenges','coding challenge','code challenge','python test','coding test','challenge button','c key','open python challenge','python mission'],a:'Press C on desktop or use the PY button on mobile to open a Python challenge. Read the question carefully, enter your solution using the required Python syntax and follow the on-screen feedback.'},

{id:'python_console',k:['python console','rule console','open console','console button','console key','p key','how to open console','coding console','python editor','code editor','where to type code','where do i type python'],a:'Press P on desktop to open the Python rule console. Read the task, follow the required syntax and use the console instructions to complete the Python-based game mechanic.'},

{id:'ai_online',k:['are you online','are u online','is the ai online','is ai working','do you work offline','does this work offline','offline mode','no internet','without internet','internet connection','need wifi','need data','does it need internet','can i play offline','can i use you offline'],a:'The game can use its built-in knowledge notes offline. Broader AI responses require a working connection to the online AI service. If that service is unavailable, some AI features may not work, but local answers can still be available.'},

{id:'ai_error',k:['ai error','ai not working','assistant not working','failed to fetch','temporarily unavailable','api error','server error','connection failed','network error','ai challenge error','ai challenge not working','cannot connect to ai','cant connect to ai','online assistant error'],a:'The online AI service may be temporarily unavailable or the connection may have failed. Check your internet connection and retry. Built-in knowledge answers can still work offline, but online AI features require the backend service to be reachable.'},

{id:'voice',k:['voice','voice assistant','talk to ai','speak to assistant','voice input','voice output','speech recognition','microphone','mic not working','talk instead of typing','spoken answers','ai voice','microphone permission','allow microphone','mic permission','speech not recognised','speech not recognized','cant hear me','cannot hear me','microphone blocked','browser microphone','voice recognition error'],a:"Use the voice controls in the AI Assistant if available. Allow microphone permission for voice input, and check your device's audio settings if you cannot hear spoken responses. Some speech-recognition features require browser support or an internet connection."},

{id:'music',k:['music','game music','background music','mute music','music off','turn off music','music button','n key','no music','soundtrack'],a:'Press N to mute or unmute the game music.'},

{id:'sound',k:['sound','sounds','sound effects','audio','mute sound','mute sounds','turn off sound','sound off','m key','no sound','game audio','effects volume'],a:"Press M to mute or unmute sound effects. If you cannot hear audio, check the game's sound setting and your device's volume."},

{id:'desktop',k:['pc','computer','desktop','laptop','windows','ubuntu','linux','mac','macbook','play on computer','play on laptop','does it work on pc'],a:'GHOST CTS-4 supports desktop-style controls using the keyboard and mouse. Move with WASD or arrow keys, aim and shoot with the mouse, and use the documented keys for reloading, bombs, weapons, challenges and pausing.'},

{id:'mobile_support',k:['does it work on android','does it work on iphone','does it work on ios','does it work on samsung','does it work on tecno','does it work on mobile','phone compatibility','mobile support','play on android','play on iphone','play on samsung','play on tecno'],a:'GHOST CTS-4 is designed with mobile touch controls and landscape play. Compatibility can vary by device and browser. Use an updated browser and enable Auto-rotate if needed.'},

{id:'settings',k:['settings','game settings','options menu','configuration','change settings','audio settings','control settings','customize game','customise game','preferences'],a:"Check the game's available menus and on-screen options for settings. On desktop, M toggles sound effects and N toggles music."},

{id:'browser',k:['which browser','supported browser','browser support','chrome','firefox','edge','safari','web browser','game compatibility','does it work on chrome','does it work on firefox'],a:'GHOST CTS-4 runs in a web browser. For the best experience, use an up-to-date browser and allow the permissions needed for optional voice or orientation features.'},

{id:'game_crash',k:['game crash','game crashed','game freezes','game frozen','not responding','black screen','game not loading','loading forever','stuck loading','game stopped working','broken game','game bug'],a:'If GHOST CTS-4 freezes or fails to load, try refreshing the page and reopening the game. Check your internet connection if an online AI feature is failing. Refreshing may reset your current mission progress.'},

{id:'support',k:['hailstones social media','hailstones twitter','hailstones x','developer twitter','creator twitter','who to contact','contact developer','report a bug','report bug','send feedback','complaint','game support','support email','contact support','email developer','developer email','contact hailstones'],a:'GHOST CTS-4 was created by Hailstones (@iamhailstones). For support, feedback or complaints, contact iamhailstones@gmail.com.'}
];
const QSTOP=new Set('a an the is are do does did i you me my to of in on for and or it this that what how can with be as at by about please tell'.split(' '));
const qnorm=t=>t.toLowerCase().replace(/[^a-z0-9 +.\/-]/g,' ').replace(/\s+/g,' ').trim();
const qstem=w=>w.length>4?w.replace(/(ing|es|s)$/,''):w;
const Assistant={busy:false,seq:0,timer:0,rec:null,hist:[],
 /* best matching note, or null. Phrases count more than single words. */
 match(q){const n=' '+qnorm(q)+' ',toks=n.trim().split(' ').filter(w=>w&&!QSTOP.has(w)).map(qstem);let best=null,bs=0;
  for(const e of KB){let s=0;for(const k of e.k){const kk=qnorm(k);if(kk.includes(' ')){if(n.includes(' '+kk+' ')||n.includes(kk))s+=3}else if(n.includes(' '+kk+' ')||toks.includes(qstem(kk)))s+=2}if(s>bs){bs=s;best=e}}
  return bs>=2?best:null},
 answer(q){const t=qnorm(q);if(!t)return{text:'Type a question and I will do my best.'};if(/\b(secret|cheat|cheats|hack|infinite|unlimited|god mode|invincible|easter egg)\b/.test(t))return{text:"I'm not aware of any cheat codes or secrets in GHOST CTS-4, and I don't want to guess. I can help with controls, weapons, bombs, levels, scoring and Practice Mode.",id:'unsure'};const m=this.match(q);if(m)return{text:m.a,id:m.id};
  if(/\b(python|code|coding|syntax|variable|program)\b/.test(t))return{text:"I can explain core Python used in the game: tuples, lists, sets, dictionaries, range, functions, if/else, loops and indentation. Ask for one, for example 'What is a tuple?'.",id:'pyhelp'};
  if(/\b(game|ghost|cts|level|weapon|enemy|play)\b/.test(t))return{text:"I don't have a note on that exact thing, and I don't want to guess. I can help with controls, weapons, bombs, levels, scoring, the market, Practice Mode, audio and troubleshooting. Could you ask it another way?",id:'unsure'};
  return{text:"That is outside what I know. I'm built for GHOST CTS-4, and I'm limited to helping with the game, its controls, weapons, missions, scoring, Practice Mode, Python basics and troubleshooting. I may not know about other topics. Ask me something about GHOST CTS-4, visit the official pages on X/Twitter at https://x.com/GHOSTCTS4 or YouTube at https://www.youtube.com/@GHOSTCTS4, or email a complaint to iamhailstones@gmail.com.",id:'offtopic'}},
 async fetchRemote(q){if(!AI_CONFIG.endpoint||typeof fetch==='undefined')return null;const ac=new AbortController(),t=setTimeout(()=>ac.abort(),AI_CONFIG.timeoutMs);
  try{const r=await fetch(AI_CONFIG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,player:SAVE.name||undefined,state:{level:SAVE.lvl,credits:SAVE.credits},history:this.hist.slice(-6)}),signal:ac.signal});let d=null;try{d=await r.json()}catch(e){}if(!r.ok)throw new Error((d&&d.message)||'HTTP '+r.status);const a=d&&typeof d.answer==='string'?d.answer.trim():'';if(!a)throw new Error('empty answer');return a}finally{clearTimeout(t)}},
 sol(){const e=$('solSvg');return e},
 react(cls,ms){[$('solSvg'),$('chSol')&&$('chSol').firstChild].forEach(e=>{if(!e)return;e.classList.add(cls);setTimeout(()=>e.classList.remove(cls),ms)})},
 add(role,text){const d=document.createElement('div');d.className='cm '+role;d.textContent=text;$('chLog').appendChild(d);$('chLog').scrollTop=$('chLog').scrollHeight;return d},
 note(t){$('chNote').textContent=t},
 /* show the answer progressively (about 0.5 s at most) - it is already available, so nothing waits */
 reveal(el,text,seq){const w=text.split(' '),step=Math.max(2,Math.ceil(w.length/25));let i=0;clearInterval(this.timer);
  this.timer=setInterval(()=>{if(seq!==this.seq){clearInterval(this.timer);return}i+=step;el.textContent=w.slice(0,i).join(' ');$('chLog').scrollTop=$('chLog').scrollHeight;if(i>=w.length){clearInterval(this.timer);this.finish(text,seq)}},20)},
 finish(text,seq){if(seq!==this.seq)return;this.busy=false;$('chSend').disabled=false;this.speak(text)},
 speak(text){if(!SAVE.voice||typeof Voice==='undefined')return;Voice.speakNow(text)},
 async ask(q){q=(q||'').trim();if(this.busy)return;if(!q){this.add('user','');this.add('bot','You typed nothing. Please enter a question about GHOST CTS-4 and I will do my best to help.');this.note('');return}this.busy=true;const seq=++this.seq;$('chSend').disabled=true;$('chRetry').style.display='none';$('chIn').value='';this.add('user',q);const el=this.add('bot','');this.note('');
  if(typeof Voice!=='undefined')Voice.cancel();this.lastQ=q;
  let text=null;if(AI_CONFIG.endpoint){this.react('think',60000);el.textContent='...';this.note('Thinking...');try{text=await this.fetchRemote(q);if(text)this.note('Answered by the online AI.')}catch(e){this.note('The online assistant did not answer ('+(e.name==='AbortError'?'timed out':e.message)+'). Showing my offline notes.');$('chRetry').style.display=''}this.react('think',0);$('solSvg').classList.remove('think');if($('chSol').firstChild)$('chSol').firstChild.classList.remove('think')}
  if(seq!==this.seq)return;if(!AI_CONFIG.endpoint)this.note('Offline notes: no online AI is connected.');const r=text?{text}:this.answer(q);this.hist.push({role:'user',text:q},{role:'assistant',text:r.text.slice(0,400)});this.hist=this.hist.slice(-12);this.react('pop',600);this.reveal(el,r.text,seq);this.suggest(r.id)},
 suggest(id){const all=['How do I reload?','What weapons are there?','What is a tuple?','How does Practice Mode work?','How do I use bombs?','Why is there no sound?'],pick=all.filter(x=>!this.match(x)||this.match(x).id!==id).slice(0,3);
  $('chSug').textContent='';pick.forEach(x=>{const b=document.createElement('button');b.textContent=x;b.onclick=()=>this.ask(x);$('chSug').appendChild(b)})},
 open(){if(state!=='menu')return;state='chat';show('chatp');this.fillVoices();if(!$('chLog').childElementCount){this.add('bot',(SAVE.name?'Welcome to GHOST CTS-4, '+SAVE.name+'. Ready to survive?':'Welcome to GHOST CTS-4. Ready to survive?')+' Ask me anything about the controls, weapons, missions or Python.');this.suggest('')}this.react('pop',600);setTimeout(()=>$('chIn').focus(),50)},
 close(){if(state!=='chat')return;clearInterval(this.timer);this.seq++;this.busy=false;$('chSend').disabled=false;this.stopMic();if(typeof Voice!=='undefined')Voice.cancel();state='menu';show('menu')},
 fillVoices(){const sel=$('chVsel'),vs=Voice.list();sel.textContent='';const d=document.createElement('option');d.value='';d.textContent=vs.length?'Voice: automatic (best match)':'Voice: device default';sel.appendChild(d);vs.forEach(v=>{const o=document.createElement('option');o.value=v.name;o.textContent=v.name+' ('+v.lang+')';sel.appendChild(o)});sel.value=SAVE.voiceName||'';sel.disabled=!Voice.ok},
 stopMic(){if(this.rec){try{this.rec.stop()}catch(e){}this.rec=null}const m=$('chMic');m.classList.remove('rec');m.textContent='MIC'},
 mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){this.note('Voice input is not supported in this browser. You can type your question instead.');return}
  if(this.rec){this.stopMic();return}const r=new SR(),m=$('chMic');r.lang='en-US';r.interimResults=true;r.continuous=false;this.rec=r;m.classList.add('rec');m.textContent='QSTOP';this.note('Listening... speak your question.');
  r.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;$('chIn').value=t;if(e.results[e.results.length-1].isFinal)this.note('Heard: "'+t+'". Edit it if needed, then press SEND.')};
  r.onerror=e=>this.note(e.error==='not-allowed'||e.error==='service-not-allowed'?'Microphone permission was denied. Allow it in your browser settings, or type your question.':'Voice input stopped ('+e.error+'). You can type your question.');
  r.onend=()=>{this.rec=null;m.classList.remove('rec');m.textContent='MIC'};try{r.start()}catch(e){this.stopMic();this.note('Could not start the microphone.')}}};
/* ---------- first-time tutorial (reopen with HOW TO PLAY) ---------- */
const TUT=[
 ["Getting started","From the main menu press PLAY to start a mission (levels 1 to 10). PRACTICE MODE and AI CHALLENGE give you Python exercises from the AI, and GUN MARKET (top right of the menu) is where you buy weapons."],
 ["Playing the game","Defeat every enemy. Move with W A S D or the arrow keys (left stick on a phone), aim with the mouse (drag the red FIRE circle on a phone), and click or hold to shoot. R reloads, B throws a bomb, E or 1-5 switch weapons, G opens the market, Esc pauses."],
 ["Meet your AI soldier","Click or tap the smiling soldier in the main menu. A chat opens where you can ask about the game, the controls or Python."],
 ["Ask questions","Type a question and press SEND (or Enter). Press MIC to speak where your browser supports it. In the chat you can turn the voice on or off, stop it while it speaks, and pick a voice."],
 ["Practice Python","In PRACTICE MODE read the whole question, type the function it asks for in the code box, press RUN CHECK and read the server's feedback. Use 4 spaces for each indentation level."],
 ["Music and support","Use the MUSIC, SFX and VOICE sliders in the menu or pause screen, SETTINGS: SOUND to mute everything, and the X and mail icons next to the soldier to contact us."]];
const Tut={i:0,
 open(){if(state!=='menu')return;this.i=0;state='tut';const s=$('tutSol');if(!s.firstChild)s.appendChild($('solSvg').cloneNode(true));show('tut');this.render()},
 render(){const n=TUT.length;$('tutStep').textContent='Step '+(this.i+1)+' of '+n+' - '+TUT[this.i][0];$('tutBody').textContent=TUT[this.i][1];$('tutBack').disabled=this.i===0;$('tutNext').textContent=this.i===n-1?'FINISH':'NEXT'},
 next(){if(this.i>=TUT.length-1)return this.close();this.i++;this.render()},back(){if(this.i>0){this.i--;this.render()}},
 close(){if(state!=='tut')return;SAVE.tutDone=true;store();state='menu';show('menu')}};
if(typeof Node!=='undefined'&&typeof $==='function'&&$('asstb')){   // browser only (the node tests have no real DOM)
 const s=$('solSvg');if(s&&$('chSol')&&!$('chSol').firstChild)$('chSol').appendChild(s.cloneNode(true));
 $('asstb').onclick=()=>Assistant.open();$('chClose').onclick=()=>Assistant.close();$('chSend').onclick=()=>Assistant.ask($('chIn').value);
 $('chIn').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();Assistant.ask($('chIn').value)}});
 $('chMic').onclick=()=>Assistant.mic();$('chStop').onclick=()=>Voice.cancel();$('chRetry').onclick=()=>Assistant.ask(Assistant.lastQ);
 Voice.btns.push($('chVoice'));$('chVoice').className='vb';$('chVoice').onclick=()=>{SAVE.voice=!(SAVE.voice!==false);store();if(SAVE.voice===false)Voice.cancel();Voice.refresh()};Voice.refresh();
 $('chVsel').onchange=e=>{SAVE.voiceName=e.target.value;Voice.voice=null;store()};$('chPrev').onclick=()=>Voice.speakNow("Hi, I'm your game assistant. Ask me anything!");
 if(typeof speechSynthesis!=='undefined')try{const o=speechSynthesis.onvoiceschanged;speechSynthesis.onvoiceschanged=()=>{Voice.voice=null;if(typeof o==='function')o();if(state==='chat')Assistant.fillVoices()}}catch(e){}
 /* mailto: only works when the device has an email app (and is blocked in embedded previews) - so if the page is still focused shortly after the click, offer copy + Gmail */
 const ml=$('mailLink');ml.addEventListener('click',()=>{const w=setTimeout(()=>{if(document.hasFocus())$('mailfb').hidden=false},700);addEventListener('blur',()=>clearTimeout(w),{once:true})});
 $('mailCopy').onclick=async()=>{const a='iamhailstones@gmail.com';try{await navigator.clipboard.writeText(a)}catch(e){const i=document.createElement('input');i.value=a;document.body.appendChild(i);i.select();try{document.execCommand('copy')}catch(x){}i.remove()}$('mailCopy').textContent='COPIED';setTimeout(()=>{$('mailCopy').textContent='COPY EMAIL'},1500)};$('mailX').onclick=()=>{$('mailfb').hidden=true};
 $('tutNext').onclick=()=>Tut.next();$('tutBack').onclick=()=>Tut.back();$('tutSkip').onclick=()=>Tut.close();$('howb').onclick=()=>Tut.open()}
