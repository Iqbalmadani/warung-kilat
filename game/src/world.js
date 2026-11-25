// Warung Kilat v5: the rules. One continuous warung world, a chef who walks to
// the station you click, tickets with patience, a plate to assemble, a bell to
// serve. The camera walks between the three views of the same world.
import {
  STEP, HEARTS, CHEF_SPEED, WALK_SECONDS, CAMERAS, VIEW_ORDER,
  INGREDIENTS, RAW_INGREDIENTS, RECIPES, recipesFor, dishKey,
  CUSTOMER_STYLES, STATIONS, BAR_SLOTS_X, SERVER_HOME, BAR_END,
  patienceSeconds, maxCustomers,
} from './config.js';
import { mulberry32 } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

/** A fresh world: title screen, no coins, three hearts, chef by the stove. */
export function createWorld(seed) {
  const world = {
    rng: mulberry32(seed || 1),
    state: 'title',
    view: 'hub',
    prevView: 'hub',
    transition: 1,
    coins: 0,
    hearts: HEARTS,
    served: 0,
    level: 1,
    spawnIn: 0.6,
    hand: null,
    plate: [],
    woks: [
      { item: null, t: 0, need: 1, ready: false },
      { item: null, t: 0, need: 1, ready: false },
    ],
    board: { item: null, t: 0, need: 1, ready: false },
    customers: [null, null, null, null],
    pops: [],
    toast: null,
    chef: { x: 510, y: 345, angle: -Math.PI / 2, walk: 0, tx: null, ty: null, fx: 510, fy: 200, act: null },
    // The server (pelayan) who works the customers: he waits at his post in
    // the kitchen square and walks a plate over to whoever was just served.
    server: { x: SERVER_HOME.x, y: SERVER_HOME.y, path: [], carry: null, mode: 'idle' },
  };
  return world;
}

/** Reset the world for a new game, keeping the same seed. */
export function resetWorld(world, seed) {
  const fresh = createWorld(seed || 1);
  Object.assign(world, fresh);
  world.rng = mulberry32(seed || 1);
}

/** Pick a customer look that is not already seated. */
function pickStyle(world) {
  const used = world.customers.filter(Boolean).map((c) => c.style);
  const pool = CUSTOMER_STYLES.filter((s) => !used.includes(s));
  const list = pool.length ? pool : CUSTOMER_STYLES;
  return list[Math.floor(world.rng() * list.length)];
}

/** Seat a customer in a slot, with a recipe for this level and full patience. */
export function spawnCustomer(world, slot, patience, recipeId) {
  const pool = recipesFor(world.level);
  const recipe = recipeId || pool[Math.floor(world.rng() * pool.length)];
  world.customers[slot] = {
    slot,
    recipe,
    max: patienceSeconds(world.level),
    patience: patience == null ? 1 : patience,
    style: pickStyle(world),
    in: 0,
    out: 0,
    leaving: null,
  };
}

/** Start a game from the title screen; the map walks into the kitchen. */
export function startGame(world) {
  resetWorld(world, 1);
  world.state = 'play';
  if (world.view === 'hub') setView(world, 'kitchen');
}

export function showToast(world, text, kind) {
  world.toast = { t: 0, text, kind: kind || 'info' };
}

function pop(world, wx, wy, fx, fy, text, color) {
  world.pops.push({ wx, wy, fx, fy, text, color, t: 0 });
}

/** Start a camera walk to another view (0.8 s); ignored mid-walk or same view. */
export function setView(world, view) {
  if (view === world.view || world.transition < 1 || !CAMERAS[view]) return false;
  world.prevView = world.view;
  world.view = view;
  world.transition = 0;
  return true;
}

/** The camera right now: between the two stops while walking, else the stop. */
export function cameraNow(world) {
  const a = CAMERAS[world.prevView];
  const b = CAMERAS[world.view];
  if (world.transition >= 1) return b;
  const e = easeInOut(world.transition);
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e),
  };
}

/** How much of the front view is showing: fades in late on the way to the
 *  counter, fades out early on the way back. */
export function frontAlpha(world) {
  const to = world.view === 'counter';
  const from = world.prevView === 'counter';
  if (world.transition >= 1) return to ? 1 : 0;
  if (to) return smooth((world.transition - 0.45) / 0.4);
  if (from) return 1 - smooth(world.transition / 0.4);
  return 0;
}

/** How much of the kitchen ticket cards is showing: fades in on the way to
 *  the kitchen, fades out on the way back. */
export function kitchenAmount(world) {
  if (world.transition >= 1) return world.view === 'kitchen' ? 1 : 0;
  if (world.view === 'kitchen') return smooth((world.transition - 0.35) / 0.5);
  if (world.prevView === 'kitchen') return 1 - smooth(world.transition / 0.45);
  return 0;
}

