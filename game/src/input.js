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

/** Flip the camera between the kitchen (top) and the counter (front). */
function toggleView(world) {
  world.view = world.view === 'front' ? 'top' : 'front';
  return true;
}

/** Handle a click at logical-field coordinates. Returns true when it did something. */
export function handleClick(world, x, y) {
  const { rice, fry, chop, plate, serve, bins, bin, viewToggle, front } = LAYOUT;
  if (inside(x, y, viewToggle)) return toggleView(world);
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
  if (key === 'v' || key === 'V') return toggleView(world) ? 'took' : null;
  if (key === 'f' || key === 'F') {
    for (let s = 0; s < 2; s += 1) if (collectFromStation(world, 'fry', s)) return 'took';
    return collectFromStation(world, 'chop', 0) ? 'took' : null;
  }
  if (key === 'p' || key === 'P' || key === 'Escape') return 'pause';
  if (key === 'r' || key === 'R') return 'restart';
  return null;
}
