// Sizzle & Serve — every pixel the game paints, drawn with canvas primitives only.
// The kitchen, the order board, the stations, the dish being built and the HUD all live here.
import {
  FIELD,
  INGREDIENTS,
  LAYOUT,
  PALETTE,
  RECIPES,
  binRect,
  grillSlotRect,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const TICKET_TILT = [-0.02, 0.015, -0.01];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** One ingredient as a little picture, centred on (cx, cy) at about `size` pixels wide. */
export function drawIngredient(ctx, item, cx, cy, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (item === 'bun') {
    ctx.fillStyle = INGREDIENTS.bun.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.15, s * 0.9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.bun.dark;
    roundRect(ctx, -s * 0.9, -s * 0.15, s * 1.8, s * 0.45, s * 0.2);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.4, -0.6], [0, -0.75], [0.4, -0.6], [-0.15, -0.45], [0.2, -0.45]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'patty' || item === 'patty_raw') {
    ctx.fillStyle = item === 'patty' ? '#7a4a2b' : INGREDIENTS.patty_raw.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (const dy of [-0.35, 0, 0.35]) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, dy * s);
      ctx.lineTo(s * 0.6, dy * s);
      ctx.stroke();
    }
  } else if (item === 'lettuce') {
    ctx.fillStyle = INGREDIENTS.lettuce.color;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(-s * 0.6 + i * s * 0.3, Math.sin(i * 1.7) * s * 0.15, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = INGREDIENTS.lettuce.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, 0);
    ctx.quadraticCurveTo(0, s * 0.3, s * 0.7, 0);
    ctx.stroke();
  } else if (item === 'lettuce_chopped') {
    ctx.fillStyle = INGREDIENTS.lettuce.color;
    for (let i = 0; i < 4; i += 1) {
      roundRect(ctx, -s * 0.8 + i * s * 0.45, -s * 0.25 + (i % 2) * s * 0.3, s * 0.35, s * 0.5, s * 0.12);
      ctx.fill();
    }
  } else if (item === 'tomato') {
    ctx.fillStyle = INGREDIENTS.tomato.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f28b82';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.lettuce.dark;
    ctx.beginPath();
    ctx.arc(0, -s * 0.8, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (item === 'tomato_chopped') {
    ctx.fillStyle = INGREDIENTS.tomato.color;
    for (const a of [0.3, 2.4, 4.5]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, s * 0.8, a, a + 1.1);
      ctx.closePath();
      ctx.fill();
    }
  } else if (item === 'cheese') {
    ctx.fillStyle = INGREDIENTS.cheese.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, s * 0.6);
    ctx.lineTo(s * 0.85, s * 0.6);
    ctx.lineTo(0, -s * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = INGREDIENTS.cheese.dark;
    for (const [dx, dy] of [[-0.3, 0.2], [0.25, 0.05], [0, 0.35]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'burnt') {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.3);
    ctx.lineTo(s * 0.4, s * 0.3);
    ctx.moveTo(s * 0.4, -s * 0.3);
    ctx.lineTo(-s * 0.4, s * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

/** The dish being built, drawn as a stack of layers on the plate. */
function drawDish(ctx, plate, cx, cy, size) {
  const s = size / 2;
  let y = cy + s * 0.55;
  const layerH = s * 0.34;
  // The plate itself.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.62, s * 1.05, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d7ccc8';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (plate.length === 0) {
    text(ctx, 'Empty plate', cx, cy - s * 0.1, 15, PALETTE.muted, '600', 'center');
    return;
  }
  for (const item of plate) {
    y -= layerH;
    ctx.save();
    ctx.translate(cx, y);
    if (item === 'bun') {
      ctx.fillStyle = INGREDIENTS.bun.color;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      for (const [dx, dy] of [[-0.35, -0.35], [0, -0.5], [0.35, -0.35]]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item === 'patty') {
      ctx.fillStyle = '#7a4a2b';
      roundRect(ctx, -s * 0.85, -layerH / 2, s * 1.7, layerH, s * 0.12);
      ctx.fill();
    } else if (item === 'cheese') {
      ctx.fillStyle = INGREDIENTS.cheese.color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, -layerH / 2);
      ctx.lineTo(s * 0.85, -layerH / 2);
      ctx.lineTo(s * 0.7, layerH / 2);
      ctx.lineTo(-s * 0.7, layerH / 2);
      ctx.closePath();
      ctx.fill();
    } else if (item === 'lettuce_chopped') {
      ctx.fillStyle = INGREDIENTS.lettuce.color;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc(-s * 0.7 + i * s * 0.35, Math.sin(i * 2.1) * 3, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item === 'tomato_chopped') {
      ctx.fillStyle = INGREDIENTS.tomato.color;
      for (const dx of [-0.45, 0.05, 0.5]) {
        ctx.beginPath();
        ctx.arc(dx * s, 0, s * 0.26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  // The bun that caps the dish is the bottom bun when the stack starts with one.
  ctx.fillStyle = INGREDIENTS.bun.dark;
  roundRect(ctx, cx - s * 0.85, cy + s * 0.55 - layerH * 0.4, s * 1.7, s * 0.18, s * 0.08);
  ctx.fill();
}

function drawPanel(ctx, x, y, w, h, fill = PALETTE.counter) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, x, y, w, 10, 7);
  ctx.fill();
}

function drawOrderTicket(ctx, order, x, y, w, h, plate, index) {
  const shakeX = order.shake > 0 ? Math.sin(order.shake * 40) * 4 : 0;
  const matched = plate.length > 0 && order.recipe.needs.length === plate.length &&
    [...order.recipe.needs].sort().join() === [...plate].sort().join();
  ctx.save();
  ctx.translate(x + w / 2 + shakeX, y + h / 2);
  ctx.rotate(TICKET_TILT[index % TICKET_TILT.length]);
  ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = PALETTE.paper;
  roundRect(ctx, 0, 0, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = matched ? '#2e7d32' : '#d7ccc8';
  ctx.lineWidth = matched ? 4 : 2;
  ctx.stroke();
  text(ctx, `#${order.id}  ${order.recipe.name}`, 14, 22, 18, PALETTE.ink);
  text(ctx, `$${order.recipe.price}`, w - 14, 22, 18, '#2e7d32', '800', 'right');
  order.recipe.needs.forEach((need, i) => {
    drawIngredient(ctx, need, 30 + i * 44, 48, 28);
  });
  if (matched) {
    text(ctx, 'READY — click to serve!', w / 2, 76, 14, '#2e7d32', '800', 'center');
  } else {
    text(ctx, order.recipe.needs.map((n) => INGREDIENTS[n.replace('_chopped', '')]?.name ?? n).join(' + '), 14, 76, 12, PALETTE.muted, '600');
  }
  const frac = Math.max(0, order.timeLeft / order.total);
  ctx.fillStyle = '#e0d6c8';
  roundRect(ctx, 14, h - 10, w - 28, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#f2c94c' : '#d64541';
  roundRect(ctx, 14, h - 10, (w - 28) * frac, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawBins(ctx, state) {
  const names = ['bun', 'patty_raw', 'lettuce', 'tomato', 'cheese'];
  drawPanel(ctx, LAYOUT.bins.x, LAYOUT.bins.y, LAYOUT.bins.w, LAYOUT.bins.h);
  text(ctx, 'INGREDIENTS', LAYOUT.bins.x + LAYOUT.bins.w / 2, LAYOUT.bins.y + 2, 13, '#fff8e7', '800', 'center');
  names.forEach((item, i) => {
    const r = binRect(i);
    const held = state.holding === item;
    ctx.fillStyle = held ? '#5d4037' : 'rgba(255,255,255,0.12)';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    drawIngredient(ctx, item, r.x + 34, r.y + r.h / 2, 46);
    text(ctx, INGREDIENTS[item].name, r.x + 62, r.y + r.h / 2 - 2, 16, '#fff8e7');
    text(ctx, `[${INGREDIENTS[item].key}]`, r.x + 62, r.y + r.h / 2 + 18, 12, '#d7ccc8', '600');
    if (held) text(ctx, 'IN HAND', r.x + r.w - 10, r.y + 16, 11, PALETTE.gold, '800', 'right');
  });
}

function drawGrill(ctx, state) {
  const g = LAYOUT.grill;
  drawPanel(ctx, g.x, g.y, g.w, g.h, '#5d6d7e');
  text(ctx, 'GRILL', g.x + g.w / 2, g.y + 24, 15, '#fff8e7', '800', 'center');
  state.grill.forEach((cell, slot) => {
    const r = grillSlotRect(slot);
    ctx.fillStyle = '#37474f';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(r.x + 12, r.y + (r.h / 4) * i);
      ctx.lineTo(r.x + r.w - 12, r.y + (r.h / 4) * i);
      ctx.stroke();
    }
    if (cell.state === 'cooking' || cell.state === 'done' || cell.state === 'burnt') {
      const item = cell.state === 'burnt' ? 'burnt' : 'patty';
      drawIngredient(ctx, item, r.x + r.w / 2, r.y + r.h / 2 - 6, 72);
      const frac = cell.state === 'cooking'
        ? Math.min(1, cell.t / 4)
        : 1;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      roundRect(ctx, r.x + 10, r.y + r.h - 18, r.w - 20, 8, 4);
      ctx.fill();
      ctx.fillStyle = cell.state === 'burnt' ? '#d64541' : cell.state === 'done' ? '#4caf50' : '#f2c94c';
      roundRect(ctx, r.x + 10, r.y + r.h - 18, (r.w - 20) * frac, 8, 4);
      ctx.fill();
      if (cell.state === 'done') text(ctx, 'READY!', r.x + r.w / 2, r.y + 16, 13, '#a5d6a7', '800', 'center');
      if (cell.state === 'burnt') text(ctx, 'BURNT', r.x + r.w / 2, r.y + 16, 13, '#ef9a9a', '800', 'center');
    } else {
      text(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2, 13, 'rgba(255,255,255,0.4)', '600', 'center');
    }
  });
  text(ctx, 'Click a raw patty, then the grill', g.x + g.w / 2, g.y + g.h - 12, 12, '#eceff1', '600', 'center');
}

function drawBoard(ctx, state) {
  const b = LAYOUT.board;
  drawPanel(ctx, b.x, b.y, b.w, b.h, PALETTE.board);
  text(ctx, 'CHOPPING BOARD', b.x + b.w / 2, b.y + 24, 15, PALETTE.ink, '800', 'center');
  const board = state.board;
  ctx.fillStyle = '#d7a86a';
  roundRect(ctx, b.x + 40, b.y + 48, b.w - 80, 96, 10);
  ctx.fill();
  if (board.state === 'chopping' || board.state === 'done') {
    const item = board.state === 'done' ? `${board.item}_chopped` : board.item;
    drawIngredient(ctx, item, b.x + b.w / 2, b.y + 96, 84);
    if (board.state === 'chopping') {
      const frac = Math.min(1, board.t / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      roundRect(ctx, b.x + 60, b.y + 156, b.w - 120, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#4caf50';
      roundRect(ctx, b.x + 60, b.y + 156, (b.w - 120) * frac, 10, 5);
      ctx.fill();
      text(ctx, 'Chopping…', b.x + b.w / 2, b.y + 186, 13, PALETTE.ink, '700', 'center');
    } else {
      text(ctx, 'Chopped — click to take', b.x + b.w / 2, b.y + 186, 13, '#2e7d32', '700', 'center');
    }
  } else {
    text(ctx, 'Click lettuce or tomato', b.x + b.w / 2, b.y + 96, 14, PALETTE.muted, '600', 'center');
    text(ctx, 'to chop it here', b.x + b.w / 2, b.y + 118, 14, PALETTE.muted, '600', 'center');
  }
}

function drawPlateArea(ctx, state) {
  const p = LAYOUT.plate;
  drawPanel(ctx, p.x, p.y, p.w, p.h, '#6d4c41');
  text(ctx, 'ASSEMBLY PLATE', p.x + p.w / 2, p.y + 24, 15, '#fff8e7', '800', 'center');
  drawDish(ctx, state.plate, p.x + p.w / 2, p.y + 216, 210);
  const label = state.plate.length === 0
    ? 'Click ready ingredients to stack them here'
    : state.plate.map((n) => INGREDIENTS[n.replace('_chopped', '')]?.name ?? n).join(' + ');
  text(ctx, label, p.x + p.w / 2, p.y + p.h - 44, 14, '#ffecb3', '700', 'center');
  const matched = state.orders.find((o) => o.recipe.needs.length === state.plate.length &&
    [...o.recipe.needs].sort().join() === [...state.plate].sort().join());
  if (matched) {
    text(ctx, `Matches order #${matched.id} — serve it!`, p.x + p.w / 2, p.y + p.h - 20, 14, '#a5d6a7', '800', 'center');
  } else if (state.plate.length > 0) {
    text(ctx, 'Keep stacking — or trash it to start over', p.x + p.w / 2, p.y + p.h - 20, 13, '#d7ccc8', '600', 'center');
  }
}

function drawHatch(ctx, state) {
  const h = LAYOUT.hatch;
  const flash = state.serveFlash > 0;
  drawPanel(ctx, h.x, h.y, h.w, h.h, flash ? '#2e7d32' : '#37474f');
  text(ctx, 'SERVING HATCH', h.x + h.w / 2, h.y + 24, 15, '#fff8e7', '800', 'center');
  ctx.fillStyle = '#eceff1';
  roundRect(ctx, h.x + 30, h.y + 44, h.w - 60, 90, 10);
  ctx.fill();
  ctx.fillStyle = '#b0bec5';
  ctx.fillRect(h.x + 30, h.y + 44, h.w - 60, 10);
  text(ctx, '🔔', h.x + h.w / 2, h.y + 108, 44, '#37474f', '400', 'center');
  text(ctx, 'Click to serve the plate', h.x + h.w / 2, h.y + 158, 13, '#eceff1', '600', 'center');
  text(ctx, 'to the order it matches', h.x + h.w / 2, h.y + 180, 13, '#eceff1', '600', 'center');
}

function drawTrash(ctx) {
  const t = LAYOUT.trash;
  drawPanel(ctx, t.x, t.y, t.w, t.h, '#4e342e');
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + 24, 15, '#fff8e7', '800', 'center');
  ctx.fillStyle = '#6d4c41';
  roundRect(ctx, t.x + t.w / 2 - 45, t.y + 52, 90, 100, 8);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, t.x + t.w / 2 - 52, t.y + 44, 104, 16, 8);
  ctx.fill();
  text(ctx, 'Click to throw away', t.x + t.w / 2, t.y + 176, 13, '#d7ccc8', '600', 'center');
  text(ctx, 'what you are holding', t.x + t.w / 2, t.y + 196, 13, '#d7ccc8', '600', 'center');
}

function drawKitchen(ctx, state) {
  // Floor and wall.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.wallTile;
  for (let x = 0; x < FIELD.width; x += 64) ctx.fillRect(x, 84, 2, 124);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 208, FIELD.width, 492);
  ctx.fillStyle = PALETTE.floorTile;
  for (let y = 224; y < 700; y += 64) ctx.fillRect(0, y, FIELD.width, 2);
  for (let x = 0; x < FIELD.width; x += 64) ctx.fillRect(x, 208, 2, 492);

  // Order board.
  const o = LAYOUT.orders;
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, o.x - 8, o.y - 8, o.w + 16, o.h + 16, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', o.x + 4, o.y + 4, 13, '#fff8e7', '800');
  state.orders.forEach((order, i) => {
    const w = (o.w - 16) / 3;
    drawOrderTicket(ctx, order, o.x + 8 + i * w, o.y + 8, w - 8, o.h - 16, state.plate, i);
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', o.x + o.w / 2, o.y + o.h / 2 + 6, 16, '#d7ccc8', '600', 'center');
  }

  drawBins(ctx, state);
  drawGrill(ctx, state);
  drawBoard(ctx, state);
  drawPlateArea(ctx, state);
  drawHatch(ctx, state);
  drawTrash(ctx);

  // Floating score texts.
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / f.life);
    text(ctx, f.text, f.x, f.y - f.t * 40, 22, f.color, '800', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawTopBar(ctx, state, best) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, 'SIZZLE & SERVE', 24, 52, 30, '#ffecb3', '800');
  text(ctx, 'a tiny kitchen, a rush of orders', 24, 74, 13, '#d7ccc8', '600');
  // Day timer.
  const dayFrac = Math.max(0, state.dayLeft / 180);
  text(ctx, `DAY  ${mmss(state.dayLeft)}`, 640, 46, 30, dayFrac < 0.25 ? '#ef9a9a' : '#fff8e7', '800', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, 520, 58, 240, 8, 4);
  ctx.fill();
  ctx.fillStyle = dayFrac < 0.25 ? '#d64541' : '#4caf50';
  roundRect(ctx, 520, 58, 240 * dayFrac, 8, 4);
  ctx.fill();
  // Coins.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(1010, 40, 16, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, '$', 1010, 46, 18, '#7a5c00', '800', 'center');
  text(ctx, `${state.coins}`, 1034, 48, 26, '#fff8e7', '800');
  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    const x = 1150 + i * 34;
    ctx.fillStyle = i < state.hearts ? '#d64541' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x - 6, 36, 9, 0, Math.PI * 2);
    ctx.arc(x + 6, 36, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 14, 40);
    ctx.lineTo(x, 56);
    ctx.lineTo(x + 14, 40);
    ctx.closePath();
    ctx.fill();
  }
  if (state.combo >= 2) {
    ctx.fillStyle = '#f2c94c';
    roundRect(ctx, 1120, 62, 130, 18, 9);
    ctx.fill();
    text(ctx, `COMBO x${state.combo}`, 1185, 76, 12, '#3e2723', '800', 'center');
  }
  if (best > 0) text(ctx, `BEST $${best}`, 1256, 76, 12, '#d7ccc8', '700', 'right');
}

function drawBottomBar(ctx, state) {
  const b = LAYOUT.bottomBar;
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  if (state.holding) {
    drawIngredient(ctx, state.holding, 60, b.y + 50, 56);
    const name = INGREDIENTS[state.holding.replace('_chopped', '')]?.name ?? state.holding;
    const suffix = state.holding === 'patty' ? ' (grilled)' : state.holding.endsWith('_chopped') ? ' (chopped)' : state.holding === 'burnt' ? ' (burnt!)' : '';
    text(ctx, `Holding: ${name}${suffix}`, 100, b.y + 56, 18, '#fff8e7');
  } else {
    text(ctx, 'Hands empty — pick an ingredient', 100, b.y + 56, 18, '#d7ccc8', '600');
  }
  text(ctx, '1–5 pick up · Click a station to use it · Space pause · M mute', 640, b.y + 56, 14, '#d7ccc8', '600', 'center');
  text(ctx, `Served ${state.served}`, 1256, b.y + 56, 16, '#fff8e7', '700', 'right');
}

function overlay(ctx, alpha = 0.55) {
  ctx.fillStyle = `rgba(20, 12, 8, ${alpha})`;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function drawTitle(ctx, best) {
  overlay(ctx, 0.5);
  text(ctx, 'SIZZLE & SERVE', 640, 250, 84, '#ffecb3', '800', 'center');
  text(ctx, 'A tiny kitchen. A rush of orders. One very hungry lunch crowd.', 640, 300, 22, '#fff8e7', '600', 'center');
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, 440, 340, 400, 64, 12);
  ctx.fill();
  text(ctx, 'CLICK OR PRESS SPACE TO START', 640, 380, 20, '#3e2723', '800', 'center');
  text(ctx, 'Pick up ingredients  ·  Grill the patty, chop the veg', 640, 460, 18, '#fff8e7', '600', 'center');
  text(ctx, 'Stack the dish on the plate  ·  Serve it before the timer runs out', 640, 492, 18, '#fff8e7', '600', 'center');
  if (best > 0) text(ctx, `Best day so far: $${best}`, 640, 560, 18, PALETTE.gold, '700', 'center');
}

function drawOver(ctx, state, best) {
  overlay(ctx, 0.6);
  ctx.fillStyle = PALETTE.paper;
  roundRect(ctx, 340, 190, 600, 380, 18);
  ctx.fill();
  const title = state.won ? 'DAY COMPLETE!' : 'KITCHEN CLOSED!';
  text(ctx, title, 640, 270, 48, state.won ? '#2e7d32' : '#b2342c', '800', 'center');
  text(ctx, state.won ? 'You survived the lunch rush.' : 'Too many orders walked out.', 640, 312, 18, PALETTE.muted, '600', 'center');
  text(ctx, `Coins earned  $${state.coins}`, 640, 380, 28, PALETTE.ink, '800', 'center');
  text(ctx, `Dishes served  ${state.served}`, 640, 424, 22, PALETTE.ink, '700', 'center');
  if (state.coins >= best && state.coins > 0) {
    text(ctx, 'NEW BEST!', 640, 462, 20, '#d9a521', '800', 'center');
  } else if (best > 0) {
    text(ctx, `Best day  $${best}`, 640, 462, 18, PALETTE.muted, '700', 'center');
  }
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, 490, 500, 300, 52, 10);
  ctx.fill();
  text(ctx, 'PRESS R TO PLAY AGAIN', 640, 534, 18, '#3e2723', '800', 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // The drawing buffer follows the window (times the pixel ratio), so the game is sharp
  // at any size and the screenshot canvas is the window's own pixels.
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
  }
  resize();
  window.addEventListener('resize', resize);
  function draw(state, screen, best) {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    if (state.shake > 0) {
      ctx.translate(Math.sin(state.shake * 40) * 4, 0);
    }
    drawKitchen(ctx, state);
    drawTopBar(ctx, state, best);
    drawBottomBar(ctx, state);
    if (screen === SCREEN_TITLE) drawTitle(ctx, best);
    else if (screen === SCREEN_PAUSED) {
      overlay(ctx, 0.5);
      text(ctx, 'PAUSED', 640, 380, 56, '#fff8e7', '800', 'center');
      text(ctx, 'Space to keep cooking', 640, 430, 20, '#d7ccc8', '600', 'center');
    } else if (screen === SCREEN_OVER) drawOver(ctx, state, best);
  }
  return { draw };
}
