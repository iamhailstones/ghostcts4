// Offline checks for GHOST CTS-4:  node tests/verify.js
// Covers: exactly 50 levels, a gate for every level, MCQ answer keys, hints that never reveal answers,
// and every coding challenge run through the same pipeline the game uses (accepts valid answers, rejects wrong ones).
const { load } = require('./harness.js');
const L = load(['js/utils.js','js/levels.js','js/config.js','js/storage.js','js/challenges.js','js/editor.js','js/pyrules.js']);
const R = L.run;
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('  FAIL  ' + msg); } };
const section = t => console.log('\n' + t);

/* ---------- 1. exactly 50 levels ---------- */
section('1. level tables');
ok(R('LEVELS_TOTAL') === 50, 'LEVELS_TOTAL must be 50');
for (const t of ['LV', 'COUNT', 'POOL', 'TIPS', 'BRIEF']) ok(R(t + '.length') === 50, t + ' must have exactly 50 entries, has ' + R(t + '.length'));
ok(R('CFG.mag') === 60, 'pistol magazine must be 60, is ' + R('CFG.mag'));
ok(R('CFG.bombs') === 10 && R('CFG.maxBombs') === 10, 'bombs must start at 10 and cap at 10');

/* ---------- 2. a gate for every level 1-49 ---------- */
section('2. gates (levels 1-49) and the boss challenge');
const MCQ = R('MCQ'), CH = R('CH');
for (let l = 1; l <= 10; l++) for (let q = 1; q <= 3; q++) ok(MCQ.filter(m => m.lvl === l && m.qNum === q).length === 1, `level ${l} question ${q}: need exactly one question`);
ok(MCQ.length === 30, 'there must be exactly 30 multiple-choice questions, found ' + MCQ.length);
for (let l = 11; l <= 49; l++) ok(CH.filter(c => c.lvl === l).length === 1, `level ${l}: need exactly one gate challenge`);
ok(CH.filter(c => c.lvl === 50).length === 1 && CH.find(c => c.lvl === 50).id === 'boss_override', 'level 50 must have the boss_override challenge');
ok(CH.length === 40, 'expected 40 coding challenges, found ' + CH.length);

/* ---------- 3. MCQ answer keys (independent record of the correct option text) ---------- {level.question: text} */
section('3. multiple-choice answer keys');
const GOLD = {'1.1':'ammo = 15','1.2':'remaining = total - used','1.3':'ghost_operative','2.1':'"Ghost"','2.2':'"GHOST CTS-4"','2.3':"<class 'str'>",
 '3.1':'42.0','3.2':'3.5','3.3':'3','4.1':'True and False','4.2':'==','4.3':'!=','5.1':'False','5.2':'True','5.3':'False',
 '6.1':'Colon ( : )','6.2':'Consistent 4-space indentation','6.3':'elif','7.1':'#','7.2':'5','7.3':'""" or \'\'\'','8.1':'2','8.2':'2 ** 4','8.3':'HP: 100',
 '9.1':'"P"','9.2':'"T"','9.3':'"GHOST"','10.1':'int("45")','10.2':'str(50)','10.3':'"reload"'};
for (const m of MCQ) {
  const k = m.lvl + '.' + m.qNum;
  ok(m.opts.length === 4 && new Set(m.opts).size === 4 && m.opts.every(o => o.trim()), k + ': needs 4 distinct non-empty options');
  ok(Number.isInteger(m.a) && m.a >= 0 && m.a < m.opts.length, k + ': answer index out of range');
  ok(m.opts[m.a] === GOLD[k], `${k}: keyed answer is "${m.opts[m.a]}", expected "${GOLD[k]}"`);
}

