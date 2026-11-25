// Everything the player sees: the warung's kitchen, the order board, the stations, the
// plate, the serve window and the HUD. All art is drawn in code, no image files.
import { FIELD, LAYOUT, PALETTE, FONT, INGREDIENTS, COOKED_ITEMS, DISHES } from './config.js';
import { matchingTicket } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

/** Soft ellipse shadow on the floor, centred at (x, y). */
function shadow(ctx, x, y, rx, ry) {
  ctx.fillStyle = 'rgba(43,29,18,0.18)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

/**
 * A counter block with a 2.5D feel: a soft floor shadow and a darker front face
 * below the top face, so the block reads as a solid box instead of a flat card.
 * The clickable rect stays the top face (r.x, r.y, r.w, r.h).
 */
function counter3d(ctx, r) {
  shadow(ctx, r.x + r.w / 2, r.y + r.h + 8, r.w * 0.42, 7);
  ctx.fillStyle = '#6b4423';
  rr(ctx, r.x, r.y + r.h - 6, r.w, 16, 8); ctx.fill();
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
}

/** The assembly plate with its items, centred at (cx, cy). Shared by both views. */
function drawPlateDish(ctx, cx, cy, items) {
  ctx.fillStyle = '#f7ead0';
  ctx.beginPath(); ctx.ellipse(cx, cy, 84, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c48f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, 84, 52, 0, 0, Math.PI * 2); ctx.stroke();
  if (items.length === 0) {
    text(ctx, 'piring kosong', cx, cy + 5, 13, PALETTE.muted, 600, 'center');
    return;
  }
  const spots = [[-34, -12], [30, -14], [-6, 14], [44, 16]];
  items.forEach((item, i) => {
    const [dx, dy] = spots[i % spots.length];
    drawIngredientIcon(ctx, item, cx + dx, cy + dy, 20);
  });
}

/** Draw one ingredient or cooked item as a small picture, centred at (x, y). */
export function drawIngredientIcon(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'nasi') {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath(); ctx.ellipse(0, 2, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c48f'; ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath(); ctx.ellipse(0, 2, r, r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e8dcc0';
    for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.arc(-r * 0.5 + i * r * 0.25, -r * 0.35 + (i % 2) * r * 0.2, r * 0.09, 0, Math.PI * 2); ctx.fill(); }
  } else if (id === 'ayam' || id === 'ayam-goreng') {
    ctx.fillStyle = id === 'ayam' ? '#f2b8a0' : '#d98a2b';
    ctx.beginPath(); ctx.arc(2, 0, r * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = id === 'ayam' ? '#e89a7a' : '#b96f1e';
    ctx.beginPath(); ctx.arc(-2, -2, r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff8e7'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.55, r * 0.55); ctx.lineTo(-r * 0.95, r * 0.95); ctx.stroke();
    if (id === 'ayam-goreng') {
      ctx.fillStyle = '#8a5a1d';
      for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(-r * 0.4 + i * r * 0.3, r * 0.3 - (i % 2) * r * 0.3, r * 0.08, 0, Math.PI * 2); ctx.fill(); }
    }
  } else if (id === 'telur' || id === 'telur-dadar') {
    if (id === 'telur') {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#f6d365';
      rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5); ctx.fill();
      ctx.fillStyle = '#e8a33d';
      ctx.beginPath(); ctx.arc(r * 0.3, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === 'sayur' || id === 'sayur-tumis') {
    ctx.fillStyle = id === 'sayur' ? '#4caf50' : '#6abe30';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.ellipse(-r * 0.5 + i * r * 0.5, (i % 2) * r * 0.25, r * 0.42, r * 0.6, (i - 1) * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    if (id === 'sayur-tumis') {
      ctx.fillStyle = '#c8f169';
      for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(-r * 0.4 + i * r * 0.4, -r * 0.2, r * 0.1, 0, Math.PI * 2); ctx.fill(); }
    }
  } else if (id === 'cabai' || id === 'sambal') {
    if (id === 'cabai') {
      ctx.strokeStyle = '#e63946'; ctx.lineWidth = r * 0.34; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.4); ctx.quadraticCurveTo(0, r * 0.9, r * 0.8, -r * 0.5); ctx.stroke();
      ctx.strokeStyle = '#4caf50'; ctx.lineWidth = r * 0.2;
      ctx.beginPath(); ctx.moveTo(r * 0.8, -r * 0.5); ctx.lineTo(r * 1.05, -r * 0.85); ctx.stroke();
    } else {
      ctx.fillStyle = '#c1121f';
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffba08';
      for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.arc(-r * 0.6 + i * r * 0.3, (i % 2 ? -1 : 1) * r * 0.2, r * 0.09, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  ctx.restore();
}

function drawBackground(ctx, view) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  if (view === 'hub') {
    // The hub is the warung itself from directly above: a dark frame, then
    // two rooms with different floors — cream checkerboard in the kitchen,
    // terracotta checkerboard in the dining room — and a flat wooden counter
    // band between them. No walls, no front faces: every room is a footprint.
    const { hub } = LAYOUT;
    ctx.fillStyle = PALETTE.board;
    ctx.fillRect(0, 56, FIELD.width, FIELD.height - 56);
    checkerFloor(ctx, hub.kitchen.x, hub.kitchen.y, hub.kitchen.w, hub.kitchen.h, 42, '#f2e6c8', '#e6d5ae');
    checkerFloor(ctx, hub.dining.x, hub.dining.y, hub.dining.w, hub.dining.h, 50, '#d98a5f', '#c97a4e');
    ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 4;
    rr(ctx, hub.kitchen.x, hub.kitchen.y, hub.kitchen.w, hub.kitchen.h, 8); ctx.stroke();
    rr(ctx, hub.dining.x, hub.dining.y, hub.dining.w, hub.dining.h, 8); ctx.stroke();
    // Big translucent room names across each floor, like a floor plan.
    ctx.fillStyle = 'rgba(43,29,18,0.10)';
    ctx.font = `800 48px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DAPUR', 640, 216);
    ctx.font = `800 44px ${FONT}`;
    ctx.fillText('RUANG MAKAN', 640, 644);
    return;
  }
  if (view === 'front') {
    // The warung's front: a big window onto the street, a hanging lamp, a sign.
    // It sits where the order board is in the top view (the board is hidden here).
    ctx.fillStyle = '#7ec8e3';
    rr(ctx, 380, 64, 520, 116, 16); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(820, 106, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b9bb4';
    ctx.fillRect(400, 140, 110, 40);
    ctx.fillRect(530, 120, 130, 60);
    ctx.fillRect(700, 148, 90, 32);
    ctx.strokeStyle = '#5a4028'; ctx.lineWidth = 8;
    rr(ctx, 380, 64, 520, 116, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(640, 64); ctx.lineTo(640, 180); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(380, 120); ctx.lineTo(900, 120); ctx.stroke();
    ctx.fillStyle = '#3d2b1f';
    rr(ctx, 60, 100, 220, 56, 10); ctx.fill();
    text(ctx, 'WARUNG', 170, 126, 22, '#ffd166', 800, 'center');
    text(ctx, 'BUKA • MASAK CEPAT', 170, 146, 11, '#e8cba0', 600, 'center');
    ctx.fillStyle = '#fff6df';
    rr(ctx, 1000, 100, 220, 120, 10); ctx.fill();
    text(ctx, 'MENU', 1110, 126, 14, PALETTE.muted, 800, 'center');
    text(ctx, 'Nasi Ayam $8', 1020, 152, 13, PALETTE.text, 600);
    text(ctx, 'Nasi Telur $6', 1020, 172, 13, PALETTE.text, 600);
    text(ctx, 'Nasi Komplit $14', 1020, 192, 13, PALETTE.text, 600);
    ctx.strokeStyle = '#5a4028'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(330, 64); ctx.lineTo(330, 90); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(330, 112, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,209,102,0.25)';
    ctx.beginPath(); ctx.arc(330, 112, 30, 0, Math.PI * 2); ctx.fill();
    drawFloor(ctx);
    return;
  }
  // The kitchen from directly above: one big checkerboard floor, stations
  // along the top as flat footprints, the cook a dot on the open floor.
  checkerFloor(ctx, 0, 56, FIELD.width, FIELD.height - 56, 80, '#f2e6c8', '#e6d5ae');
}

/** A checkerboard floor in two tones, for a top-down room. */
function checkerFloor(ctx, x, y, w, h, s, c1, c2) {
  ctx.fillStyle = c1;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c2;
  const cols = Math.ceil(w / s);
  const rows = Math.ceil(h / s);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((r + c) % 2 === 0) continue;
      ctx.fillRect(x + c * s, y + r * s, s, s);
    }
  }
}

/** The floor strip at the bottom, with perspective seams fanning outward. */
function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 640, FIELD.width, 80);
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(80 + i * 140, 640);
    ctx.lineTo(20 + i * 155, 720);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, 680); ctx.lineTo(FIELD.width, 680); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 636, FIELD.width, 4);
}

function drawHud(ctx, world) {
  const { hud } = LAYOUT;
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(hud.x, hud.y, hud.w, hud.h);
  text(ctx, 'WARUNG KILAT', 20, 38, 28, '#ffd166', 800);
  text(ctx, 'HARI ' + world.day, 330, 38, 20, '#fff8e7', 700);
  const dayLeft = Math.max(0, world.dayTime);
  ctx.fillStyle = '#5a4028';
  rr(ctx, 420, 22, 150, 14, 7); ctx.fill();
  ctx.fillStyle = dayLeft < 20 ? PALETTE.red : PALETTE.teal;
  rr(ctx, 420, 22, 150 * (dayLeft / 120), 14, 7); ctx.fill();
  text(ctx, `${Math.ceil(dayLeft)} dtk`, 580, 36, 14, '#fff8e7', 600);
  text(ctx, '🪙', 630, 38, 22, '#ffd166', 700, 'left');
  text(ctx, `${world.coins}`, 660, 38, 24, '#ffd166', 800);
  let hearts = '';
  for (let i = 0; i < 3; i += 1) hearts += i < world.hearts ? '♥' : '♡';
  text(ctx, hearts, 750, 38, 24, '#ff6b81', 700);
  text(ctx, `Saji: ${world.served}`, 850, 38, 16, '#fff8e7', 600);
  if (world.combo >= 2) text(ctx, `COMBO x${world.combo}`, 940, 38, 20, '#ff9f1c', 800);
  drawViewTabs(ctx, world);
}

/** The three view tabs at the top right (1 PETA / 2 DAPUR / 3 KONTER):
 *  the active view is gold, the others dark — tap one to walk there. */
function drawViewTabs(ctx, world) {
  const tabs = [
    { key: 'hub', label: '1  PETA', rect: LAYOUT.viewTabs.hub },
    { key: 'cook', label: '2  DAPUR', rect: LAYOUT.viewTabs.cook },
    { key: 'front', label: '3  KONTER', rect: LAYOUT.viewTabs.front },
  ];
  for (const tab of tabs) {
    const active = world.view === tab.key;
    ctx.fillStyle = active ? '#ffd166' : '#5a4028';
    rr(ctx, tab.rect.x, tab.rect.y, tab.rect.w, tab.rect.h, 18); ctx.fill();
    if (!active) {
      ctx.strokeStyle = '#8b7355'; ctx.lineWidth = 1.5;
      rr(ctx, tab.rect.x, tab.rect.y, tab.rect.w, tab.rect.h, 18); ctx.stroke();
    }
    text(ctx, tab.label, tab.rect.x + tab.rect.w / 2, tab.rect.y + 24, 13, active ? '#2b1d12' : '#fff8e7', 800, 'center');
  }
}

function drawTicket(ctx, ticket, x, y, w, h, now) {
  const dish = DISHES[ticket.dishId];
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const urgent = frac < 0.3;
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = urgent && Math.floor(now * 4) % 2 === 0 ? PALETTE.red : PALETTE.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10); ctx.stroke();
  text(ctx, dish.name, x + 12, y + 26, 19, PALETTE.text, 800);
  text(ctx, dish.en, x + 12, y + 44, 12, PALETTE.muted, 600);
  text(ctx, `$${dish.price}`, x + w - 12, y + 26, 20, '#b96f1e', 800, 'right');
  dish.needs.forEach((item, i) => {
    const cx = x + 40 + i * 68;
    drawIngredientIcon(ctx, item, cx, y + 62, 12);
    text(ctx, COOKED_ITEMS[item].short, cx, y + 84, 11, PALETTE.text, 600, 'center');
  });
  ctx.fillStyle = '#e5d5ae';
  rr(ctx, x + 12, y + h - 16, w - 24, 8, 4); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.3 ? '#f4a261' : PALETTE.red;
  rr(ctx, x + 12, y + h - 16, (w - 24) * frac, 8, 4); ctx.fill();
}

function drawBoard(ctx, world, now) {
  const { board, ticket } = LAYOUT;
  ctx.fillStyle = PALETTE.board;
  rr(ctx, board.x, board.y, board.w, board.h, 12); ctx.fill();
  text(ctx, 'PESANAN', board.x + 16, board.y + 22, 13, '#e8cba0', 800);
  if (world.tickets.length === 0) {
    text(ctx, 'Belum ada pesanan — pelanggan segera datang…', board.x + 120, board.y + 74, 18, '#e8cba0', 600);
    return;
  }
  let x = board.x + 16;
  for (const t of world.tickets) {
    drawTicket(ctx, t, x, board.y + 8, ticket.w, ticket.h, now);
    x += ticket.w + ticket.gap;
  }
}

/**
 * One cooking slot, seen from directly above: a flat dark pan with the job's
 * icon in it and a progress ring around the rim. No card, no front face.
 */
function drawPan(ctx, x, y, w, h, job, label) {
  const cx = x + w / 2;
  const cy = y + h / 2 - 4;
  const r = Math.min(w, h) / 2 - 8;
  ctx.fillStyle = '#3d2b1f';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a4028';
  ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, Math.PI * 2); ctx.fill();
  if (!job) {
    text(ctx, label, cx, cy + 5, 13, '#a98f6f', 600, 'center');
    return;
  }
  drawIngredientIcon(ctx, job.remaining <= 0 ? job.cookedId : job.raw, cx, cy, r - 14);
  ring(ctx, cx, cy, r + 2, 1 - job.remaining / job.total, job.remaining <= 0 ? PALETTE.green : '#f4a261');
  if (job.remaining <= 0) text(ctx, 'SIAP!', cx, y + 16, 14, PALETTE.green, 800, 'center');
}

/**
 * The kitchen stations, seen from directly above: each one is a flat footprint
 * on the checkerboard floor — a pot, two pans, a board, a plate, a bell — with
 * its name written under it. The old 2.5D boxes are gone: from above, a
 * station has no front face.
 */
function drawStations(ctx, world, now) {
  const { rice, fry, chop, plate, serve } = LAYOUT;
  // Rice cooker: a flat pot on the floor, lid on top, steam curling up.
  ctx.fillStyle = '#a9713d';
  rr(ctx, rice.x, rice.y, rice.w, rice.h, 10); ctx.fill();
  ctx.fillStyle = '#9aa5b1';
  ctx.beginPath(); ctx.arc(rice.x + 90, rice.y + 66, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6b7280';
  ctx.beginPath(); ctx.arc(rice.x + 90, rice.y + 66, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.ellipse(rice.x + 90, rice.y + 66, 28, 20, 0, 0, Math.PI * 2); ctx.fill();
  const steam = Math.sin(now * 2) * 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(rice.x + 70 + steam, rice.y + 26); ctx.quadraticCurveTo(rice.x + 76, rice.y + 12, rice.x + 70, rice.y + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rice.x + 108 - steam, rice.y + 26); ctx.quadraticCurveTo(rice.x + 102, rice.y + 12, rice.x + 108, rice.y + 2); ctx.stroke();
  text(ctx, 'NASI', rice.x + 90, rice.y + rice.h + 18, 13, PALETTE.text, 800, 'center');
  text(ctx, 'klik: ambil nasi', rice.x + 90, rice.y + rice.h + 36, 11, PALETTE.muted, 600, 'center');

  // Wok: a flat dark slab with two pans on it.
  ctx.fillStyle = '#a9713d';
  rr(ctx, fry.x, fry.y, fry.w, fry.h, 10); ctx.fill();
  drawPan(ctx, fry.x + 14, fry.y + 14, 120, 120, world.fry[0], 'slot 1');
  drawPan(ctx, fry.x + 146, fry.y + 14, 120, 120, world.fry[1], 'slot 2');
  text(ctx, 'WAJAN — GORENG', fry.x + fry.w / 2, fry.y + fry.h + 18, 13, PALETTE.text, 800, 'center');

  // Chopping board: a flat pale board with the job on it.
  ctx.fillStyle = '#a9713d';
  rr(ctx, chop.x, chop.y, chop.w, chop.h, 10); ctx.fill();
  ctx.fillStyle = '#e8cba0';
  rr(ctx, chop.x + 14, chop.y + 14, chop.w - 28, 120, 8); ctx.fill();
  if (world.chop) {
    drawIngredientIcon(ctx, world.chop.remaining <= 0 ? world.chop.cookedId : world.chop.raw, chop.x + chop.w / 2, chop.y + 74, 24);
    ring(ctx, chop.x + chop.w / 2, chop.y + 74, 34, 1 - world.chop.remaining / world.chop.total, world.chop.remaining <= 0 ? PALETTE.green : '#f4a261');
    if (world.chop.remaining <= 0) text(ctx, 'SIAP!', chop.x + chop.w / 2, chop.y + 30, 14, PALETTE.green, 800, 'center');
  } else {
    text(ctx, 'kosong', chop.x + chop.w / 2, chop.y + 80, 13, PALETTE.muted, 600, 'center');
  }
  text(ctx, 'TALENAN — POTONG', chop.x + chop.w / 2, chop.y + chop.h + 18, 13, PALETTE.text, 800, 'center');

  // Assembly plate: a flat ellipse on the floor.
  ctx.fillStyle = '#a9713d';
  rr(ctx, plate.x, plate.y, plate.w, plate.h, 10); ctx.fill();
  drawPlateDish(ctx, plate.x + 110, plate.y + 74, world.plate);
  text(ctx, 'PIRING SAJI', plate.x + 110, plate.y + plate.h + 18, 13, PALETTE.text, 800, 'center');

  // Serve bell: a flat button on the floor.
  ctx.fillStyle = '#a9713d';
  rr(ctx, serve.x, serve.y, serve.w, serve.h, 10); ctx.fill();
  const match = matchingTicket(world);
  const glow = match && Math.floor(now * 3) % 2 === 0;
  ctx.fillStyle = match ? (glow ? '#34c0a9' : PALETTE.serveReady) : PALETTE.serveIdle;
  rr(ctx, serve.x + 28, serve.y + 40, 180, 52, 12); ctx.fill();
  text(ctx, match ? 'SAJIKAN!  ⏎' : 'SAJIKAN', serve.x + 118, serve.y + 74, 22, '#ffffff', 800, 'center');
  if (world.lastServed) {
    const dish = DISHES[world.lastServed.dishId];
    text(ctx, `✓ ${dish.name}`, serve.x + 118, serve.y + 116, 14, '#ffd166', 700, 'center');
    text(ctx, `+${world.lastServed.coins} koin`, serve.x + 118, serve.y + 136, 13, '#fff8e7', 600, 'center');
  } else if (match) {
    text(ctx, 'piring cocok!', serve.x + 118, serve.y + 116, 13, '#ffd166', 700, 'center');
  } else {
    text(ctx, 'rakit pesanan di piring', serve.x + 118, serve.y + 116, 12, '#e8cba0', 600, 'center');
  }
}

function drawCookAndBins(ctx, world, now) {
  const { bins, bin, hands } = LAYOUT;
  // The cook, seen from directly above: a dot on the open floor — red shirt,
  // head, white hat — with the carried items as small circles beside him.
  const cx = 640;
  const cy = 434;
  shadow(ctx, cx, cy + 8, 30, 7);
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.arc(cx, cy - 3, 13, Math.PI, 0); ctx.fill();
  text(ctx, 'KOKI', cx, cy + 46, 12, PALETTE.text, 800, 'center');
  // Carried items float beside the cook
  world.hands.forEach((item, i) => {
    const hx = cx + 56 + i * 48;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.arc(hx, cy, 20, 0, Math.PI * 2); ctx.fill();
    drawIngredientIcon(ctx, item, hx, cy, 14);
  });

  // Ingredient bins: flat cards on the floor, no 2.5D box.
  const raws = ['ayam', 'telur', 'sayur', 'cabai'];
  const keys = ['2', '3', '4', '5'];
  raws.forEach((id, i) => {
    const x = bins.x + i * (bin.w + bin.gap);
    const def = INGREDIENTS[id];
    ctx.fillStyle = '#8b5a2b';
    rr(ctx, x, bins.y, bin.w, bin.h, 10); ctx.fill();
    drawIngredientIcon(ctx, id, x + 40, bins.y + 52, 24);
    text(ctx, def.name, x + 76, bins.y + 44, 17, '#fff8e7', 800);
    text(ctx, def.station === 'fry' ? '→ wajan' : '→ talenan', x + 76, bins.y + 66, 12, '#e8cba0', 600);
    text(ctx, `[${keys[i]}]`, x + bin.w - 14, bins.y + 24, 12, '#ffd166', 700, 'right');
  });
  // Hands box
  ctx.fillStyle = PALETTE.board;
  rr(ctx, hands.x, hands.y, hands.w, hands.h, 10); ctx.fill();
  text(ctx, 'TANGAN', hands.x + 14, hands.y + 24, 12, '#e8cba0', 800);
  if (world.hands.length === 0) {
    text(ctx, 'kosong', hands.x + 14, hands.y + 58, 15, '#fff8e7', 600);
  } else {
    let hx = hands.x + 30;
    for (const item of world.hands) {
      drawIngredientIcon(ctx, item, hx, hands.y + 58, 17);
      hx += 48;
    }
    text(ctx, `${world.hands.length}/2`, hands.x + hands.w - 14, hands.y + 24, 12, '#ffd166', 700, 'right');
  }
  text(ctx, 'Klik bahan → klik stasiun → klik piring → SAJIKAN.  [1] nasi  [Spasi] sajikan  •  tab PETA/DAPUR/KONTER atau [V] ganti view  •  [P] jeda', LAYOUT.help.x, LAYOUT.help.y + 22, 14, '#3d2b1f', 600);
}

function drawFlashes(ctx, world) {
  for (const f of world.flashes) {
    const alpha = 1 - f.time / 1.4;
    ctx.globalAlpha = alpha;
    text(ctx, f.text, FIELD.width / 2, 320 - f.time * 40, 30, f.kind === 'bad' ? PALETTE.red : '#2a9d8f', 800, 'center');
    ctx.globalAlpha = 1;
  }
}

function drawBanner(ctx, world) {
  if (world.bannerTime <= 0 || !world.banner) return;
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  rr(ctx, 340, 300, 600, 64, 14); ctx.fill();
  text(ctx, world.banner, 640, 342, 30, '#ffd166', 800, 'center');
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(43,29,18,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'WARUNG KILAT', 640, 190, 84, '#ffd166', 800, 'center');
  text(ctx, 'Masak cepat, sajikan tepat waktu — sebelum pelanggan kabur!', 640, 240, 24, '#fff8e7', 600, 'center');
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, 340, 280, 600, 190, 14); ctx.fill();
  text(ctx, 'MENU HARI INI', 640, 316, 16, PALETTE.muted, 800, 'center');
  const dishes = Object.values(DISHES);
  dishes.forEach((dish, i) => {
    const y = 350 + i * 26;
    text(ctx, dish.name, 380, y, 16, PALETTE.text, 700);
    text(ctx, dish.needs.map((n) => COOKED_ITEMS[n].name).join(' + '), 850, y, 12, PALETTE.muted, 600, 'right');
    text(ctx, `$${dish.price}`, 900, y, 16, '#b96f1e', 800, 'right');
  });
  text(ctx, 'Klik atau tekan SPASI untuk mulai', 640, 530, 24, '#fff8e7', 700, 'center');
  text(ctx, 'Mouse: klik bahan, stasiun, piring, lalu SAJIKAN  •  3 hati — pelanggan yang pergi mengambil satu', 640, 566, 15, '#e8cba0', 600, 'center');
  if (best > 0) text(ctx, `Skor terbaik: ${best} koin`, 640, 606, 16, '#ffd166', 700, 'center');
}

function drawGameOver(ctx, world, best) {
  ctx.fillStyle = 'rgba(43,29,18,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'WARUNG TUTUP', 640, 220, 72, '#ffd166', 800, 'center');
  text(ctx, 'Semua pelanggan pergi — besok coba lagi, Koki!', 640, 272, 22, '#fff8e7', 600, 'center');
  text(ctx, `Koin: ${world.coins}   •   Pesanan disajikan: ${world.served}   •   Hari: ${world.day}   •   Combo terbaik: x${world.bestCombo}`, 640, 340, 20, '#fff8e7', 700, 'center');
  if (world.coins >= best && world.coins > 0) text(ctx, '★ Skor terbaik baru! ★', 640, 384, 22, '#ffd166', 800, 'center');
  text(ctx, 'Tekan R untuk main lagi', 640, 440, 22, '#e8cba0', 700, 'center');
}

/** A ring that fills clockwise as `frac` goes 0..1 (a cooking or patience ring). */
function ring(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

/** The hub: the whole warung from directly above — kitchen, counter, dining
 *  room — with the live state (jobs, plate, waiting customers) drawn on it.
 *  Everything is a footprint on the floor: round tables with chairs around
 *  them, customers as dots seen from above, stations as flat shapes with
 *  their names under them. No front faces anywhere. */
function drawHubScene(ctx, world, now) {
  const { hub } = LAYOUT;
  const match = matchingTicket(world);
  // Kitchen stations along the top wall, names under each one.
  const rc = { x: hub.rice.x + hub.rice.w / 2, y: hub.rice.y + hub.rice.h / 2 };
  ctx.fillStyle = '#9aa5b1';
  ctx.beginPath(); ctx.arc(rc.x, rc.y, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.ellipse(rc.x, rc.y, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'NASI', rc.x, hub.rice.y + hub.rice.h + 18, 12, PALETTE.text, 800, 'center');
  // Stove with two burners; a job shows its icon and a progress ring.
  ctx.fillStyle = '#3d2b1f';
  rr(ctx, hub.stove.x, hub.stove.y, hub.stove.w, hub.stove.h, 10); ctx.fill();
  [330, 430].forEach((bx, i) => {
    const job = world.fry[i];
    ctx.fillStyle = '#5a4028';
    ctx.beginPath(); ctx.arc(bx, 135, 26, 0, Math.PI * 2); ctx.fill();
    if (job) {
      drawIngredientIcon(ctx, job.remaining <= 0 ? job.cookedId : job.raw, bx, 135, 14);
      ring(ctx, bx, 135, 31, 1 - job.remaining / job.total, job.remaining <= 0 ? PALETTE.green : '#f4a261');
    }
  });
  text(ctx, 'WAJAN', 380, hub.stove.y + hub.stove.h + 18, 12, PALETTE.text, 800, 'center');
  // Chopping board.
  ctx.fillStyle = '#e8cba0';
  rr(ctx, hub.chop.x, hub.chop.y, hub.chop.w, hub.chop.h, 10); ctx.fill();
  if (world.chop) {
    drawIngredientIcon(ctx, world.chop.remaining <= 0 ? world.chop.cookedId : world.chop.raw, 615, 135, 16);
    ring(ctx, 615, 135, 32, 1 - world.chop.remaining / world.chop.total, world.chop.remaining <= 0 ? PALETTE.green : '#f4a261');
  }
  text(ctx, 'TALENAN', 615, hub.chop.y + hub.chop.h + 18, 12, PALETTE.text, 800, 'center');
  // Assembly plate, seen from above.
  drawPlateDish(ctx, 825, 135, world.plate);
  text(ctx, 'PIRING', 825, hub.plate.y + hub.plate.h + 18, 12, PALETTE.text, 800, 'center');
  // Serve bell.
  ctx.fillStyle = match ? PALETTE.serveReady : PALETTE.serveIdle;
  rr(ctx, hub.serve.x, hub.serve.y, hub.serve.w, hub.serve.h, 10); ctx.fill();
  text(ctx, match ? 'SAJIKAN!' : 'SAJIKAN', 1070, 135, 20, '#ffffff', 800, 'center');
  if (match) text(ctx, DISHES[match.dishId].name, 1070, 157, 12, '#ffffff', 600, 'center');
  // Ingredient bins along the bottom of the kitchen.
  const raws = ['ayam', 'telur', 'sayur', 'cabai'];
  raws.forEach((id, i) => {
    const x = hub.bins.x + i * (hub.bins.w + hub.bins.gap);
    ctx.fillStyle = '#8b5a2b';
    rr(ctx, x, hub.bins.y, hub.bins.w, hub.bins.h, 8); ctx.fill();
    drawIngredientIcon(ctx, id, x + 30, hub.bins.y + 26, 15);
    text(ctx, INGREDIENTS[id].name.toUpperCase(), x + 56, hub.bins.y + 31, 12, '#fff8e7', 800);
  });
  // The cook, seen from above: a dot on the kitchen floor.
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.arc(hub.cook.x, hub.cook.y, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(hub.cook.x, hub.cook.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.arc(hub.cook.x, hub.cook.y - 3, 13, Math.PI, 0); ctx.fill();
  text(ctx, 'KOKI', hub.cook.x, hub.cook.y + 44, 12, PALETTE.text, 800, 'center');
  // The serving counter: a flat wooden band with its name on it.
  ctx.fillStyle = '#a9713d';
  ctx.fillRect(hub.counter.x, hub.counter.y, hub.counter.w, hub.counter.h);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(hub.counter.x, hub.counter.y, hub.counter.w, 5);
  text(ctx, 'KONTER', 640, hub.counter.y + 36, 16, '#fff8e7', 800, 'center');
  // Dining room: round tables with chairs around them, one customer per
  // ticket, seated on the far side and seen from above, with an order card.
  for (let i = 0; i < 4; i += 1) {
    const cx = hub.tableRow.x + i * (hub.table.w + hub.table.gap) + hub.table.w / 2;
    const cy = hub.tableRow.y + hub.table.h / 2;
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a9713d';
    ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
    // Chairs: small dots on all four sides of the table.
    ctx.fillStyle = '#6b4423';
    [[0, -72], [0, 72], [-72, 0], [72, 0]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 13, 0, Math.PI * 2); ctx.fill();
    });
    const ticket = world.tickets[i];
    if (!ticket) continue;
    const dish = DISHES[ticket.dishId];
    const frac = Math.max(0, ticket.patience / ticket.maxPatience);
    // Order card floating above the customer.
    ctx.fillStyle = '#fff6df';
    rr(ctx, cx - 70, cy - 152, 140, 42, 8); ctx.fill();
    ctx.strokeStyle = '#d9c48f'; ctx.lineWidth = 2;
    rr(ctx, cx - 70, cy - 152, 140, 42, 8); ctx.stroke();
    text(ctx, dish.name, cx, cy - 132, 12, PALETTE.text, 800, 'center');
    text(ctx, `$${dish.price}`, cx, cy - 118, 11, '#b96f1e', 800, 'center');
    // Seated on the far side of the table, facing the counter.
    ctx.fillStyle = CUSTOMER_SHIRTS[ticket.id % 4];
    ctx.beginPath(); ctx.arc(cx, cy - 72, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = CUSTOMER_SKINS[ticket.id % 4];
    ctx.beginPath(); ctx.arc(cx, cy - 72, 11, 0, Math.PI * 2); ctx.fill();
    ring(ctx, cx, cy - 72, 27, frac, frac > 0.5 ? PALETTE.green : frac > 0.3 ? '#f4a261' : PALETTE.red);
    drawIngredientIcon(ctx, dish.needs[0], cx - 58, cy, 10);
  }
  // Potted plants in the corners of the map (the bottom-right one sits left of
  // the view button so the button never covers it).
  [[70, 92], [1210, 92], [70, 644], [1100, 644]].forEach(([px, py]) => {
    ctx.fillStyle = '#2a9d8f';
    ctx.beginPath(); ctx.arc(px, py, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6abe30';
    ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
  });
  text(ctx, 'Klik DAPUR untuk masak  •  klik PELANGGAN untuk melayani  •  tab PETA/DAPUR/KONTER atau [V] ganti view', 640, 700, 14, '#e8cba0', 600, 'center');
}

const CUSTOMER_SKINS = ['#f2c89b', '#e8b88a', '#d9a06b', '#c98d5f'];
const CUSTOMER_SHIRTS = ['#e63946', '#2a9d8f', '#f4a261', '#7b5ea7'];
const CUSTOMER_HAIRS = ['#2b1d12', '#5a4028', '#8b5a2b', '#2b1d12'];

/** One waiting customer in the front view: patience bar, dish name, face, shirt. */
function drawCustomer(ctx, ticket, cx, now, isMatch) {
  const dish = DISHES[ticket.dishId];
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const i = ticket.id % 4;
  ctx.fillStyle = '#e5d5ae';
  rr(ctx, cx - 60, 182, 120, 8, 4); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.3 ? '#f4a261' : PALETTE.red;
  rr(ctx, cx - 60, 182, 120 * frac, 8, 4); ctx.fill();
  text(ctx, dish.name, cx, 210, 13, PALETTE.text, 800, 'center');
  shadow(ctx, cx, 378, 56, 8);
  ctx.fillStyle = CUSTOMER_SKINS[i];
  ctx.beginPath(); ctx.arc(cx, 252, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CUSTOMER_HAIRS[i];
  ctx.beginPath(); ctx.arc(cx, 246, 34, Math.PI, 0); ctx.fill();
  ctx.fillRect(cx - 34, 240, 68, 8);
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.arc(cx - 12, 252, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 12, 252, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, 264, 10, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = CUSTOMER_SHIRTS[i];
  rr(ctx, cx - 52, 292, 104, 112, 18); ctx.fill();
  if (isMatch) {
    ctx.strokeStyle = Math.floor(now * 3) % 2 === 0 ? '#34c0a9' : PALETTE.serveReady;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, 252, 44, 0, Math.PI * 2); ctx.stroke();
    text(ctx, 'SIAP DISAJIKAN', cx, 176, 12, PALETTE.serveReady, 800, 'center');
  }
}

/** An empty stool where no customer waits yet. */
function drawEmptyStool(ctx, cx) {
  text(ctx, 'kursi kosong', cx, 210, 13, PALETTE.muted, 600, 'center');
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath(); ctx.ellipse(cx, 330, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 30, 338, 8, 60);
  ctx.fillRect(cx + 22, 338, 8, 60);
}

/** The front view: customers behind the serving counter, plate + serve on it. */
function drawFrontScene(ctx, world, now) {
  const { front } = LAYOUT;
  const match = matchingTicket(world);
  for (let i = 0; i < 4; i += 1) {
    const cx = front.custRow.x + i * (front.customer.w + front.customer.gap) + front.customer.w / 2;
    const ticket = world.tickets[i];
    if (ticket) drawCustomer(ctx, ticket, cx, now, match && match.id === ticket.id);
    else drawEmptyStool(ctx, cx);
  }
  counter3d(ctx, front.counter);
  ctx.fillStyle = '#a9713d';
  ctx.fillRect(front.counter.x, front.counter.y, front.counter.w, 6);
  drawPlateDish(ctx, front.plate.x + 150, front.plate.y + 44, world.plate);
  const glow = match && Math.floor(now * 3) % 2 === 0;
  ctx.fillStyle = match ? (glow ? '#34c0a9' : PALETTE.serveReady) : PALETTE.serveIdle;
  rr(ctx, front.serve.x, front.serve.y, front.serve.w, front.serve.h, 12); ctx.fill();
  text(ctx, match ? 'SAJIKAN!  ⏎' : 'SAJIKAN', front.serve.x + front.serve.w / 2, front.serve.y + 46, 22, '#ffffff', 800, 'center');
  if (world.lastServed) {
    const dish = DISHES[world.lastServed.dishId];
    text(ctx, `✓ ${dish.name}  +${world.lastServed.coins} koin`, 640, 560, 16, '#ffd166', 700, 'center');
  } else if (match) {
    text(ctx, 'Piring cocok dengan pesanan pelanggan — sajikan ke mereka!', 640, 560, 15, '#ffd166', 700, 'center');
  } else {
    text(ctx, 'Rakit pesanan di dapur (view atas), lalu sajikan di sini', 640, 560, 14, '#e8cba0', 600, 'center');
  }
  text(ctx, 'View depan — klik pelanggan untuk menyajikan ke mereka  •  [V] peta', 640, 596, 13, '#3d2b1f', 600, 'center');
}

/** The view switch button (bottom-right, every view): from the map it walks
 *  into the kitchen; from a room it walks back to the map. */
function drawViewToggle(ctx, world) {
  const t = LAYOUT.viewToggle;
  ctx.fillStyle = PALETTE.board;
  rr(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill();
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  rr(ctx, t.x, t.y, t.w, t.h, 10); ctx.stroke();
  text(ctx, world.view === 'hub' ? '👁 MASAK' : '👁 PETA', t.x + t.w / 2, t.y + 26, 15, '#ffd166', 800, 'center');
}

/** Draw one view (background, board, scene, HUD) without the toggle/flashes. */
function drawScene(ctx, world, screen, now, best, view) {
  drawBackground(ctx, view);
  if (view !== 'front' && view !== 'hub') drawBoard(ctx, world, now);
  if (view === 'front') drawFrontScene(ctx, world, now);
  else if (view === 'hub') drawHubScene(ctx, world, now);
  else {
    drawStations(ctx, world, now);
    drawCookAndBins(ctx, world, now);
  }
  drawHud(ctx, world);
}

/** Ease a 0..1 progress for the camera walk (slow start and end). */
function easeWalk(p) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

/** Draw one frame of the game. `screen` is title, play or over; `now` drives animation. */
export function draw(ctx, world, screen, now, best) {
  const tr = world.transition;
  if (tr) {
    // A camera walk: the destination view settles from slightly small to full
    // size, while the view we leave zooms toward the zone we walk into and
    // fades out — the camera dives into the room instead of cutting to it.
    const p = easeWalk(Math.min(1, tr.t / tr.dur));
    ctx.save();
    ctx.translate(640, 360);
    ctx.scale(0.94 + 0.06 * p, 0.94 + 0.06 * p);
    ctx.translate(-640, -360);
    drawScene(ctx, world, screen, now, best, tr.to);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.translate(tr.cx, tr.cy);
    ctx.scale(1 + 0.2 * p, 1 + 0.2 * p);
    ctx.translate(-tr.cx, -tr.cy);
    drawScene(ctx, world, screen, now, best, tr.from);
    ctx.restore();
  } else {
    drawScene(ctx, world, screen, now, best, world.view);
  }
  drawViewToggle(ctx, world);
  drawFlashes(ctx, world);
  drawBanner(ctx, world);
  if (screen === SCREEN_TITLE) drawTitle(ctx, world, best);
  if (screen === SCREEN_OVER) drawGameOver(ctx, world, best);
}
