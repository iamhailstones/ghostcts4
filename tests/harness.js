// Loads the game real JS modules into a Node vm sandbox with a stub DOM, so the data tables and answer checkers can be tested offline.
const vm = require('vm'), fs = require('fs'), path = require('path');

function makeEl() {
  const el = {
    style: {}, dataset: {}, children: [], classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild(c) { el.children.push(c); return c; }, remove() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; }, getContext() { return ctx2d; },
    setAttribute() {}, getAttribute() { return null; }, focus() {}, blur() {}, closest() { return null; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 900, height: 600 }; },
    width: 900, height: 600, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false,
  };
  return el;
}
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ctx2d), set: (t, k, v) => { t[k] = v; return true; } });

function load(files, extra = {}) {
  const els = {};
  const document = {
    getElementById: id => els[id] || (els[id] = makeEl()),
    createElement: () => makeEl(), addEventListener() {}, removeEventListener() {},
    body: makeEl(), documentElement: makeEl(), querySelector: () => makeEl(), querySelectorAll: () => [],
    activeElement: null, fullscreenElement: null,
  };
  const store = {};
  const sandbox = {
    document, console, Math, JSON, Date, Object, Array, Set, Map, Number, String, Boolean, RegExp, Error, Promise, Symbol,
    parseInt, parseFloat, isNaN, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    navigator: { userAgent: 'node', maxTouchPoints: 0, vibrate() {} },
    location: { href: 'http://localhost/', hostname: 'localhost', search: '', hash: '' },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    innerWidth: 900, innerHeight: 600, devicePixelRatio: 1, screen: { width: 900, height: 600 },
    AudioContext: undefined, webkitAudioContext: undefined, speechSynthesis: undefined, SpeechSynthesisUtterance: undefined,
    fetch: () => Promise.reject(new Error('no net')), Image: function () {}, ...extra,
  };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  sandbox.addEventListener = () => {}; sandbox.removeEventListener = () => {};
  vm.createContext(sandbox);
  const root = process.env.GAME_ROOT || path.join(__dirname, '..');
  for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    try { vm.runInContext(src, sandbox, { filename: f }); }
    catch (e) { throw new Error('load ' + f + ': ' + e.message); }
  }
  return { sandbox, els, store, run: code => vm.runInContext(code, sandbox) };
}
module.exports = { load, makeEl };