/* ---------- 4. hints must not give the answer away ---------- */
section('4. hints and error messages never reveal the answer');
const words = t => (t.toLowerCase().match(/[a-z_][a-z_0-9]{3,}/g) || []);
const norm1 = t => t.toLowerCase().replace(/\s+/g, '');
for (const m of MCQ) {
  const k = 'MCQ ' + m.lvl + '.' + m.qNum, h = norm1(m.hint), right = m.opts[m.a];
  ok(m.hint && m.hint.length > 20, k + ': hint missing');
  ok(!h.includes(norm1(right)) || norm1(right).length < 2, k + ': hint contains the correct option text');
  ok(!(m.sol && h.includes(norm1(m.sol))), k + ': hint contains the solution text');
  // a word that appears only in the correct option (not in the question or any wrong option) must not be in the hint
  const seen = new Set([...words(m.q), ...m.opts.filter((_, i) => i !== m.a).flatMap(words), ...words(m.title), ...words(m.concept)]);
  const unique = words(right).filter(w => !seen.has(w));
  const hw = new Set(words(m.hint));
  for (const w of unique) ok(!hw.has(w), `${k}: hint uses the answer-only word "${w}"`);
}
const stripWs = t => t.replace(/\s+/g, '');
for (const c of CH) {
  const solLines = c.sol.split('\n').map(stripWs).filter(x => x.length >= 9);
  for (const [field, txt] of [['hint', c.hint], ['err', c.err]]) {
    const t = stripWs(txt);
    ok(txt && txt.length > 15, `${c.id}: ${field} missing`);
    for (const ln of solLines) ok(!t.includes(ln), `${c.id}: ${field} contains the solution line "${ln}"`);
    ok(!t.includes(stripWs(c.sol)), `${c.id}: ${field} contains the whole solution`);
  }
  ok(!stripWs(c.brief).includes(stripWs(c.sol)) || stripWs(c.sol).length < 16, `${c.id}: the task text already contains the whole solution`);
}

