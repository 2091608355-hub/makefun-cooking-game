// Sizzle & Serve — the kitchen itself: orders, stations, the plate and the score.
// The world is pure state plus rules; it knows nothing about the canvas or the mouse.
// Every action goes through `click(target)`, so the screenshot autopilot drives the same
// game a player does.
import {
  CHOP_SECONDS,
  DAY_SECONDS,
  GRILL_BURN_SECONDS,
  GRILL_COOK_SECONDS,
  HEARTS,
  INGREDIENTS,
  MAX_ORDERS,
  ORDER_GAP_MIN,
  ORDER_GAP_START,
  ORDER_TIME_MIN,
  ORDER_TIME_START,
  COMBO_WINDOW_SECONDS,
  READY,
  RECIPES,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_ERROR = 8;
export const EVENT_READY = 16;

const READY_ITEMS = new Set(Object.values(READY));

/** True when the plate's stack is exactly the recipe's ingredients, in any order. */
function matches(plate, needs) {
  if (plate.length !== needs.length) return false;
  const rest = [...needs];
  for (const item of plate) {
    const at = rest.indexOf(item);
    if (at === -1) return false;
    rest.splice(at, 1);
  }
  return true;
}

export function createWorld(random) {
  const state = {
    time: 0,
    dayLeft: DAY_SECONDS,
    coins: 0,
    hearts: HEARTS,
    combo: 0,
    comboLeft: 0,
    orders: [],
    orderTimer: 2,
    grill: [
      { state: 'empty', t: 0, item: null },
      { state: 'empty', t: 0, item: null },
    ],
    board: { state: 'empty', t: 0, item: null },
    plate: [],
    holding: null,
    floats: [],
    served: 0,
    over: false,
    won: false,
    shake: 0,
    serveFlash: 0,
    nextOrderId: 1,
  };

  function level() {
    return 1 + Math.floor(state.time / 45);
  }

  function orderGap() {
    return Math.max(ORDER_GAP_MIN, ORDER_GAP_START - (level() - 1) * 2);
  }

  function orderTime() {
    return Math.max(ORDER_TIME_MIN, ORDER_TIME_START - (level() - 1) * 5);
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const recipe = random.pick(RECIPES);
    const total = orderTime();
    state.orders.push({ id: state.nextOrderId, recipe, timeLeft: total, total, shake: 0 });
    state.nextOrderId += 1;
    state.orderTimer = orderGap();
  }

  function addFloat(x, y, text, color) {
    state.floats.push({ x, y, text, color, t: 0, life: 1.4 });
  }

  function serve(order) {
    const base = order.recipe.price;
    const timeBonus = Math.min(15, Math.floor(order.timeLeft / 2));
    state.combo = state.comboLeft > 0 ? state.combo + 1 : 1;
    state.comboLeft = COMBO_WINDOW_SECONDS;
    const multiplier = state.combo >= 2 ? 2 : 1;
    const earned = (base + timeBonus) * multiplier;
    state.coins += earned;
    state.served += 1;
    state.plate = [];
    state.orders = state.orders.filter((o) => o.id !== order.id);
    state.serveFlash = 0.6;
    addFloat(741, 300, `+${earned}${multiplier > 1 ? ' COMBO x2' : ''}`, '#2e7d32');
    return EVENT_SERVED;
  }

  function error() {
    state.shake = 0.25;
    return EVENT_ERROR;
  }

  function clickBin(item) {
    if (state.holding !== null) return error();
    state.holding = item;
    return 0;
  }

  function clickGrill(slot) {
    const cell = state.grill[slot];
    if (cell.state === 'empty') {
      if (state.holding !== 'patty_raw') return error();
      cell.state = 'cooking';
      cell.t = 0;
      cell.item = 'patty_raw';
      state.holding = null;
      return 0;
    }
    if (state.holding !== null) return error();
    if (cell.state === 'done') {
      state.holding = 'patty';
      cell.state = 'empty';
      cell.t = 0;
      cell.item = null;
      return 0;
    }
    if (cell.state === 'burnt') {
      state.holding = 'burnt';
      cell.state = 'empty';
      cell.t = 0;
      cell.item = null;
      return 0;
    }
    return 0;
  }

  function clickBoard() {
    const board = state.board;
    if (board.state === 'empty') {
      if (state.holding !== 'lettuce' && state.holding !== 'tomato') return error();
      board.state = 'chopping';
      board.t = 0;
      board.item = state.holding;
      state.holding = null;
      return 0;
    }
    if (board.state === 'done' && state.holding === null) {
      state.holding = `${board.item}_chopped`;
      board.state = 'empty';
      board.t = 0;
      board.item = null;
      return 0;
    }
    return 0;
  }

  function clickPlate() {
    if (state.holding === null) return 0;
    if (!READY_ITEMS.has(state.holding)) return error();
    if (state.plate.length >= 4) return error();
    state.plate.push(state.holding);
    state.holding = null;
    return 0;
  }

  function clickOrder(index) {
    const order = state.orders[index];
    if (!order) return error();
    if (state.plate.length === 0) return error();
    if (!matches(state.plate, order.recipe.needs)) {
      order.shake = 0.3;
      return error();
    }
    return serve(order);
  }

  function clickHatch() {
    if (state.plate.length === 0) return error();
    for (const order of state.orders) {
      if (matches(state.plate, order.recipe.needs)) return serve(order);
    }
    return error();
  }

  function clickTrash() {
    if (state.holding !== null) {
      state.holding = null;
      return 0;
    }
    if (state.plate.length > 0) {
      state.plate = [];
      return 0;
    }
    return 0;
  }

  /** One player action, the same shape the mouse and the screenshot autopilot both send. */
  function click(target) {
    if (state.over) return 0;
    switch (target.kind) {
      case 'bin':
        return clickBin(target.item);
      case 'grill':
        return clickGrill(target.slot);
      case 'board':
        return clickBoard();
      case 'plate':
        return clickPlate();
      case 'order':
        return clickOrder(target.index);
      case 'hatch':
        return clickHatch();
      case 'trash':
        return clickTrash();
      default:
        return 0;
    }
  }

  function reset() {
    state.time = 0;
    state.dayLeft = DAY_SECONDS;
    state.coins = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.comboLeft = 0;
    state.orders = [];
    state.orderTimer = 2;
    state.grill = [
      { state: 'empty', t: 0, item: null },
      { state: 'empty', t: 0, item: null },
    ];
    state.board = { state: 'empty', t: 0, item: null };
    state.plate = [];
    state.holding = null;
    state.floats = [];
    state.served = 0;
    state.over = false;
    state.won = false;
    state.shake = 0;
    state.serveFlash = 0;
    state.nextOrderId = 1;
  }

  /** Shorten the day (the end screenshot stages a finished day, not a fresh one). */
  function setDayLeft(seconds) {
    state.dayLeft = seconds;
  }

  function step(dt) {
    if (state.over) return 0;
    let events = 0;
    state.time += dt;
    state.dayLeft -= dt;
    if (state.comboLeft > 0) state.comboLeft -= dt;
    if (state.shake > 0) state.shake -= dt;
    if (state.serveFlash > 0) state.serveFlash -= dt;
    for (const f of state.floats) f.t += dt;
    state.floats = state.floats.filter((f) => f.t < f.life);

    for (const cell of state.grill) {
      if (cell.state === 'cooking') {
        cell.t += dt;
        if (cell.t >= GRILL_COOK_SECONDS) {
          cell.state = 'done';
          events |= EVENT_READY;
        }
      } else if (cell.state === 'done') {
        cell.t += dt;
        if (cell.t >= GRILL_BURN_SECONDS) {
          cell.state = 'burnt';
          addFloat(370, 260, 'Burnt!', '#b2342c');
        }
      }
    }
    if (state.board.state === 'chopping') {
      state.board.t += dt;
      if (state.board.t >= CHOP_SECONDS) {
        state.board.state = 'done';
        events |= EVENT_READY;
      }
    }

    state.orderTimer -= dt;
    if (state.orderTimer <= 0) spawnOrder();

    for (const order of [...state.orders]) {
      order.timeLeft -= dt;
      if (order.shake > 0) order.shake -= dt;
      if (order.timeLeft <= 0) {
        state.orders = state.orders.filter((o) => o.id !== order.id);
        state.hearts -= 1;
        state.combo = 0;
        state.comboLeft = 0;
        addFloat(640, 150, 'Order lost!', '#b2342c');
        events |= EVENT_EXPIRED;
        if (state.hearts <= 0) {
          state.over = true;
          state.won = false;
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    if (state.dayLeft <= 0) {
      state.over = true;
      state.won = state.hearts > 0;
      events |= EVENT_OVER;
    }
    return events;
  }

  return { state, reset, step, click, setDayLeft, level };
}
