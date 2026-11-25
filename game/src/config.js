// Warung Kilat v5 — every tuning number, colour, dish and layout value in one
// place. The game lives in ONE continuous world (2000x1125) that the camera
// zooms and pans across: the kitchen room top-left, the dining room right and
// bottom, the serving bar between them. The screen is a fixed 1280x720 window
// onto that world; the renderer scales it to the browser window.
export const FIELD = { width: 1280, height: 720 };
export const WORLD = { width: 2000, height: 1125 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const HEARTS = 3;
/** How long a camera walk takes, in seconds. */
export const WALK_SECONDS = 0.8;
/** How fast the chef walks across the kitchen floor, world pixels a second. */
export const CHEF_SPEED = 780;

/** The three camera stops: map (whole warung), kitchen (zoomed), counter (front). */
export const CAMERAS = {
  hub:     { x: 1000, y: 550, z: 0.56 },
  kitchen: { x: 510,  y: 276, z: 1.15 },
  counter: { x: 510,  y: 650, z: 1.5 },
};
export const VIEW_ORDER = ['hub', 'kitchen', 'counter'];

/** Raw ingredients the cook picks up, and what cooking turns them into. */
export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',         cooked: true },
  ayam:   { id: 'ayam',   name: 'Ayam mentah',  station: 'wok',   cookSeconds: 4.5, cookedId: 'ayamG' },
  telur:  { id: 'telur',  name: 'Telur mentah', station: 'wok',   cookSeconds: 3,   cookedId: 'telurD' },
  sayur:  { id: 'sayur',  name: 'Sayur',        station: 'board', cookSeconds: 1.8, cookedId: 'sayurC' },
  cabai:  { id: 'cabai',  name: 'Cabai',        station: 'board', cookSeconds: 1.8, cookedId: 'sambal' },
  ayamG:  { id: 'ayamG',  name: 'Ayam goreng',  cooked: true },
  telurD: { id: 'telurD', name: 'Telur dadar',  cooked: true },
  sayurC: { id: 'sayurC', name: 'Sayur potong', cooked: true },
  sambal: { id: 'sambal', name: 'Sambal',       cooked: true },
};
export const RAW_INGREDIENTS = ['ayam', 'telur', 'sayur', 'cabai'];

/** The menu: each dish is the exact set of cooked items a ticket asks for. */
export const RECIPES = {
  ayamGoreng: { id: 'ayamGoreng', name: 'Nasi Ayam Goreng', price: 8,  items: ['nasi', 'ayamG'] },
  telurDadar: { id: 'telurDadar', name: 'Nasi Telur Dadar', price: 6,  items: ['nasi', 'telurD'] },
  nasiSayur:  { id: 'nasiSayur',  name: 'Nasi Sayur',       price: 6,  items: ['nasi', 'sayurC'] },
  ayamSambal: { id: 'ayamSambal', name: 'Nasi Ayam Sambal', price: 10, items: ['nasi', 'ayamG', 'sambal'] },
  komplit:    { id: 'komplit',    name: 'Nasi Komplit',     price: 14, items: ['nasi', 'ayamG', 'telurD', 'sayurC'] },
};

/** Which recipes a level may order: level 1 the first three, then sambal, then komplit. */
const RECIPE_TIERS = [
  ['ayamGoreng', 'telurDadar', 'nasiSayur'],
  ['ayamSambal'],
  ['komplit'],
];
export function recipesFor(level) {
  return RECIPE_TIERS.slice(0, Math.min(level, 3)).flat();
}

/** The canonical key of a plate or an order: its items, sorted, joined. */
export function dishKey(items) {
  return items.slice().sort().join();
}

