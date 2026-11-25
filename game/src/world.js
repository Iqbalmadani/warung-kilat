// The rules of Warung Kilat: tickets arrive on the order board, the cook fetches raw
// ingredients, cooks them at the wok or the chopping board, assembles the dish on the
// plate and serves it before the customer's patience runs out.
import { DAY_SECONDS, HEARTS, HANDS, INGREDIENTS, DISHES, DIFFICULTY } from './config.js';
import { mulberry32, pickWeighted } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_DAY = 8;

function dayIndex(world) {
  return Math.min(world.day - 1, DIFFICULTY.spawnSeconds.length - 1);
}

function menuForDay(day) {
  const menu = [
    ['nasi-ayam', 3],
    ['nasi-telur', 3],
    ['nasi-sayur', 2],
    ['nasi-sambal', 2],
  ];
  if (day >= 2) menu.push(['nasi-komplit', 2]);
  return menu;
}

/** A fresh world: a quiet warung at the start of day one, no tickets yet. */
export function createWorld(seed) {
  const world = {
    seed,
    rng: mulberry32(seed),
    time: 0,
    day: 1,
    dayTime: DAY_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    over: false,
    banner: '',
    bannerTime: 0,
    tickets: [],
    hands: [],
    plate: [],
    fry: [null, null],
    chop: null,
    nextTicketId: 1,
    spawnIn: 6,
    flashes: [],
    lastServed: null,
    // Camera: 'hub' (peta warung, benar-benar dari atas), 'cook' (dapur) or
    // 'front' (konter). The rules never depend on it; only the renderer and
    // the click zones read it. `transition` is a live camera walk, or null.
    view: 'hub',
    transition: null,
  };
  return world;
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed === undefined ? world.seed : seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
}

function addTicket(world) {
  const index = dayIndex(world);
  const dishId = pickWeighted(world.rng, menuForDay(world.day));
  const patience = DIFFICULTY.patienceSeconds[index];
  world.tickets.push({
    id: world.nextTicketId,
    dishId,
    patience,
    maxPatience: patience,
  });
  world.nextTicketId += 1;
}

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const rest = b.slice();
  for (const item of a) {
    const at = rest.indexOf(item);
    if (at === -1) return false;
    rest.splice(at, 1);
  }
  return true;
}

/** The oldest ticket whose dish the plate matches exactly, or null. */
export function matchingTicket(world) {
  for (const ticket of world.tickets) {
    if (sameMultiset(world.plate, DISHES[ticket.dishId].needs)) return ticket;
  }
  return null;
}

function flash(world, text, kind) {
  world.flashes.push({ text, kind, time: 0 });
  if (world.flashes.length > 6) world.flashes.shift();
}

/** The cook takes a scoop of rice from the rice cooker. Rice is always ready. */
export function takeRice(world) {
  if (world.over || world.hands.length >= HANDS) return false;
  world.hands.push('nasi');
  return true;
}

/** The cook takes a raw ingredient from the counter bins. */
export function takeRaw(world, id) {
  if (world.over || world.hands.length >= HANDS) return false;
  if (!INGREDIENTS[id] || INGREDIENTS[id].cooked) return false;
  world.hands.push(id);
  return true;
}

function firstInHands(world, station) {
  for (let i = 0; i < world.hands.length; i += 1) {
    const item = world.hands[i];
    if (INGREDIENTS[item] && INGREDIENTS[item].station === station) return i;
  }
  return -1;
}

/** Put a raw ingredient from the hands into a free slot of the named station. */
export function placeInStation(world, station) {
  if (world.over) return false;
  const at = firstInHands(world, station);
  if (at === -1) return false;
  const raw = world.hands[at];
  const def = INGREDIENTS[raw];
  if (station === 'fry') {
    const slot = world.fry[0] === null ? 0 : world.fry[1] === null ? 1 : -1;
    if (slot === -1) return false;
    world.fry[slot] = { raw, cookedId: def.cookedId, remaining: def.cookSeconds, total: def.cookSeconds };
  } else {
    if (world.chop !== null) return false;
    world.chop = { raw, cookedId: def.cookedId, remaining: def.cookSeconds, total: def.cookSeconds };
  }
  world.hands.splice(at, 1);
  return true;
}

