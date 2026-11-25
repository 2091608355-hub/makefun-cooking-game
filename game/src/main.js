// Sizzle & Serve — boot and the one loop: input is read every frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play, paused and
// game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot. With &export=<name>.jpg the staged scene is also saved as a JPEG download,
// so a plain page load produces the screenshot file without a console.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ERROR, EVENT_EXPIRED, EVENT_OVER, EVENT_READY, EVENT_SERVED } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput, targetAt } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const exportName = params.get('export');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotReady = true;
      if (exportName) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.85);
        link.download = exportName;
        link.click();
      }
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve the orders before their timers run out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    sound.over();
    announce(`Day over. ${world.state.coins} coins, ${world.state.served} dishes served. Best ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_SERVED) {
      sound.serve();
      announce(`Served! ${world.state.coins} coins.`);
    }
    if (events & EVENT_EXPIRED) {
      sound.expire();
      announce(`An order walked out. ${world.state.hearts} hearts left.`);
    }
    if (events & EVENT_READY) sound.ready();
    if (events & EVENT_ERROR) sound.error();
    if (events & EVENT_OVER) endGame();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) sound.toggleMute();
    if (actions & ACTION_RESTART && screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function handleClick() {
    const point = input.takeClick();
    if (!point || screen !== SCREEN_PLAY) return;
    const target = targetAt(point.x, point.y, world.state.orders.length);
    if (!target) return;
    const before = world.state.holding;
    const events = world.click(target);
    if (target.kind === 'bin' && world.state.holding !== before) sound.pick();
    if ((target.kind === 'grill' || target.kind === 'board' || target.kind === 'plate') && world.state.holding === null && before !== null) sound.place();
    playEvents(events);
  }

  function handleBinKey() {
    const item = input.takeBinKey();
    if (!item || screen !== SCREEN_PLAY) return;
    const before = world.state.holding;
    const events = world.click({ kind: 'bin', item });
    if (world.state.holding !== before) sound.pick();
    playEvents(events);
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP);
      return;
    }
    const events = world.step(STEP);
    playEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClick();
    handleBinKey();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
