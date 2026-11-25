// Mouse and keyboard: every click lands on a station, a bin, the plate or the serve
// window, and becomes one call into the world's rules.
import { LAYOUT } from './config.js';
import {
  takeRice, takeRaw, placeInStation, collectFromStation, addToPlate, removeFromPlate, servePlate, serveTicket,
} from './world.js';

function inside(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

const RAW_BINS = ['ayam', 'telur', 'sayur', 'cabai'];

/** Where the camera dives when it walks between two views. */
const WALK_CENTERS = {
  'hub>cook': { cx: 640, cy: 222 },
  'hub>front': { cx: 640, cy: 538 },
  'cook>hub': { cx: 640, cy: 360 },
  'front>hub': { cx: 640, cy: 360 },
};

/** Start a camera walk from the current view to `to` (0.6 s). */
function startTransition(world, to) {
  if (world.transition || world.view === to) return false;
  const center = WALK_CENTERS[`${world.view}>${to}`] || { cx: 640, cy: 360 };
  world.transition = { from: world.view, to, t: 0, dur: 0.6, cx: center.cx, cy: center.cy };
  return true;
}

/** Handle a click at logical-field coordinates. Returns true when it did something. */
export function handleClick(world, x, y) {
  if (world.transition) return false;
  const { rice, fry, chop, plate, serve, bins, bin, viewToggle, viewTabs, front, hub } = LAYOUT;
  // HUD view tabs: tap PETA / DAPUR / KONTER to walk straight there.
  if (inside(x, y, viewTabs.hub)) return startTransition(world, 'hub');
  if (inside(x, y, viewTabs.cook)) return startTransition(world, 'cook');
  if (inside(x, y, viewTabs.front)) return startTransition(world, 'front');
  if (inside(x, y, viewToggle)) {
    return startTransition(world, world.view === 'hub' ? 'cook' : 'hub');
  }
  if (world.view === 'hub') {
    if (inside(x, y, hub.kitchen)) return startTransition(world, 'cook');
    if (inside(x, y, hub.dining)) return startTransition(world, 'front');
    return false;
  }
  if (world.view === 'front') {
    if (inside(x, y, front.serve)) return servePlate(world) > 0;
    for (let i = 0; i < 4; i += 1) {
      const rect = {
        x: front.custRow.x + i * (front.customer.w + front.customer.gap),
        y: front.custRow.y,
        w: front.customer.w,
        h: front.customer.h,
      };
      if (inside(x, y, rect)) {
        const ticket = world.tickets[i];
        if (ticket) return serveTicket(world, ticket.id) > 0;
        return false;
      }
    }
    return false;
  }
  if (inside(x, y, rice)) return takeRice(world);
  if (inside(x, y, fry)) {
    const slot = x < fry.x + fry.w / 2 ? 0 : 1;
    const job = world.fry[slot];
    if (job && job.remaining <= 0) return collectFromStation(world, 'fry', slot);
    return placeInStation(world, 'fry');
  }
  if (inside(x, y, chop)) {
    if (world.chop && world.chop.remaining <= 0) return collectFromStation(world, 'chop', 0);
    return placeInStation(world, 'chop');
  }
  if (inside(x, y, plate)) {
    const hasCooked = world.hands.some((item) => item === 'nasi' || item === 'ayam-goreng' || item === 'telur-dadar' || item === 'sayur-tumis' || item === 'sambal');
    if (hasCooked) return addToPlate(world);
    if (world.plate.length > 0) return removeFromPlate(world, world.plate.length - 1);
    return false;
  }
  if (inside(x, y, serve)) return servePlate(world) > 0;
  for (let i = 0; i < RAW_BINS.length; i += 1) {
    const rect = { x: bins.x + i * (bin.w + bin.gap), y: bins.y, w: bin.w, h: bin.h };
    if (inside(x, y, rect)) return takeRaw(world, RAW_BINS[i]);
  }
  return false;
}

/** Handle a key press. Returns 'start' | 'serve' | 'pause' | 'restart' | null. */
export function handleKey(world, key, screen) {
  if (world.transition) return null;
  if (key === ' ' || key === 'Enter') {
    if (screen !== 'play') return 'start';
    return servePlate(world) > 0 ? 'served' : null;
  }
  if (screen !== 'play') {
    if (key === 'r' || key === 'R') return 'restart';
    return null;
  }
  if (key === '1') return takeRice(world) ? 'took' : null;
  if (key === '2') return takeRaw(world, 'ayam') ? 'took' : null;
  if (key === '3') return takeRaw(world, 'telur') ? 'took' : null;
  if (key === '4') return takeRaw(world, 'sayur') ? 'took' : null;
  if (key === '5') return takeRaw(world, 'cabai') ? 'took' : null;
  if (key === 'v' || key === 'V') {
    // Walk the camera: map -> kitchen -> counter -> map.
    const next = world.view === 'hub' ? 'cook' : world.view === 'cook' ? 'front' : 'hub';
    return startTransition(world, next) ? 'took' : null;
  }
  if (key === 'f' || key === 'F') {
    for (let s = 0; s < 2; s += 1) if (collectFromStation(world, 'fry', s)) return 'took';
    return collectFromStation(world, 'chop', 0) ? 'took' : null;
  }
  if (key === 'p' || key === 'P' || key === 'Escape') return 'pause';
  if (key === 'r' || key === 'R') return 'restart';
  return null;
}
