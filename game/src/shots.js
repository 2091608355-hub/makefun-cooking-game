// Sizzle & Serve — the screenshot scenes behind ?shot=start|play|serve|end.
// Each one plays the real rules forward from a fresh world, steered by a script or by a
// small autopilot that cooks the first order on the board, so the frame is what a short
// game really looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 300;
const SAMPLE = STEP;

/** Run the world forward `seconds`, clicking the scripted targets at their times. */
function runScript(world, script, seconds) {
  let at = 0;
  let index = 0;
  while (at < seconds) {
    while (index < script.length && script[index][0] <= at) {
      world.click(script[index][1]);
      index += 1;
    }
    world.step(SAMPLE);
    at += SAMPLE;
  }
}

/** One step of the serve autopilot: click `target` when `ready` holds, done when `done` holds. */
function planStep(target, ready, done) {
  return { target, ready, done };
}

function pick(item) {
  return planStep(
    { kind: 'bin', item },
    (s) => s.holding === null,
    (s) => s.holding === item,
  );
}

function grillSlot(slot) {
  return planStep(
    { kind: 'grill', slot },
    (s) => s.holding === 'patty_raw' && s.grill[slot].state === 'empty',
    (s) => s.grill[slot].state === 'cooking' || s.grill[slot].state === 'done',
  );
}

function takeGrill(slot) {
  return planStep(
    { kind: 'grill', slot },
    (s) => s.holding === null && s.grill[slot].state === 'done',
    (s) => s.holding === 'patty',
  );
}

function chopBoard(veg) {
  return planStep(
    { kind: 'board' },
    (s) => s.holding === veg && s.board.state === 'empty',
    (s) => s.board.state === 'chopping' || s.board.state === 'done',
  );
}

function takeBoard(veg) {
  return planStep(
    { kind: 'board' },
    (s) => s.holding === null && s.board.state === 'done',
    (s) => s.holding === `${veg}_chopped`,
  );
}

function plate(item, want) {
  return planStep(
    { kind: 'plate' },
    (s) => s.holding === item,
    (s) => s.plate.filter((x) => x === item).length >= want,
  );
}

function serveFirst() {
  return planStep(
    { kind: 'order', index: 0 },
    (s) => s.plate.length > 0 && s.orders.length > 0,
    (s) => s.plate.length === 0,
  );
}

/** The steps that cook the first order on the board, in an order that overlaps the slow jobs:
 * the patty grills while the first veg chops, comes off before it can burn, and the rest
 * follows. */
function planFor(recipe) {
  const steps = [];
  const patties = recipe.needs.filter((n) => n === 'patty').length;
  const vegs = recipe.needs.filter((n) => n.endsWith('_chopped')).map((n) => n.replace('_chopped', ''));
  // How many of each ingredient are already on the plate: a recipe can need the same
  // ingredient twice (Double Stack), so a plate step is done only when the count grows.
  const plated = {};
  function plateStep(item) {
    plated[item] = (plated[item] || 0) + 1;
    return plate(item, plated[item]);
  }
  for (let i = 0; i < patties; i += 1) {
    steps.push(pick('patty_raw'));
    steps.push(grillSlot(i));
  }
  if (vegs.length > 0) {
    steps.push(pick(vegs[0]));
    steps.push(chopBoard(vegs[0]));
    steps.push(takeBoard(vegs[0]));
    steps.push(plateStep(`${vegs[0]}_chopped`));
  }
  for (let i = 0; i < patties; i += 1) {
    steps.push(takeGrill(i));
    steps.push(plateStep('patty'));
  }
  for (const veg of vegs.slice(1)) {
    steps.push(pick(veg));
    steps.push(chopBoard(veg));
    steps.push(takeBoard(veg));
    steps.push(plateStep(`${veg}_chopped`));
  }
  for (const item of ['bun', 'cheese']) {
    if (recipe.needs.includes(item)) {
      steps.push(pick(item));
      steps.push(plateStep(item));
    }
  }
  steps.push(serveFirst());
  return steps;
}

/**
 * Cook the first order on the board until it is served (or the world ends), then keep
 * cooking the next one while `keepGoing` is true. With `stopBeforeServe` it stops the
 * moment the dish is complete and matches the first order, without serving it, so the
 * frame shows the plate ready to serve. Returns false when the cap ran out.
 */
function runAutopilot(world, keepGoing, capSeconds, stopBeforeServe = false) {
  let at = 0;
  let steps = null;
  let stepAt = 0;
  while (at < capSeconds) {
    const s = world.state;
    if (s.over) return true;
    if (!steps || steps.length === 0) {
      if (s.orders.length === 0) {
        world.step(SAMPLE);
        at += SAMPLE;
        continue;
      }
      steps = planFor(s.orders[0].recipe);
      stepAt = at;
    }
    const step = steps[0];
    if (stopBeforeServe && step.target.kind === 'order') return true;
    if (step.done(s)) {
      steps.shift();
      stepAt = at;
      if (steps.length === 0 && !keepGoing) return true;
      continue;
    }
    if (at - stepAt > 25) {
      // A step that never becomes ready (a burnt patty, a lost order) is skipped, not stuck on.
      steps.shift();
      stepAt = at;
      if (steps.length === 0 && !keepGoing) return true;
      continue;
    }
    if (step.ready(s)) world.click(step.target);
    world.step(SAMPLE);
    at += SAMPLE;
  }
  return false;
}

const PLAY_SCRIPT = [
  [0.0, { kind: 'bin', item: 'patty_raw' }],
  [0.5, { kind: 'grill', slot: 0 }],
  [1.0, { kind: 'bin', item: 'bun' }],
  [1.5, { kind: 'plate' }],
  [2.0, { kind: 'bin', item: 'lettuce' }],
  [2.5, { kind: 'board' }],
  [5.0, { kind: 'grill', slot: 0 }],
  [5.5, { kind: 'plate' }],
  [6.0, { kind: 'board' }],
  [6.5, { kind: 'plate' }],
  [7.0, { kind: 'bin', item: 'tomato' }],
  [7.5, { kind: 'board' }],
  [10.0, { kind: 'board' }],
  [10.5, { kind: 'plate' }],
  [20.5, { kind: 'bin', item: 'patty_raw' }],
  [21.0, { kind: 'grill', slot: 1 }],
];

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runScript(world, PLAY_SCRIPT, PLAY_SECONDS);
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }
  if (name === 'serve') {
    runAutopilot(world, false, END_LIMIT_SECONDS, true);
    for (let index = 0; index < 0.5 / STEP; index += 1) world.step(STEP);
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }
  world.setDayLeft(40);
  runAutopilot(world, true, END_LIMIT_SECONDS);
  return { screen: SCREEN_OVER, best: world.state.coins };
}