/** The six customer looks: shirt, skin, hair and head style (hair, peci, hijab, cap). */
export const CUSTOMER_STYLES = [
  { shirt: '#d9534f', skin: '#e6b48a', hair: '#2b1b12', kind: 'hair' },
  { shirt: '#3b7dd8', skin: '#d6a070', hair: '#1b1b1b', kind: 'peci' },
  { shirt: '#8e5cc4', skin: '#efc7a0', hair: '#7a58a8', kind: 'hijab' },
  { shirt: '#2f9e6a', skin: '#c58b5c', hair: '#3a2418', kind: 'cap', cap: '#e8a33d' },
  { shirt: '#e08a2c', skin: '#f0c8a0', hair: '#2f8f9a', kind: 'hijab' },
  { shirt: '#b84a8a', skin: '#dba77a', hair: '#4a2a1a', kind: 'hair' },
];

/**
 * The kitchen stations, in world coordinates. `shape` is the clickable area
 * ('c' = circle x, y, radius; 'r' = rect x, y, w, h), `stand` is where the
 * chef stops to work, `face` is the point the chef turns toward.
 */
export const STATIONS = [
  { id: 'rice',  shape: ['c', 130, 118, 50],       stand: [130, 224], face: [130, 118] },
  { id: 'wok0',  shape: ['c', 300, 121, 50],       stand: [300, 224], face: [300, 121] },
  { id: 'wok1',  shape: ['c', 410, 121, 50],       stand: [410, 224], face: [410, 121] },
  { id: 'board', shape: ['r', 515, 76, 150, 84],   stand: [590, 224], face: [590, 118] },
  { id: 'trash', shape: ['c', 790, 118, 42],       stand: [790, 224], face: [790, 118] },
  { id: 'ayam',  shape: ['r', 104, 459, 92, 92],   stand: [150, 404], face: [150, 505] },
  { id: 'telur', shape: ['r', 224, 459, 92, 92],   stand: [270, 404], face: [270, 505] },
  { id: 'sayur', shape: ['r', 344, 459, 92, 92],   stand: [390, 404], face: [390, 505] },
  { id: 'cabai', shape: ['r', 464, 459, 92, 92],   stand: [510, 404], face: [510, 505] },
  { id: 'plate', shape: ['c', 790, 508, 58],       stand: [790, 404], face: [790, 508] },
  { id: 'bell',  shape: ['c', 905, 508, 32],       stand: [905, 404], face: [905, 508] },
];

/** Where the four bar customers stand in the world, and in the front view. */
export const BAR_SLOTS_X = [200, 400, 600, 800];
export const FRONT_SLOTS_X = [260, 520, 780, 1040];

/** The clickable zones on the map: the kitchen room and the bar strip. */
export const MAP_ZONES = {
  kitchen: { x: 60, y: 60,  w: 900, h: 498 },
  counter: { x: 60, y: 558, w: 900, h: 268 },
};

/** The view tabs in the HUD: label, key and rect, left to right. */
export const NAV_TABS = [
  { view: 'hub',     key: '1', label: 'PETA',   x: 920,  y: 7, w: 110, h: 30 },
  { view: 'kitchen', key: '2', label: 'DAPUR',  x: 1038, y: 7, w: 110, h: 30 },
  { view: 'counter', key: '3', label: 'KONTER', x: 1156, y: 7, w: 110, h: 30 },
];

export const PALETTE = {
  dark: '#16120f',
  board: '#2b1c12',
  cream: '#fff6df',
  gold: '#ffd36b',
  text: '#2b1c12',
  muted: '#7a6a58',
  green: '#5fb84a',
  red: '#e04a3a',
  orange: '#f0a040',
  teal: '#2a9d8f',
};

export const FONT = '"Segoe UI",system-ui,-apple-system,Roboto,"Noto Sans",sans-serif';

/** Difficulty: patience shrinks with the level; a new level every 4 serves. */
export function patienceSeconds(level) {
  return Math.max(24, 44 - level * 3);
}
export function maxCustomers(level) {
  return Math.min(4, 2 + (level >> 1));
}

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'warung-kilat.best';
