// Mouse and keyboard: every click lands on a nav tab, a map zone, a station
// (the chef walks there first), a customer or the bell, and becomes one call
// into the world's rules.
import { FIELD, CAMERAS, NAV_TABS, STATIONS, MAP_ZONES, FRONT_SLOTS_X, VIEW_ORDER } from './config.js';
import { setView, act, serve, startGame, stationById, cameraNow } from './world.js';

function insideRect(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

function insideCircle(x, y, shape) {
  return Math.hypot(x - shape[1], y - shape[2]) <= shape[3];
}

function insideShape(shape, x, y) {
  if (shape[0] === 'c') return insideCircle(x, y, shape);
  return x >= shape[1] && x <= shape[1] + shape[3] && y >= shape[2] && y <= shape[2] + shape[4];
}

/** Screen point to world point, through the current camera. */
export function screenToWorld(world, sx, sy) {
  const cam = cameraNow(world);
  return [(sx - FIELD.width / 2) / cam.z + cam.x, (sy - FIELD.height / 2) / cam.z + cam.y];
}

/** What is under a screen point: nav tab, start, zone, station, customer, bell. */
export function getHit(world, sx, sy) {
  for (const tab of NAV_TABS) {
    if (sx >= tab.x && sx <= tab.x + tab.w && sy >= tab.y && sy <= tab.y + tab.h) {
      return { kind: 'nav', view: tab.view };
    }
  }
  if (world.transition < 1) return null;
  if (world.state !== 'play') return { kind: 'start' };
  if (world.view === 'counter') {
    if (sx >= 1040 && sx <= 1160 && sy >= 572 && sy <= 690) return { kind: 'bell' };
    for (const c of world.customers) {
      if (!c || c.leaving) continue;
      const x = FRONT_SLOTS_X[c.slot];
      if (sx >= x - 118 && sx <= x + 118 && sy >= 186 && sy <= 546) {
        return { kind: 'customer', customer: c };
      }
    }
    return null;
  }
  const [wx, wy] = screenToWorld(world, sx, sy);
  if (world.view === 'kitchen') {
    for (const station of STATIONS) {
      if (insideShape(station.shape, wx, wy)) return { kind: 'station', id: station.id };
    }
    return null;
  }
  if (world.view === 'hub') {
    if (insideRect(wx, wy, MAP_ZONES.kitchen)) return { kind: 'zone', view: 'kitchen' };
    if (insideRect(wx, wy, MAP_ZONES.counter)) return { kind: 'zone', view: 'counter' };
  }
  return null;
}

/** Handle a click at screen coordinates. Returns true when it did something. */
export function handleClick(world, sx, sy) {
  const hit = getHit(world, sx, sy);
  if (!hit) return false;
  if (hit.kind === 'nav') return setView(world, hit.view);
  if (hit.kind === 'start') {
    if (world.state === 'title' || world.state === 'over') startGame(world);
    return true;
  }
  if (hit.kind === 'zone') return setView(world, hit.view);
  if (hit.kind === 'customer') return serve(world, hit.customer) > 0;
  if (hit.kind === 'bell') return serve(world, null) > 0;
  if (hit.kind === 'station') {
    // Send the chef walking to the station; the job runs when he arrives.
    const station = stationById(hit.id);
    const chef = world.chef;
    chef.tx = station.stand[0];
    chef.ty = station.stand[1];
    chef.fx = station.face[0];
    chef.fy = station.face[1];
    chef.act = () => act(world, hit.id);
    if (Math.hypot(chef.tx - chef.x, chef.ty - chef.y) < 2) {
      chef.tx = null;
      chef.act = null;
      act(world, hit.id);
    }
    return true;
  }
  return false;
}

/** Handle a key press. Returns 'start' | 'served' | 'restart' | null. */
export function handleKey(world, key, screen) {
  const k = key.toLowerCase();
  if (k === ' ' || k === 'enter') {
    if (screen !== 'play') return 'start';
    return serve(world, null) > 0 ? 'served' : null;
  }
  if (k === 'v') {
    const next = VIEW_ORDER[(VIEW_ORDER.indexOf(world.view) + 1) % VIEW_ORDER.length];
    return setView(world, next) ? 'took' : null;
  }
  if (k === '1') return setView(world, 'hub') ? 'took' : null;
  if (k === '2') return setView(world, 'kitchen') ? 'took' : null;
  if (k === '3') return setView(world, 'counter') ? 'took' : null;
  if (k === 'escape') return setView(world, 'hub') ? 'took' : null;
  if (k === 'r' && screen === 'over') return 'restart';
  return null;
}
