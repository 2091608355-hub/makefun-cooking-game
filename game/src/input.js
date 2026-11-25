// Sizzle & Serve — mouse and keyboard in, one target out.
// A click is mapped to the station it lands on (a bin, a grill slot, the board, the plate,
// an order ticket, the hatch or the trash) using the same layout the renderer draws.
import { FIELD, LAYOUT, binRect, grillSlotRect } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

function inside(rect, x, y) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

/** Which station a field point lands on, or null. */
export function targetAt(x, y, orderCount) {
  const bins = ['bun', 'patty_raw', 'lettuce', 'tomato', 'cheese'];
  for (let i = 0; i < bins.length; i += 1) {
    if (inside(binRect(i), x, y)) return { kind: 'bin', item: bins[i] };
  }
  for (let slot = 0; slot < 2; slot += 1) {
    if (inside(grillSlotRect(slot), x, y)) return { kind: 'grill', slot };
  }
  if (inside(LAYOUT.board, x, y)) return { kind: 'board' };
  if (inside(LAYOUT.plate, x, y)) return { kind: 'plate' };
  if (inside(LAYOUT.hatch, x, y)) return { kind: 'hatch' };
  if (inside(LAYOUT.trash, x, y)) return { kind: 'trash' };
  const o = LAYOUT.orders;
  if (inside(o, x, y)) {
    const w = (o.w - 16) / 3;
    const index = Math.min(orderCount - 1, Math.max(0, Math.floor((x - o.x - 8) / w)));
    return { kind: 'order', index };
  }
  return null;
}

export function createInput(canvas) {
  let actions = 0;
  let clicked = null;
  let binKey = null;

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const ox = (rect.width - FIELD.width * scale) / 2;
    const oy = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - ox) / scale,
      y: (event.clientY - rect.top - oy) / scale,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const p = toField(event);
    clicked = p;
    actions |= ACTION_CONFIRM;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (key === 'p' || key === 'escape') {
      actions |= ACTION_PAUSE;
    } else if (key === 'r') {
      actions |= ACTION_RESTART;
    } else if (key === 'm') {
      actions |= ACTION_MUTE;
    } else if (key >= '1' && key <= '5') {
      binKey = ['bun', 'patty_raw', 'lettuce', 'tomato', 'cheese'][Number(key) - 1];
    }
  });

  return {
    takeActions() {
      const out = actions;
      actions = 0;
      return out;
    },
    takeClick() {
      const out = clicked;
      clicked = null;
      return out;
    },
    takeBinKey() {
      const out = binKey;
      binKey = null;
      return out;
    },
  };
}
