import { BIRD_COLLIDERS, COMMON_RULES, CONFIG, createGame, stepGame } from './shared/physics.mjs';
import { eventTime, FlapQueue } from './game-input.mjs';
import { GameRenderer } from './game-renderer.mjs';

const telegram = window.Telegram?.WebApp;
const START_COUNTDOWN_SECONDS = 2;
const REASONS = { ceiling: 'потолок', floor: 'пол', collision: 'колонна', timeout: 'лимит 10 минут' };

const byId = id => document.getElementById(id);
const app = byId('app');
const renderer = new GameRenderer(byId('game-canvas'));
const store = {
  get(key, fallback) { try { const v = localStorage.getItem('flap-mini:' + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem('flap-mini:' + key, JSON.stringify(value)); } catch {} },
};

const hitboxHeight = id => {
  const c = BIRD_COLLIDERS[id];
  return Math.max(...c.map(([, y, r]) => y + r)) - Math.min(...c.map(([, y, r]) => y - r));
};
const roster = Object.keys(BIRD_COLLIDERS).sort((a, b) => hitboxHeight(a) - hitboxHeight(b));
let selected = Math.max(0, roster.indexOf(store.get('character', 'gensyxa')));
let rules = store.get('rules', CONFIG.VERSION);
renderer.showSprite = store.get('sprite', false);
let screen = 'menu';
let run = null;
let startingField = null;

function setText(id, text) {
  const el = byId(id);
  if (el.textContent !== String(text)) el.textContent = text;
}

function updateMenu() {
  const id = roster[selected];
  setText('character-name', id);
  setText('character-hitbox', `хитбокс ${hitboxHeight(id)} px`);
  setText('best-score', store.get('best:' + id, 0));
  byId('rules-23').setAttribute('aria-pressed', String(rules === CONFIG.VERSION));
  byId('rules-24').setAttribute('aria-pressed', String(rules === COMMON_RULES));
  byId('sprite-toggle').checked = renderer.showSprite;
}

function showScreen(name) {
  screen = name;
  for (const section of document.querySelectorAll('[data-screen]')) section.hidden = section.dataset.screen !== name;
  if (name === 'game') telegram?.BackButton?.show(); else telegram?.BackButton?.hide();
  fitViewport();
}

// Same viewport logic as the game: Telegram's stable height, safe-area insets, world scale from the height.
function fitViewport() {
  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth;
  const height = (telegram?.initData && telegram.viewportStableHeight) || viewport?.height || window.innerHeight;
  const inset = edge => Math.max(0, telegram?.safeAreaInset?.[edge] || 0, telegram?.contentSafeAreaInset?.[edge] || 0);
  const top = inset('top'), bottom = inset('bottom'), left = inset('left'), right = inset('right');
  const availableWidth = Math.max(1, width - left - right);
  const availableHeight = Math.max(1, height - top - bottom);
  const worldScale = availableHeight / CONFIG.HEIGHT;
  const frameScale = Math.min(availableWidth / CONFIG.WIDTH, worldScale);
  const center = left + availableWidth / 2;
  const frameTop = top + (availableHeight - CONFIG.HEIGHT * frameScale) / 2;
  for (const [name, value] of Object.entries({ 'scene-center': center, 'frame-top': frameTop, 'safe-top': top, 'safe-bottom': bottom })) {
    app.style.setProperty(`--${name}`, `${value}px`);
  }
  app.style.setProperty('--frame-scale', String(frameScale));
  app.style.left = `${viewport?.offsetLeft || 0}px`;
  app.style.top = `${viewport?.offsetTop || 0}px`;
  app.style.width = `${width}px`;
  app.style.height = `${height}px`;
  if (screen === 'game') {
    renderer.resize(width, height, worldScale, left, top);
    if (run && !run.finished) renderer.drawFlight(run.simulation, run.visualFraction, run.visualTapPhase);
    else if (run) renderer.draw(run.simulation);
    else if (startingField) renderer.draw(startingField);
  }
}

function randomSeed() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0];
}

function beginGame() {
  const character = roster[selected];
  if (run) cancelAnimationFrame(run.frameId);
  byId('result').hidden = true;
  setText('game-score', 0);
  startingField = createGame(0, character, rules);
  run = null;
  showScreen('game');
  // The seed would come from the server; here it is local. Everything after this is the same loop.
  const startPerformance = performance.now() + START_COUNTDOWN_SECONDS * 1000;
  const active = run = {
    character,
    simulation: createGame(randomSeed(), character, rules),
    displayedScore: 0,
    startPerformance,
    lastFrame: startPerformance,
    accumulated: 0,
    inputs: new FlapQueue(),
    visualFraction: 0,
    visualTapPhase: null,
    countingDown: true,
    finished: false,
    frameId: 0,
  };
  startingField = null;
  renderer.draw(active.simulation);
  byId('game-canvas').focus({ preventScroll: true });
  showCountdown(active, startPerformance, START_COUNTDOWN_SECONDS, () => { active.countingDown = false; });
}

function showCountdown(active, deadline, seconds, complete) {
  const overlay = byId('resume-overlay');
  setText('resume-countdown', seconds);
  overlay.hidden = false;
  const count = now => {
    if (run !== active || screen !== 'game') return;
    if (now < deadline) {
      setText('resume-countdown', Math.min(seconds, Math.ceil((deadline - now) / 1000)));
      active.frameId = requestAnimationFrame(count);
      return;
    }
    overlay.hidden = true;
    complete();
    frame(now);
  };
  count(performance.now());
}