/** Pick a finished item up from a station slot, into the hands. */
export function collectFromStation(world, station, slot) {
  if (world.over || world.hands.length >= HANDS) return false;
  if (station === 'fry') {
    const job = world.fry[slot];
    if (!job || job.remaining > 0) return false;
    world.hands.push(job.cookedId);
    world.fry[slot] = null;
    return true;
  }
  if (!world.chop || world.chop.remaining > 0) return false;
  world.hands.push(world.chop.cookedId);
  world.chop = null;
  return true;
}

/** Move a cooked item from the hands onto the assembly plate. */
export function addToPlate(world) {
  if (world.over || world.plate.length >= 4) return false;
  for (let i = 0; i < world.hands.length; i += 1) {
    const item = world.hands[i];
    if (INGREDIENTS[item] && INGREDIENTS[item].cooked) {
      world.plate.push(item);
      world.hands.splice(i, 1);
      return true;
    }
    if (item === 'nasi' || item === 'ayam-goreng' || item === 'telur-dadar' || item === 'sayur-tumis' || item === 'sambal') {
      world.plate.push(item);
      world.hands.splice(i, 1);
      return true;
    }
  }
  return false;
}

/** Take an item back off the plate into the hands. */
export function removeFromPlate(world, index) {
  if (world.over || world.hands.length >= HANDS) return false;
  if (index < 0 || index >= world.plate.length) return false;
  world.hands.push(world.plate[index]);
  world.plate.splice(index, 1);
  return true;
}

/** Serve the plate to one specific ticket, when the plate matches its dish. */
export function serveTicket(world, ticketId) {
  if (world.over) return 0;
  const ticket = world.tickets.find((t) => t.id === ticketId);
  if (!ticket || !sameMultiset(world.plate, DISHES[ticket.dishId].needs)) return 0;
  const dish = DISHES[ticket.dishId];
  const patienceLeft = Math.max(0, ticket.patience / ticket.maxPatience);
  const tip = Math.round(dish.price * 0.5 * patienceLeft);
  const comboMult = 1 + Math.min(world.combo, 10) * 0.1;
  const earned = dish.price + Math.round(tip * comboMult);
  world.coins += earned;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.lastServed = { dishId: ticket.dishId, coins: earned, time: 0 };
  world.plate = [];
  world.tickets = world.tickets.filter((t) => t.id !== ticket.id);
  flash(world, `+${earned} koin`, 'good');
  return earned;
}

/** Serve the plate to the oldest ticket it matches. Returns the coins earned, or 0. */
export function servePlate(world) {
  const ticket = matchingTicket(world);
  if (!ticket) return 0;
  return serveTicket(world, ticket.id);
}

/** Advance the world by `dt` seconds: tickets, patience, cooking, the day clock. */
export function stepWorld(world, dt) {
  if (world.over) return EVENT_NONE;
  let events = EVENT_NONE;
  world.time += dt;
  world.dayTime -= dt;
  if (world.bannerTime > 0) world.bannerTime -= dt;
  if (world.lastServed) {
    world.lastServed.time += dt;
    if (world.lastServed.time > 2.5) world.lastServed = null;
  }
  for (const f of world.flashes) f.time += dt;
  world.flashes = world.flashes.filter((f) => f.time < 1.4);

  for (const slot of world.fry) if (slot) slot.remaining = Math.max(0, slot.remaining - dt);
  if (world.chop) world.chop.remaining = Math.max(0, world.chop.remaining - dt);

  const index = dayIndex(world);
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.tickets.length < DIFFICULTY.maxTickets[index]) {
    addTicket(world);
    world.spawnIn = DIFFICULTY.spawnSeconds[index] * (0.85 + world.rng() * 0.3);
  }

  for (const ticket of world.tickets) ticket.patience -= dt;
  const expired = world.tickets.filter((t) => t.patience <= 0);
  if (expired.length > 0) {
    world.tickets = world.tickets.filter((t) => t.patience > 0);
    world.hearts -= expired.length;
    world.lost += expired.length;
    world.combo = 0;
    flash(world, 'Pelanggan pergi!', 'bad');
    events |= EVENT_EXPIRED;
    if (world.hearts <= 0) {
      world.hearts = 0;
      world.over = true;
      events |= EVENT_OVER;
      return events;
    }
  }

  if (world.dayTime <= 0) {
    world.day += 1;
    world.dayTime = DAY_SECONDS;
    world.banner = `HARI ${world.day} — makin ramai!`;
    world.bannerTime = 2.5;
    events |= EVENT_DAY;
  }
  return events;
}