/** Slow start and end, for a camera walk. */
export function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Smoothstep, clamped to 0..1. */
export function smooth(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function complain(world, text) {
  showToast(world, text, 'bad');
}

/** Do what a station does when the chef arrives at it. */
export function act(world, id) {
  const hand = world.hand;
  if (id === 'rice') {
    if (hand) complain(world, 'Tangan penuh!');
    else world.hand = 'nasi';
    return;
  }
  if (RAW_INGREDIENTS.includes(id)) {
    if (hand) complain(world, 'Tangan penuh!');
    else world.hand = id;
    return;
  }
  if (id === 'wok0' || id === 'wok1') {
    const wok = world.woks[id === 'wok0' ? 0 : 1];
    if (hand === 'ayam' || hand === 'telur') {
      if (wok.item) complain(world, 'Wajan masih terisi');
      else {
        wok.item = hand;
        wok.t = 0;
        wok.need = INGREDIENTS[hand].cookSeconds;
        wok.ready = false;
        world.hand = null;
      }
    } else if (!hand && wok.item) {
      if (wok.ready) {
        world.hand = wok.item === 'ayam' ? 'ayamG' : 'telurD';
        wok.item = null;
        wok.ready = false;
      } else complain(world, 'Belum matang…');
    } else if (hand) complain(world, 'Wajan cuma buat ayam & telur');
    return;
  }
  if (id === 'board') {
    const board = world.board;
    if (hand === 'sayur' || hand === 'cabai') {
      if (board.item) complain(world, 'Talenan masih terisi');
      else {
        board.item = hand;
        board.t = 0;
        board.need = INGREDIENTS[hand].cookSeconds;
        board.ready = false;
        world.hand = null;
      }
    } else if (!hand && board.item) {
      if (board.ready) {
        world.hand = board.item === 'sayur' ? 'sayurC' : 'sambal';
        board.item = null;
        board.ready = false;
      } else complain(world, 'Masih dipotong…');
    } else if (hand) complain(world, 'Talenan cuma buat sayur & cabai');
    return;
  }
  if (id === 'plate') {
    if (!hand) return;
    if (RAW_INGREDIENTS.includes(hand)) complain(world, 'Masak / potong dulu!');
    else if (world.plate.includes(hand)) complain(world, 'Itu sudah ada di piring');
    else {
      world.plate.push(hand);
      world.hand = null;
    }
    return;
  }
  if (id === 'trash') {
    if (hand) world.hand = null;
    else if (world.plate.length) {
      world.plate = [];
      showToast(world, 'Piring dibuang');
    }
    return;
  }
  if (id === 'bell') serve(world, null);
}

/** Serve the plate: to one customer, or to whoever ordered exactly this.
 *  Pays the price plus a patience tip (up to half the price again). */
export function serve(world, customer) {
  if (world.state !== 'play') return 0;
  if (!world.plate.length) {
    complain(world, 'Piring masih kosong');
    return 0;
  }
  const key = dishKey(world.plate);
  if (!customer) {
    customer = world.customers.find(
      (c) => c && !c.leaving && dishKey(RECIPES[c.recipe].items) === key,
    );
    if (!customer) {
      complain(world, 'Nggak ada pesanan yang cocok');
      return 0;
    }
  }
  if (customer.leaving) return 0;
  if (dishKey(RECIPES[customer.recipe].items) === key) {
    const recipe = RECIPES[customer.recipe];
    const bonus = Math.round(customer.patience * recipe.price * 0.5);
    const paid = recipe.price + bonus;
    world.coins += paid;
    world.served += 1;
    customer.leaving = 'happy';
    world.plate = [];
    pop(world, BAR_SLOTS_X[customer.slot], 660, 0, 0, `+$${paid}`, '#ffd36b');
    showToast(world, `Pesanan sesuai! +$${paid}`, 'good');
    sendServer(world, customer.slot);
    if (world.served % 4 === 0) {
      world.level += 1;
      showToast(world, `HARI ${world.level} — makin rame!`, 'good');
    }
    return paid;
  }
  customer.patience = Math.max(0.06, customer.patience - 0.2);
  complain(world, 'Salah pesanan!');
  return 0;
}

export const EVENT_OVER = 1;

/** Send the server to a bar customer with the plate: around the end of the
 *  bar (x 980), down the dining side, and up to the customer's slot. When he
 *  arrives the plate is delivered and he walks back to his post. */
function sendServer(world, slot) {
  const s = world.server;
  const tx = BAR_SLOTS_X[slot];
  s.path = s.y > 600
    ? [[tx, 730]]
    : [[BAR_END.x, BAR_END.y], [BAR_END.x, 730], [tx, 730]];
  s.carry = 'plate';
  s.mode = 'toCustomer';
}

/** Walk the server along his path, one waypoint at a time. */
function stepServer(world, dt) {
  const s = world.server;
  if (!s.path.length) return;
  const [tx, ty] = s.path[0];
  const dx = tx - s.x;
  const dy = ty - s.y;
  const dist = Math.hypot(dx, dy);
  const step = CHEF_SPEED * 0.9 * dt;
  if (dist <= step) {
    s.x = tx;
    s.y = ty;
    s.path.shift();
    if (!s.path.length) {
      if (s.mode === 'toCustomer') {
        s.carry = null;
        s.mode = 'returning';
        s.path = [[BAR_END.x, 730], [BAR_END.x, BAR_END.y], [SERVER_HOME.x, SERVER_HOME.y]];
      } else {
        s.mode = 'idle';
      }
    }
  } else {
    s.x += (dx / dist) * step;
    s.y += (dy / dist) * step;
  }
}

/** Advance the world by `dt` seconds: the camera walk, the chef's walk, the
 *  cooking timers, patience, spawning, toasts and pops. */
export function stepWorld(world, dt) {
  if (world.transition < 1) {
    world.transition = Math.min(1, world.transition + dt / WALK_SECONDS);
  }
  // The chef walks toward the station he was sent to, then does the job.
  const chef = world.chef;
  if (world.state === 'play' && chef.tx != null) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const dist = Math.hypot(dx, dy);
    const step = CHEF_SPEED * dt;
    if (dist <= step) {
      chef.x = chef.tx;
      chef.y = chef.ty;
      chef.tx = null;
      chef.angle = Math.atan2(chef.fy - chef.y, chef.fx - chef.x);
      const job = chef.act;
      chef.act = null;
      if (job) job();
    } else {
      chef.x += (dx / dist) * step;
      chef.y += (dy / dist) * step;
      let turn = Math.atan2(dy, dx) - chef.angle;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      chef.angle += turn * Math.min(1, dt * 16);
      chef.walk += step * 0.075;
    }
  }
  if (world.toast) {
    world.toast.t += dt;
    if (world.toast.t > 1.8) world.toast = null;
  }
  stepServer(world, dt);
  world.pops.forEach((p) => { p.t += dt; });
  world.pops = world.pops.filter((p) => p.t < 1.2);
  world.customers.forEach((c) => {
    if (!c) return;
    c.in = Math.min(1, c.in + dt / 0.6);
    if (c.leaving) c.out += dt / 0.9;
  });
  world.customers.forEach((c, i) => {
    if (c && c.out >= 1) world.customers[i] = null;
  });
  if (world.state !== 'play') return 0;
  // Cooking timers.
  world.woks.forEach((wok) => {
    if (wok.item && !wok.ready) {
      wok.t += dt;
      if (wok.t >= wok.need) {
        wok.ready = true;
        showToast(world, 'Siap diangkat!', 'good');
      }
    }
  });
  const board = world.board;
  if (board.item && !board.ready) {
    board.t += dt;
    if (board.t >= board.need) board.ready = true;
  }
  // Patience: a customer who runs out leaves angry and costs a heart.
  world.customers.forEach((c) => {
    if (!c || c.leaving) return;
    c.patience -= dt / c.max;
    if (c.patience <= 0) {
      c.patience = 0;
      c.leaving = 'angry';
      world.hearts -= 1;
      showToast(world, 'Pelanggan pergi!', 'bad');
      if (world.hearts <= 0) world.state = 'over';
    }
  });
  // Spawning: more customers as the level rises, faster when the room is empty.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    const live = world.customers.filter((c) => c && !c.leaving).length;
    const free = [0, 1, 2, 3].filter((i) => !world.customers[i]);
    if (live < maxCustomers(world.level) && free.length) {
      spawnCustomer(world, free[Math.floor(world.rng() * free.length)]);
      world.spawnIn = live < 1 ? 1.6 : Math.max(4.5, 9 - world.level * 0.6);
    } else {
      world.spawnIn = 1;
    }
  }
  return world.state === 'over' ? EVENT_OVER : 0;
}

/** The station record for an id, or undefined. */
export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

/** The demo scene the screenshots stage from: a busy warung mid-play. */
export function stageDemo(world) {
  resetWorld(world, 1);
  spawnCustomer(world, 0, 0.92, 'ayamGoreng');
  spawnCustomer(world, 1, 0.62, 'komplit');
  spawnCustomer(world, 3, 0.3, 'nasiSayur');
  world.customers.forEach((c) => { if (c) c.in = 1; });
  world.woks[0] = { item: 'ayam', t: 2.5, need: 4.5, ready: false };
  world.woks[1] = { item: 'telur', t: 3, need: 3, ready: true };
  world.board = { item: 'sayur', t: 1.1, need: 1.8, ready: false };
  world.plate = ['nasi'];
  world.level = 2;
  world.state = 'play';
}

export { STEP, VIEW_ORDER };