/* ---------- 5. coding challenges: accept valid answers, reject wrong ones (same pipeline as the RUN CHECK button) ---------- */
section('5. coding challenges');
const passes = (c, code) => R(`(c=>{const code=${JSON.stringify(code)};const synErr=pyStrict(code)||pySyntax(code);if(synErr)return false;const n=norm(code);if(c.ok(n))return true;if(c.testEnv){try{const e={};Py.run(n,e);if(c.testEnv(e))return true}catch(e){}}return false})(CH.find(c=>c.id===${JSON.stringify(c.id)}))`);
const T = {
 fstring: [['report = f"STATUS: ONLINE | AMMO: {ammo}"', "report = f'STATUS: ONLINE | AMMO: {ammo}'", 'report=f"STATUS: ONLINE | AMMO: {ammo}"'], ['report = "STATUS: ONLINE | AMMO: 24"', 'report = "STATUS: ONLINE | AMMO: " + str(ammo)', 'report = f"STATUS ONLINE | AMMO: {ammo}"']],
 slice: [['prefix = raw_signal[0:4]', 'prefix = raw_signal[:4]'], ['prefix = raw_signal[0:3]', 'prefix = raw_signal[1:4]', 'prefix = "7A9F"']],
 list_append: [['mag.append(10)'], ['mag.append(5)', 'mag.pop()', 'mag = [30, 20, 10]']],
 list_pop: [['round_fired = chamber.pop()'], ['round_fired = chamber.pop(0)', 'round_fired = chamber[2]', 'round_fired = 3']],
 list_len: [['count = len(weapons)'], ['count = 4', 'count = len(weapon)']],
 tuple_coords: [['target = (x, y)', 'target = (120, 340)'], ['target = (y, x)', 'target = [x, y]', 'target = (x)']],
 tuple_rearm: [['gun_list = list(gun)\ngun_list[1] += 12\ngun = tuple(gun_list)', 'g = list(gun)\ng[1] = 12\ngun = tuple(g)'], ['gun[1] = 12', 'gun_list = list(gun)\ngun = tuple(gun_list)', 'gun = ("Pistol", 12, "Caliber 9")']],
 set_unique: [['unique_ids = set(raw_ids)'], ['unique_ids = list(raw_ids)', 'unique_ids = {101, 102, 103}']],
 set_add: [['active_beacons.add("alpha_beacon")', "active_beacons.add('alpha_beacon')"], ['active_beacons.add("beta")', 'active_beacons.append("alpha_beacon")', 'active_beacons = {"alpha_beacon"}']],
 dict_lookup: [['armor_val = drone_data["armor"]', 'armor_val = drone_data.get("armor")', "armor_val = drone_data['armor']"], ['armor_val = 150', 'armor_val = drone_data["type"]']],
 dict_assign: [['shield["power"] = 100', "shield['power'] = 100", 'shield.update({"power": 100})', 'shield = {"power": 100}'], ['shield["power"] = 50', 'shield["armor"] = 100', 'shield = 100']],
 cond_compound: [['if ammo > 0 and not jammed:\n    print("FIRE")\nelse:\n    print("HOLD")', 'if not jammed and ammo > 0:\n    print("FIRE")\nelse:\n    print("HOLD")', 'if ammo > 0 and jammed == False:\n    print("FIRE")\nelse:\n    print("HOLD")'],
   ['if ammo > 0 and not jammed:\n    print("FIRE")\nelse:\n    print("FIRE")', 'if ammo > 0 or not jammed:\n    print("FIRE")\nelse:\n    print("HOLD")', 'if ammo > 0:\n    print("FIRE")\nelse:\n    print("HOLD")', 'if ammo > 0 and not jammed:\n    print("HOLD")\nelse:\n    print("FIRE")']],
 for_range: [['for i in range(3):\n    shoot()', 'for _ in range(3):\n    shoot()', 'for n in range(0, 3):\n    shoot()', 'for i in range(1, 4):\n    shoot()'], ['for i in range(4):\n    shoot()', 'while True:\n    shoot()', 'shoot()\nshoot()\nshoot()']],
 while_counter: [['while temp > 0:\n    temp -= 10', 'while temp > 0:\n    temp = temp - 10'], ['while temp > 0:\n    temp -= 5', 'while temp < 0:\n    temp -= 10', 'if temp > 0:\n    temp -= 10']],
 func_def: [['def calc_dmg(base, mult):\n    return base * mult', 'def calc_dmg(a, b):\n    return b * a'], ['def calc_dmg(base, mult):\n    return base * base', 'def calc_dmg(base, mult):\n    return base + mult', 'def calc_dmg(base):\n    return base * 2', 'def calc_dmg(base, mult):\n    print(base * mult)']],
 func_default: [['def strike(dmg=50):\n    return dmg * 2', 'def strike(d=50):\n    return 2 * d'], ['def strike(dmg=40):\n    return dmg * 2', 'def strike(dmg=50):\n    return dmg * 3', 'def strike(dmg):\n    return dmg * 2']],
 list_comp: [['doubled = [x * 2 for x in nums]', 'doubled = [2 * n for n in nums]', 'doubled = [i + i for i in nums]'], ['doubled = [x * 3 for x in nums]', 'doubled = [x * 2 for x in numbers]', 'doubled = [y * 2 for x in nums]', 'doubled = nums * 2']],
 list_filter: [['active = [t for t in threats if t > 0]', 'active = [x for x in threats if 0 < x]'], ['active = [t for t in threats if t < 0]', 'active = [t for t in threats]', 'active = [t for t in threats if t > 5]', 'active = [u for t in threats if t > 0]']],
 lambda_basic: [['sq = lambda x: x ** 2', 'sq = lambda n: n * n'], ['sq = lambda x: x * 2', 'sq = lambda x: x ** 3', 'sq = lambda x, y: x * y']],
 sort_lambda: [['threats.sort(key=lambda t: t[1], reverse=True)', 'threats.sort(reverse=True, key=lambda x: x[1])', 'threats = sorted(threats, key=lambda t: t[1], reverse=True)', 'threats.sort(key=lambda t: -t[1])'], ['threats.sort(key=lambda t: t[1])', 'threats.sort(key=lambda t: t[0], reverse=True)', 'sorted(threats, key=lambda t: t[1], reverse=True)', 'threats.sort(reverse=True)']],
 try_parse: [['try:\n    ammo = int(raw)\nexcept ValueError:\n    ammo = 0', 'try:\n    ammo = int(raw)\nexcept ValueError as e:\n    ammo = 0'], ['try:\n    ammo = int(raw)\nexcept ValueError:\n    ammo = 1', 'ammo = int(raw)', 'try:\n    ammo = int(raw)\nexcept TypeError:\n    ammo = 0']],
 str_join: [['packet = "-".join(codes)', "packet = '-'.join(codes)"], ['packet = "+".join(codes)', 'packet = codes.join("-")', 'packet = "-".join(code)']],
 class_constructor: [['class Operative:\n    def __init__(self, codename):\n        self.codename = codename', 'class Operative(object):\n    def __init__(self, name):\n        self.codename = name'], ['class Operative:\n    def __init__(self, codename):\n        self.name = codename', 'class Operative:\n    def __init__(self, codename):\n        pass', 'class Agent:\n    def __init__(self, codename):\n        self.codename = codename', 'class Operative:\n    def init(self, codename):\n        self.codename = codename']],
 json_loads: [['telemetry = json.loads(payload)'], ['telemetry = json.load(payload)', 'telemetry = json.dumps(payload)', 'telemetry = payload']],
 inheritance: [['class EliteOperative(Operative):\n    pass'], ['class EliteOperative:\n    pass', 'class EliteOperative(Elite):\n    pass']],
 args_sum: [['def total_ammo(*args):\n    return sum(args)', 'def total_ammo(*nums):\n    return sum(nums)'], ['def total_ammo(args):\n    return sum(args)', 'def total_ammo(*args):\n    return len(args)', 'def total_ammo(*args):\n    return sum(nums)']],
 generator_yield: [['def pulse_stream(limit):\n    for i in range(limit):\n        yield i', 'def pulse_stream(n):\n    for k in range(n):\n        yield k'], ['def pulse_stream(limit):\n    for i in range(limit):\n        return i', 'def pulse_stream(limit):\n    for i in range(limit):\n        yield limit', 'def pulse_stream(limit):\n    for i in range(3):\n        yield i']],
 dict_comp: [['power = {t: idx * 10 for idx, t in enumerate(targets)}', 'power = {name: 10 * i for i, name in enumerate(targets)}'], ['power = {t: idx for idx, t in enumerate(targets)}', 'power = {idx: t * 10 for idx, t in enumerate(targets)}', 'power = {t: idx * 10 for t in targets}', 'power = {t: idx * 5 for idx, t in enumerate(targets)}']],
 zip_coords: [['points = list(zip(xs, ys))'], ['points = zip(xs, ys)', 'points = list(zip(ys, xs))', 'points = list(xs, ys)']],
 any_threat: [['danger = any(d < 50 for d in dists)', 'danger = any([x < 50 for x in dists])', 'danger = any(50 > d for d in dists)'], ['danger = all(d < 50 for d in dists)', 'danger = any(d < 40 for d in dists)', 'danger = any(d < 50 for d in dist)', 'danger = any(x < 50 for d in dists)']],
 all_verified: [['secure = all(s == "online" for s in nodes)', "secure = all(n == 'online' for n in nodes)"], ['secure = any(s == "online" for s in nodes)', 'secure = all(s == "offline" for s in nodes)', 'secure = all(s == "online" for s in node)']],
 custom_exception: [['class SecurityBreach(Exception):\n    pass'], ['class SecurityBreach:\n    pass', 'class SecurityBreach(Error):\n    pass', 'class Breach(Exception):\n    pass']],
 math_hypot: [['dist = math.hypot(dx, dy)', 'dist = math.sqrt(dx**2 + dy**2)', 'dist = (dx ** 2 + dy ** 2) ** 0.5', 'dist = math.sqrt(dx*dx + dy*dy)'], ['dist = math.hypot(dx)', 'dist = dx + dy', 'dist = 50.0', 'dist = math.sqrt(dx + dy)']],
 set_intersection: [['common = a.intersection(b)', 'common = a & b', 'common = b & a'], ['common = a | b', 'common = a.union(b)', 'common = a - b']],
 regex_search: [['match = re.search(r"GHOST", stream)', 'match = re.search("GHOST", stream)'], ['match = re.match("GHOST", stream)', 'match = re.search(stream, "GHOST")', 'match = re.findall("GHOST", stream)']],
 recursion_countdown: [['def countdown(n):\n    return [n] + countdown(n - 1) if n > 0 else []', 'def countdown(n):\n    if n <= 0:\n        return []\n    return [n] + countdown(n - 1)', 'def countdown(k):\n    if k == 0:\n        return []\n    else:\n        return [k] + countdown(k - 1)'], ['def countdown(n):\n    return [n] + countdown(n - 1)', 'def countdown(n):\n    if n <= 0:\n        return []\n    return countdown(n - 1) + [n]', 'def countdown(n):\n    return list(range(n, 0, -1))']],
 dataclass_intel: [['@dataclass\nclass OperativeData:\n    name: str\n    hp: int', '@dataclass()\nclass OperativeData:\n    name: str\n    hp: int', '@dataclass\nclass OperativeData:\n    hp: int\n    name: str'], ['class OperativeData:\n    name: str\n    hp: int', '@dataclass\nclass OperativeData:\n    name: str', '@dataclass\nclass OperativeData:\n    name: int\n    hp: str']],
 walrus_operator: [['def check(payload):\n    if (n := len(payload)) > 0:\n        return n', 'def check(p):\n    if (size := len(p)) > 0:\n        return size'], ['def check(payload):\n    n = len(payload)\n    if n > 0:\n        return n', 'def check(payload):\n    if (n := len(payload)) > 0:\n        return payload', 'def check(payload):\n    if (n := len(payload)) < 0:\n        return n']],
 commander_decrypt: [['decrypted = [ord(c) ^ 42 for c in "ALPHA"]', "decrypted = [ord(ch) ^ 42 for ch in 'ALPHA']", 'decrypted = [42 ^ ord(c) for c in "ALPHA"]'], ['decrypted = [ord(c) ^ 24 for c in "ALPHA"]', 'decrypted = [ord(c) + 42 for c in "ALPHA"]', 'decrypted = [ord(c) ^ 42 for c in "OMEGA"]', 'decrypted = [ord(x) ^ 42 for c in "ALPHA"]']],
 boss_override: [['def override(key):\n    return key ^ 255', 'def override(k):\n    return 255 ^ k'], ['def override(key):\n    return key ^ 254', 'def override(key):\n    return key + 255', 'def override(key):\n    return 255']],
};
for (const c of CH) {
  const t = T[c.id]; ok(!!t, c.id + ': no test cases defined'); if (!t) continue;
  const start = c.code || '';
  ok(passes(c, start + c.sol), `${c.id}: the official solution is rejected`);
  ok(!passes(c, start), `${c.id}: the untouched starter code already passes`);
  for (const g of t[0]) ok(passes(c, start + g), `${c.id}: valid answer rejected -> ${JSON.stringify(g)}`);
  for (const b of t[1]) ok(!passes(c, start + b), `${c.id}: WRONG answer accepted -> ${JSON.stringify(b)}`);
}


