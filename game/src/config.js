// Every tuning number, colour, dish and layout rect in one place. The playfield is a
// fixed 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const DAY_SECONDS = 120;
export const HEARTS = 3;
/** How many items the cook can carry at once. */
export const HANDS = 2;

/** Raw ingredients the cook picks up from the counter, and what cooking turns them into. */
export const INGREDIENTS = {
  nasi:  { id: 'nasi',  name: 'Nasi',  en: 'rice',    color: '#fff8e7', cooked: true },
  ayam:  { id: 'ayam',  name: 'Ayam',  en: 'chicken', color: '#e8a33d', station: 'fry',  cookSeconds: 4,   cookedId: 'ayam-goreng' },
  telur: { id: 'telur', name: 'Telur', en: 'egg',     color: '#f6d365', station: 'fry',  cookSeconds: 3,   cookedId: 'telur-dadar' },
  sayur: { id: 'sayur', name: 'Sayur', en: 'greens',  color: '#6abe30', station: 'chop', cookSeconds: 2.5, cookedId: 'sayur-tumis' },
  cabai: { id: 'cabai', name: 'Cabai', en: 'chilli',  color: '#e63946', station: 'chop', cookSeconds: 2,   cookedId: 'sambal' },
};

/** Cooked items, shown on the plate and in tickets. */
export const COOKED_ITEMS = {
  nasi:         { id: 'nasi',         name: 'Nasi',        short: 'Nasi',   color: '#fff8e7' },
  'ayam-goreng': { id: 'ayam-goreng', name: 'Ayam Goreng', short: 'Ayam',   color: '#e8a33d' },
  'telur-dadar': { id: 'telur-dadar', name: 'Telur Dadar', short: 'Telur',  color: '#f6d365' },
  'sayur-tumis': { id: 'sayur-tumis', name: 'Sayur Tumis', short: 'Sayur',  color: '#6abe30' },
  sambal:        { id: 'sambal',       name: 'Sambal',      short: 'Sambal', color: '#e63946' },
};

/** The menu: each dish is the exact multiset of cooked items a ticket asks for. */
export const DISHES = {
  'nasi-ayam': {
    id: 'nasi-ayam', name: 'Nasi Ayam Goreng', en: 'fried chicken rice', price: 8,
    needs: ['nasi', 'ayam-goreng'],
  },
  'nasi-telur': {
    id: 'nasi-telur', name: 'Nasi Telur Dadar', en: 'omelette rice', price: 6,
    needs: ['nasi', 'telur-dadar'],
  },
  'nasi-sayur': {
    id: 'nasi-sayur', name: 'Nasi Sayur', en: 'greens rice', price: 6,
    needs: ['nasi', 'sayur-tumis'],
  },
  'nasi-sambal': {
    id: 'nasi-sambal', name: 'Nasi Ayam Sambal', en: 'spicy chicken rice', price: 10,
    needs: ['nasi', 'ayam-goreng', 'sambal'],
  },
  'nasi-komplit': {
    id: 'nasi-komplit', name: 'Nasi Komplit', en: 'the full plate', price: 14, minDay: 2,
    needs: ['nasi', 'ayam-goreng', 'telur-dadar', 'sayur-tumis'],
  },
};

/** Stations the cook works at: the rice cooker, the wok, the chopping board. */
export const STATIONS = {
  rice: { id: 'rice', name: 'Rice Cooker', short: 'NASI', slots: 0 },
  fry:  { id: 'fry',  name: 'Wajan',       short: 'GORANG', slots: 2 },
  chop: { id: 'chop', name: 'Talenan',     short: 'POTONG', slots: 1 },
};

/** Where everything sits on the 1280x720 field. */
export const LAYOUT = {
  hud:        { x: 0,    y: 0,   w: 1280, h: 56 },
  board:      { x: 16,   y: 64,  w: 1248, h: 116 },
  ticket:     { w: 300,  h: 104, gap: 16 },
  rice:       { x: 40,   y: 196, w: 180,  h: 148 },
  fry:        { x: 236,  y: 196, w: 280,  h: 148 },
  chop:       { x: 532,  y: 196, w: 220,  h: 148 },
  plate:      { x: 768,  y: 196, w: 220,  h: 148 },
  serve:      { x: 1004, y: 196, w: 236,  h: 148 },
  cook:       { x: 40,   y: 360, w: 1200, h: 150 },
  bins:       { x: 40,   y: 524, w: 1248, h: 116 },
  bin:        { w: 220,  h: 104, gap: 16 },
  hands:      { x: 1024, y: 524, w: 216,  h: 104 },
  help:       { x: 40,   y: 652, w: 1200, h: 56 },
  // Hub view (true top-down floor plan of the whole warung). Table centres line
  // up with the front view's customer slots, so a customer stays in place
  // when the camera walks from the map into the counter view.
  hub: {
    kitchen: { x: 40,   y: 64,  w: 1200, h: 316 },
    dining:  { x: 40,   y: 396, w: 1200, h: 284 },
    rice:    { x: 120,  y: 110, w: 120,  h: 80 },
    stove:   { x: 280,  y: 110, w: 200,  h: 80 },
    chop:    { x: 520,  y: 110, w: 180,  h: 80 },
    plate:   { x: 760,  y: 110, w: 160,  h: 80 },
    serve:   { x: 980,  y: 110, w: 220,  h: 80 },
    cook:    { x: 640,  y: 300 },
    counter: { x: 40,   y: 396, w: 1200, h: 74 },
    table:   { w: 180,  h: 90,  gap: 64 },
    tableRow:{ x: 110,  y: 520 },
  },
  // The view switch button sits bottom-right in every view.
  viewToggle: { x: 1140, y: 656, w: 120,  h: 40 },
  front: {
    counter:  { x: 40,   y: 400, w: 1200, h: 110 },
    plate:    { x: 120,  y: 412, w: 300,  h: 86 },
    serve:    { x: 980,  y: 408, w: 220,  h: 72 },
    customer: { w: 220,  h: 200, gap: 24 },
    custRow:  { x: 90,   y: 176 },
  },
};

export const PALETTE = {
  wall: '#f2dfc2',
  wallStripe: '#e8cba0',
  floor: '#b07a4a',
  counter: '#8b5a2b',
  counterTop: '#a9713d',
  board: '#3d2b1f',
  boardEdge: '#5a4028',
  ticket: '#fff6df',
  ticketEdge: '#d9c48f',
  text: '#2b1d12',
  muted: '#7a6a58',
  cream: '#fff8e7',
  teal: '#2a9d8f',
  red: '#e63946',
  gold: '#f4a261',
  green: '#6abe30',
  dark: '#2b1d12',
  plate: '#ffffff',
  serveReady: '#2a9d8f',
  serveIdle: '#8b93a3',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Difficulty: how the rush grows with each day. */
export const DIFFICULTY = {
  spawnSeconds: [14, 11, 9, 7.5, 6.5],
  patienceSeconds: [52, 46, 40, 35, 32],
  maxTickets: [3, 4, 4, 4, 4],
};

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'warung-kilat.best';
