// Sizzle & Serve — every tuning number, colour and layout rect in one place.
// The playfield is a fixed 1280x800 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** A day lasts this long; when it runs out the results screen shows. */
export const DAY_SECONDS = 180;

/** Hearts: an order that expires costs one. */
export const HEARTS = 3;

/** How long a raw patty grills, and when a grilled one left on the grill burns. */
export const GRILL_COOK_SECONDS = 4;
export const GRILL_BURN_SECONDS = 12;

/** How long lettuce or tomato takes on the chopping board. */
export const CHOP_SECONDS = 2;

/** Orders: how many can wait at once, and the gap between new ones. */
export const MAX_ORDERS = 3;
export const ORDER_GAP_START = 14;
export const ORDER_GAP_MIN = 8;
export const ORDER_TIME_START = 50;
export const ORDER_TIME_MIN = 35;

/** Serving fast after the previous serve doubles the coins (combo window). */
export const COMBO_WINDOW_SECONDS = 6;

/** Ingredients. `prep` names the station that makes it ready, or null when it is ready as picked up. */
export const INGREDIENTS = {
  bun: { name: 'Bun', prep: null, color: '#e8b96a', dark: '#c98f3d', key: '1' },
  patty_raw: { name: 'Patty', prep: 'grill', color: '#c96a5e', dark: '#9e4a40', key: '2' },
  lettuce: { name: 'Lettuce', prep: 'board', color: '#7bc96f', dark: '#4e9e44', key: '3' },
  tomato: { name: 'Tomato', prep: 'board', color: '#e5534b', dark: '#b2342c', key: '4' },
  cheese: { name: 'Cheese', prep: null, color: '#f2c94c', dark: '#d9a521', key: '5' },
};

/** A ready ingredient is what the plate takes: grilled patty and chopped veg, the rest as picked up. */
export const READY = {
  bun: 'bun',
  patty: 'patty',
  lettuce_chopped: 'lettuce_chopped',
  tomato_chopped: 'tomato_chopped',
  cheese: 'cheese',
};

/** Recipes: the dish name and the ready ingredients it needs, in the order they stack. */
export const RECIPES = [
  { name: 'Classic Burger', price: 20, needs: ['bun', 'patty', 'lettuce_chopped'] },
  { name: 'Cheeseburger', price: 22, needs: ['bun', 'patty', 'cheese'] },
  { name: 'Garden Burger', price: 26, needs: ['bun', 'patty', 'lettuce_chopped', 'tomato_chopped'] },
  { name: 'Double Stack', price: 32, needs: ['bun', 'patty', 'patty', 'cheese'] },
];

/** Where every station sits, in field coordinates. Render and input both read these. */
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 84 },
  orders: { x: 24, y: 100, w: 1232, h: 108 },
  bins: { x: 24, y: 232, w: 150, h: 440 },
  grill: { x: 210, y: 232, w: 330, h: 210 },
  board: { x: 210, y: 466, w: 330, h: 206 },
  plate: { x: 576, y: 232, w: 330, h: 440 },
  hatch: { x: 942, y: 232, w: 314, h: 210 },
  trash: { x: 942, y: 466, w: 314, h: 206 },
  bottomBar: { x: 0, y: 700, w: 1280, h: 100 },
};

/** Each ingredient bin's rect, in order, inside the bins area. */
export function binRect(index) {
  const { x, y, w } = LAYOUT.bins;
  const gap = 8;
  const h = (LAYOUT.bins.h - gap * 4) / 5;
  return { x: x + 6, y: y + 6 + index * (h + gap), w: w - 12, h };
}

/** The grill's two slots. */
export function grillSlotRect(slot) {
  const g = LAYOUT.grill;
  return { x: g.x + 24 + slot * 160, y: g.y + 70, w: 140, h: 110 };
}

export const PALETTE = {
  wall: '#f5e6c8',
  wallTile: '#e8d3a8',
  floor: '#c98f5f',
  floorTile: '#b57a4e',
  counter: '#8b5a2b',
  counterTop: '#a9743f',
  steel: '#9aa5b1',
  steelDark: '#6e7a88',
  board: '#e8c88a',
  paper: '#fffdf5',
  ink: '#3e2723',
  muted: '#8d6e63',
  red: '#d64541',
  green: '#4caf50',
  gold: '#f2c94c',
  cream: '#fff8e7',
  shadow: 'rgba(62, 39, 35, 0.25)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
