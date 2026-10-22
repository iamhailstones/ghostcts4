# GHOST CTS-4: Code to Survive

A top-down browser shooter that teaches Python. Survive 10 levels, defeat THE COMMANDER, and solve Python challenges to earn ammo, shields, bombs and abilities.
Pure HTML5, CSS3 and vanilla JavaScript on a canvas. No dependencies, no backend, no build step.

## Run it (Ubuntu / Linux)
```bash
cd ghost-cts4
xdg-open index.html            # simplest
# or, with a local server (needed for the offline service worker):
python3 -m http.server 8000    # then open http://localhost:8000
```

## Title and loading screen
The official title is **GHOST / CODE TO SURVIVE** with a **CTS4** tag attached to it. `js/boot.js` plays the intro (smoke, embers, blinking eyes, glitch reveal), shows real initialization progress, and reports errors with a RETRY button. Reduced-motion settings are respected. Art: `assets/ghost-key-art.jpg`.

## Gun system
Five weapons named after Python types, each following its type's rule: **TUPLE** (immutable pistol, refilled by the tuple rearm), **LIST** (mutable, ordered SMG), **SET** (shotgun: each enemy hit once per blast), **DICT** (rifle: damage looked up by enemy type) and **RANGE** (sniper: `range(3)` pierces 3 enemies). Earn credits by defeating enemies and clearing levels, then spend them in the GUN MARKET (button in the main menu, or **G** during a level). Each bought weapon has its own ammo; buy more in the market. The default pistol is refilled with Python: when its magazine is empty a pop-up offers a normal reload or the tuple rearm (`list(gun)`, change index 1, `tuple(...)`). Weapon data lives in `WEAPONS` in `js/weapons.js`.

## Python rules
Every weapon's ammo is a real Python value that the game validates: **TUPLE** `(magazine, reserve)` and **RANGE** are immutable (convert/rebuild to change them), **LIST** is edited in place, **SET** holds unique shell ids, **DICT** is read and written by key. When a magazine runs out on an immutable weapon, or the rules are broken, the game pauses in a console (`js/pyrules.js`) that runs the player's simple statements with real Python error messages. Lessons also check indentation and block structure (`pySyntax`). This is a small interpreter for a few statements, not full Python.

## Phone landscape mode
`js/orient.js` silently asks the browser for fullscreen + landscape on phones: at launch, and again on the player's first taps (the DEPLOY tap counts). No prompt is shown. Browsers refuse to rotate a page without a tap, and iPhone Safari cannot lock orientation at all; there the game just keeps working. To start in landscape with **no tap at all**, install the game (Add to Home Screen uses `"orientation": "landscape"` from `manifest.json`) or wrap it for the Play Store (Bubblewrap/Capacitor: set the Android screen orientation to landscape). Desktop is unchanged. The tuple gun holds 30 rounds and refills to 30 through the Python rearm every time it runs dry.

## Phones, tablets and the lesson editor
On touch screens every panel is full-screen and scrolls inside itself, the touch controls sit at the screen edges (and only while playing), and the game picture fills the screen height in landscape without stretching. Laptops/desktops keep the original layout. If landscape cannot be locked (iPhone Safari), a rotate prompt appears; it disappears when the phone is turned. Characters are drawn ~20% larger (30% on phones) and the HUD scales from its own corners. The lesson editor (`js/editor.js`) is a plain textarea with Python-aware 4-space auto-indent (tokenizer based: strings, comments, brackets), Tab/Shift+Tab/Backspace by indent level, else/elif/except/finally alignment, and the caret always kept in view; lessons require 4 spaces under a block header.

## Audio, voice, exit and beginner help
`js/audio.js` is one mixer (music bus + effects bus + compressor) with synthesized cinematic music: slow piano, strings, deep drones and restrained percussion that follow the game state (loading, menu, fight, boss, low health, mission complete, game over). `js/voice.js` speaks short announcements with the browser's built-in speech synthesis (best female English voice available, cooldowns, priorities, nothing queued; silent if the device has no speech). Music / effects / voice volumes and a Voice on/off switch are in the menu and the pause screen. EXIT GAME (menu and pause) asks for confirmation, saves, stops music, speech and the frame loop, and shows GAME EXITED with a way back to the menu. First-time tips and a short how-to in the lesson screen guide beginners.

## Soldier assistant, tutorial, practice mode and music (latest)
- **Assistant** (`js/assistant.js`): click the smiling soldier in the main menu. Answers come from the game's own knowledge notes (offline, accurate, never invented; unknown questions get an honest reply). It is not a live language model. To connect one, set `AI_CONFIG.endpoint` to *your own server proxy* (API keys must stay on the server); if it fails, the offline notes answer and a RETRY button appears. Voice input uses the browser's speech recognition where available; answers can be read aloud (voice picker, preview, stop, on/off).
- **Tutorial**: "Welcome! Here's how to play", 6 steps, opens on the first visit and from HOW TO PLAY.
- **Practice Mode** (`js/practice.js`): nothing is hard-coded in the browser. Every exercise (real function-writing tasks, plus read-and-predict and short-answer questions) is generated by the backend AI, or by the backend's verified offline bank when the AI is down, and every answer is checked by the **backend**: it runs your function against hidden tests in its own safe interpreter (`backend/pyrun.py`, no `exec`/`eval`) and explains the first problem (indentation, syntax, logic, runtime, output, unsupported). Difficulty starts easy and follows your results. Without a connected backend the mode says so instead of inventing exercises. Training Mode was removed; the in-game lessons (press C, PY on a phone) remain.
- **Indentation** (`pySyntax`): context-aware, 4 spaces per block level, line/found/expected messages, multiline brackets are free, tabs are rejected.
- **Music**: energetic synthesized street style (default) or the cinematic style (STYLE button). No audio files are needed.
- **Contact**: X https://x.com/GHOST_CTS_3 and mailto:iamhailstones@gmail.com (icons next to the soldier).