/* a right answer followed by junk (a stray period, extra words, an operator) must be rejected; spaces and comments after it are fine */
section('5b. right answer + trailing junk');
for (const c of CH) {
  const t = T[c.id]; if (!t) continue; const start = c.code || '';
  for (const g of t[0]) {
    for (const junk of ['.', ' junk', ' + 1', ' )', ',']) ok(!passes(c, start + g + junk), `${c.id}: a right answer followed by ${JSON.stringify(junk)} was ACCEPTED -> ${JSON.stringify(g)}`);
  }
  ok(passes(c, start + t[0][0] + '   '), `${c.id}: trailing spaces must still be accepted`);
  ok(passes(c, start + t[0][0] + '  # my note'), `${c.id}: a trailing comment must still be accepted`);
}

/* ---------- 6. female soundtrack: runs every step of every mood through a mock Web Audio engine ---------- */
section('6. female music (soft timbres, sane pitches, no crashes)');
{
  const A = load(['js/utils.js','js/levels.js','js/config.js','js/storage.js','js/audio.js']);
  const rec = { types: new Set(), freqs: [], noise: 0, notes: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const mockAC = { currentTime: 1, sampleRate: 8000, state: 'running',
    createOscillator() { const f = param(); let v = 0; Object.defineProperty(f, 'value', { get: () => v, set: x => { v = x; rec.freqs.push(x); } });
      const o = { frequency: f, connect() {}, start() {}, stop() {} }; Object.defineProperty(o, 'type', { set: x => rec.types.add(x), get: () => 'sine' }); rec.notes++; return o; },
    createGain() { return { gain: param(), connect() {} }; },
    createBiquadFilter() { return { frequency: param(), type: '', connect() {} }; },
    createBufferSource() { rec.noise++; return { connect() {}, start() {}, stop() {}, buffer: null }; } };
  A.sandbox.__mock = mockAC;
  A.run("AC=__mock;Music.fx={};Music.master={};Music.nb={};Music.on=true;SAVE.gender='f';SAVE.mute=false;SAVE.nomusic=false");
  let crashed = null;
  for (const mood of ['boot','menu','hold','play','boss','duck']) for (const danger of [false, true]) {
    A.run(`Music.mood='${mood}';Music.danger=${danger};Music.bpm=100`);
    for (let st = 0; st < 128; st++) { try { A.run(`Music.beatFemale(${st},2)`); } catch (e) { crashed = crashed || `${mood} step ${st}: ${e.message}`; } }
  }
  ok(!crashed, 'beatFemale crashed: ' + crashed);
  for (const kind of ['win', 'lose']) { try { A.run(`Music.stinger('${kind}')`); } catch (e) { ok(false, 'stinger ' + kind + ' crashed: ' + e.message); } }
  ok(rec.notes > 3000, 'the track should produce plenty of notes, got ' + rec.notes);
  ok([...rec.types].every(t => t === 'sine' || t === 'triangle'), 'female music must only use soft waveforms (sine/triangle), found: ' + [...rec.types].join(','));
  ok(rec.freqs.every(f => Number.isFinite(f) && f > 40 && f < 12000), 'every pitch must be audible and finite');
  const lowest = Math.min(...rec.freqs), highest = Math.max(...rec.freqs);
  console.log(`  ${rec.notes} oscillator notes, pitch range ${lowest.toFixed(0)}-${highest.toFixed(0)} Hz, waveforms: ${[...rec.types].join(', ')}`);
  ok(A.run("Music.bpm=100;(()=>{Music.mood='play';SAVE.gender='f';Music.sync&&0;return FEM_CHORDS.length})()") === 4, 'four chords expected');
  // the tune must stay inside the C-major scale (so it can never clash with the chords), and cover 8 bars
  const mel = A.run('FEM_MEL'), scale = new Set([0, 2, 4, 5, 7, 9, 11]), outside = [];
  mel.forEach((bar, b) => bar.forEach(([st, semi]) => { if (!scale.has(((semi % 12) + 12) % 12)) outside.push(`bar${b}:${semi}`); }));
  ok(outside.length === 0, 'melody notes outside C major: ' + outside.join(' '));
  ok(mel.length === 8 && mel.every(b => b.length > 0), 'melody must cover 8 bars');
}

console.log(`\n${checks} checks, ${fails} failed`);
process.exit(fails ? 1 : 0);