function frame(now) {
  const active = run;
  if (!active || active.finished || screen !== 'game') return;
  if (now < active.startPerformance) {
    active.frameId = requestAnimationFrame(frame);
    return;
  }
  const elapsed = now - active.lastFrame;
  active.lastFrame = now;
  active.accumulated += Math.min(Math.max(elapsed, 0), 1000);
  while (active.accumulated >= CONFIG.STEP_MS && active.simulation.alive) {
    const tickEnd = now - active.accumulated + CONFIG.STEP_MS;
    stepGame(active.simulation, active.inputs.takeBefore(tickEnd));
    active.accumulated -= CONFIG.STEP_MS;
  }
  if (active.simulation.score !== active.displayedScore) {
    active.displayedScore = active.simulation.score;
    setText('game-score', active.displayedScore);
  }
  if (active.simulation.alive) {
    active.visualFraction = Math.min(1, active.accumulated / CONFIG.STEP_MS);
    active.visualTapPhase = active.inputs.phase(now - active.accumulated, CONFIG.STEP_MS);
    renderer.drawFlight(active.simulation, active.visualFraction, active.visualTapPhase);
    active.frameId = requestAnimationFrame(frame);
    return;
  }
  active.finished = true;
  renderer.draw(active.simulation);
  telegram?.HapticFeedback?.notificationOccurred?.('error');
  setTimeout(() => showResult(active), 650);
}

function showResult(active) {
  if (run !== active || screen !== 'game') return;
  const state = active.simulation;
  const key = 'best:' + active.character;
  const best = Math.max(store.get(key, 0), state.score);
  store.set(key, best);
  setText('result-score', state.score);
  setText('result-detail', `${REASONS[state.endedReason] || state.endedReason} · ${(state.tick / CONFIG.TICK_RATE).toFixed(1)} с · рекорд ${best}`);
  byId('result').hidden = false;
}

function goBack() {
  if (run) cancelAnimationFrame(run.frameId);
  run = null;
  byId('result').hidden = true;
  byId('resume-overlay').hidden = true;
  updateMenu();
  showScreen('menu');
}

// Same input path as the game: any primary pointer press on the app, or Space / ArrowUp.
function requestFlap(event) {
  if (screen !== 'game' || !run || run.finished || run.countingDown || performance.now() < run.startPerformance) return;
  if (event.target instanceof Element && event.target.closest('button,a,[data-action]')) return;
  if (event.type === 'pointerdown' && event.button !== 0) return;
  event.preventDefault();
  const time = eventTime(event.timeStamp, performance.now(), performance.timeOrigin);
  if (time >= run.startPerformance) run.inputs.add(time);
}

function handleAction(event) {
  const target = event.target instanceof Element ? event.target.closest('[data-action]') : null;
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'prev' || action === 'next') {
    selected = (selected + (action === 'next' ? 1 : -1) + roster.length) % roster.length;
    store.set('character', roster[selected]);
    telegram?.HapticFeedback?.selectionChanged?.();
    updateMenu();
  } else if (action === 'rules-23' || action === 'rules-24') {
    rules = action === 'rules-24' ? COMMON_RULES : CONFIG.VERSION;
    store.set('rules', rules);
    updateMenu();
  } else if (action === 'play' || action === 'again') beginGame();
  else if (action === 'menu') goBack();
}

function start() {
  telegram?.ready();
  telegram?.expand();
  try {
    if (telegram?.isVersionAtLeast?.('7.7')) telegram.disableVerticalSwipes();
    if (telegram?.isVersionAtLeast?.('6.1')) { telegram.setHeaderColor('#080505'); telegram.setBackgroundColor('#080505'); }
  } catch { /* older clients */ }
  telegram?.BackButton?.onClick(goBack);
  app.addEventListener('click', handleAction);
  app.addEventListener('pointerdown', requestFlap, { passive: false });
  byId('sprite-toggle').addEventListener('change', event => {
    renderer.showSprite = event.target.checked;
    store.set('sprite', renderer.showSprite);
  });
  document.addEventListener('keydown', event => {
    if (!event.repeat && ['Space', 'ArrowUp'].includes(event.code)) {
      if (screen === 'game') requestFlap(event);
      else if (screen === 'menu' && event.code === 'Space') { event.preventDefault(); beginGame(); }
    }
    if (event.code === 'Enter' && screen === 'game' && run?.finished && !byId('result').hidden) beginGame();
    if (event.code === 'Escape' && screen !== 'menu') { event.preventDefault(); goBack(); }
  });
  const loseFocus = () => run?.inputs.clear();
  document.addEventListener('visibilitychange', () => { if (document.hidden) loseFocus(); });
  window.addEventListener('blur', loseFocus);
  window.addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('resize', fitViewport);
  telegram?.onEvent?.('contentSafeAreaChanged', fitViewport);
  telegram?.onEvent?.('safeAreaChanged', fitViewport);
  telegram?.onEvent?.('viewportChanged', event => { if (event.isStateStable) fitViewport(); });
  updateMenu();
  showScreen('menu');
  if (new URLSearchParams(location.search).has('debug')) { window.__run = () => run; window.__frame = frame; }
}

start();