## Controls
| Action | Desktop | Mobile |
|---|---|---|
| Move | W A S D or arrow keys | left joystick |
| Aim / shoot | mouse / left click | red FIRE circle: hold to shoot, drag to aim (auto-aims at the nearest enemy) |
| Reload | R | R button |
| Bomb | B | BOMB button |
| Phantom Strike (after the function challenge) | Q | Q button |
| Python challenge | C | PY button |
| Gun market (menu button) / switch weapon | G / 1-5 or E | GUN and SW buttons |
| Python rule console (opens by itself when an immutable weapon runs dry or R is pressed on it) | P | - |
| Pause / mute sounds / music | Esc / M / N | pause button in the HUD |

## Project structure
```
ghost-cts4/
  index.html          page markup, loads everything below
  manifest.json, sw.js  installable/offline support
  css/style.css       all styling and touch controls
  js/
    utils.js          helpers (canvas, clamp, random)
    levels.js         CONFIG, enemy types, level table, level briefings
    storage.js        localStorage with safe fallbacks
    challenges.js     Python challenges + pattern validators
    audio.js          synthesized sound effects, mute toggle
    game.js           state, level setup, update loop, level completion
    weapons.js        shooting and reloading
    bombs.js          bombs and area damage with falloff
    enemies.js        enemy creation, AI, boss, wave spawning
    player.js         player damage, abilities
    ui.js             menu, overlays, challenge terminal, HUD
    render.js         all canvas drawing
    touch.js          mobile controls
    boot.js           cinematic loading screen and shared title lockup
    main.js           input, game loop, start-up
  tests/              node tests (see below)
  assets/             icon and notes
```
Files are plain scripts sharing one scope (not ES modules) so the game also works when opened straight from disk.

## Extending
- **New level:** add a number to `COUNT`, a list to `POOL`, a name to `LV` and a briefing to `BRIEF` in `js/levels.js`.
- **New enemy:** add an entry to `TYPES` (hp, sp, dmg, r, col, pts, optional `range`/`strafe`) and use its name in `POOL`.
- **New Python challenge:** append an object to `CH` in `js/challenges.js` with `id, diff, title, concept, brief, code, hint, ok(code), err, why, win(player)`. Add a good answer to `tests/challenges.test.js`.
- **Balance:** all starting values live in `CFG`.

## Tests
```bash
node tests/challenges.test.js   # every challenge accepts a right answer, rejects empty/commented code; levels get harder
node tests/smoke.test.js        # plays levels 1-10 in a fake browser to catch runtime errors
```

## How the Python challenges work (honest version)
Player code is **never executed**. Each answer is checked against accepted patterns (regular expressions) after comments are stripped. Valid code written in an unexpected style may be rejected, and invalid code that matches the pattern may be accepted. The checker sits behind `c.ok(code)`, so a sandboxed Python runner (for example Pyodide in a Web Worker, or a locked-down server) can replace it later without touching the game.

## Current limitations
- No mini-boss at level 6 and no weapon pickups yet.
- Aiming on touch devices uses a joystick, not direct touch.
- Touch controls and the visuals have not been verified on real phones; the automated tests use a simulated browser, not real rendering.
- Save data lives in the browser's localStorage.

## Publishing to the Google Play Store
Not store-ready yet. Typical path: host the game over HTTPS, then package it as an Android app with Bubblewrap (Trusted Web Activity) or Capacitor. You will also need 512x512 PNG icons and screenshots, a signed app bundle, a privacy policy, a Play developer account, and real-device testing.


## Security and packages (CTS-4)
- Secrets never live in the game: the AI key is read by the **private backend** from environment variables. `js/config.js` only holds the public backend address (`apiBase`).
- `.gitignore` protects `.env*`, keys, credentials, caches and the private `backend/` folder from the public repo. See the comments inside it. Already-committed files stay tracked until you run `git rm -r --cached <path>` (this keeps your local copy); Git history is not rewritten, so rotate any key that was ever committed.
- `python3 scripts/build_packages.py` builds and verifies two archives: **ghost-cts4-public.zip** (static game only: safe for GitHub Pages) and **ghost-cts4-full.zip** (everything, including the private backend, tests and `.env.example`; never contains a real `.env`).


## CTS-4 look and feel
- **Loading screen:** masked, hooded figure with two glowing red eyes that blink. It is always laid out as landscape: on a touch device held upright the screen is shown turned 90 degrees (turn the phone sideways and it fits; it also works with rotation locked). The installed app (manifest) opens in landscape.
- **In the game:** Ghost is a black hooded figure with a red-banded wide hat and a pale mask. His light is very bright (warm glow plus a long beam). The floor is deep crimson on every level; obstacles are unchanged.
- **Music** starts on the first tap or key (browsers forbid sound before that), plays on every screen, and wakes up again after the phone or tab was suspended.
- **Voice** speaks whole answers sentence by sentence, never reads links or markdown, and says "CTS" as separate letters ("see tee ess four"), including when welcoming the player by name.

- **Forced landscape:** on phones and small tablets an upright device shows a full-screen "turn your phone sideways" screen over everything (loading screen included) with no way to skip it. A tap asks Android browsers for fullscreen + landscape lock; iPhones (which cannot be locked) need the phone turned. A mission pauses automatically if the phone is turned upright. Desktops and laptops are never affected.
- **Assistant:** a masked man in a suit and hat waves from the main menu, right under HOW TO PLAY, next to "Ask me anything!".
