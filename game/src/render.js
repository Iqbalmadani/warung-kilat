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

function drawBackground(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.wallStripe;
  for (let x = 0; x < FIELD.width; x += 96) ctx.fillRect(x, 0, 48, FIELD.height);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 640, FIELD.width, 80);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 636, FIELD.width, 4);
}

function drawHud(ctx, world) {
  const { hud } = LAYOUT;
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(hud.x, hud.y, hud.w, hud.h);
  text(ctx, 'WARUNG KILAT', 20, 38, 28, '#ffd166', 800);
  text(ctx, 'HARI ' + world.day, 420, 38, 20, '#fff8e7', 700);
  const dayLeft = Math.max(0, world.dayTime);
  ctx.fillStyle = '#5a4028';
  rr(ctx, 500, 22, 180, 14, 7); ctx.fill();
  ctx.fillStyle = dayLeft < 20 ? PALETTE.red : PALETTE.teal;
  rr(ctx, 500, 22, 180 * (dayLeft / 120), 14, 7); ctx.fill();
  text(ctx, `${Math.ceil(dayLeft)} dtk`, 690, 36, 14, '#fff8e7', 600);
  text(ctx, '🪙', 760, 38, 22, '#ffd166', 700, 'left');
  text(ctx, `${world.coins}`, 790, 38, 24, '#ffd166', 800);
  let hearts = '';
  for (let i = 0; i < 3; i += 1) hearts += i < world.hearts ? '♥' : '♡';
  text(ctx, hearts, 900, 38, 24, '#ff6b81', 700);
  if (world.combo >= 2) text(ctx, `COMBO x${world.combo}`, 1020, 38, 20, '#ff9f1c', 800);
  text(ctx, `Saji: ${world.served}`, 1160, 38, 16, '#fff8e7', 600);
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

function drawSlot(ctx, x, y, w, h, job, label) {
  ctx.fillStyle = '#fff8e7';
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = '#d9c48f'; ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 8); ctx.stroke();
  if (!job) {
    text(ctx, label, x + w / 2, y + h / 2 + 5, 13, PALETTE.muted, 600, 'center');
    return;
  }
  ctx.fillStyle = '#efe3c8';
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2 - 6, 27, 0, Math.PI * 2); ctx.fill();
  drawIngredientIcon(ctx, job.remaining <= 0 ? job.cookedId : job.raw, x + w / 2, y + h / 2 - 6, 22);
  const frac = 1 - job.remaining / job.total;
  ctx.fillStyle = '#e5d5ae';
  rr(ctx, x + 8, y + h - 16, w - 16, 8, 4); ctx.fill();
  ctx.fillStyle = job.remaining <= 0 ? PALETTE.green : '#f4a261';
  rr(ctx, x + 8, y + h - 16, (w - 16) * frac, 8, 4); ctx.fill();
  if (job.remaining <= 0) text(ctx, 'SIAP!', x + w / 2, y + 18, 15, PALETTE.green, 800, 'center');
}

function drawStations(ctx, world, now) {
  const { rice, fry, chop, plate, serve } = LAYOUT;
  // Rice cooker
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, rice.x, rice.y, rice.w, rice.h, 10); ctx.fill();
  ctx.fillStyle = '#9aa5b1';
  rr(ctx, rice.x + 30, rice.y + 34, 120, 66, 12); ctx.fill();
  ctx.fillStyle = '#6b7280';
  rr(ctx, rice.x + 30, rice.y + 26, 120, 18, 9); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.ellipse(rice.x + 90, rice.y + 36, 44, 8, 0, 0, Math.PI * 2); ctx.fill();
  const steam = Math.sin(now * 2) * 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(rice.x + 70 + steam, rice.y + 18); ctx.quadraticCurveTo(rice.x + 76, rice.y + 6, rice.x + 70, rice.y - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rice.x + 108 - steam, rice.y + 18); ctx.quadraticCurveTo(rice.x + 102, rice.y + 6, rice.x + 108, rice.y - 4); ctx.stroke();
  text(ctx, 'RICE COOKER', rice.x + 90, rice.y + 122, 13, '#fff8e7', 800, 'center');
  text(ctx, 'klik: ambil nasi', rice.x + 90, rice.y + 140, 11, '#e8cba0', 600, 'center');

  // Wok
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, fry.x, fry.y, fry.w, fry.h, 10); ctx.fill();
  text(ctx, 'WAJAN — GORENG', fry.x + 14, fry.y + 22, 13, '#fff8e7', 800);
  drawSlot(ctx, fry.x + 14, fry.y + 34, 120, 100, world.fry[0], 'slot 1');
  drawSlot(ctx, fry.x + 146, fry.y + 34, 120, 100, world.fry[1], 'slot 2');

  // Chopping board
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, chop.x, chop.y, chop.w, chop.h, 10); ctx.fill();
  text(ctx, 'TALENAN — POTONG', chop.x + 14, chop.y + 22, 13, '#fff8e7', 800);
  drawSlot(ctx, chop.x + 14, chop.y + 34, 192, 100, world.chop, 'kosong');

  // Assembly plate
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, plate.x, plate.y, plate.w, plate.h, 10); ctx.fill();
  text(ctx, 'PIRING SAJI', plate.x + 14, plate.y + 22, 13, '#fff8e7', 800);
  ctx.fillStyle = '#f7ead0';
  ctx.beginPath(); ctx.ellipse(plate.x + 110, plate.y + 86, 84, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c48f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(plate.x + 110, plate.y + 86, 84, 52, 0, 0, Math.PI * 2); ctx.stroke();
  if (world.plate.length === 0) {
    text(ctx, 'piring kosong', plate.x + 110, plate.y + 90, 13, PALETTE.muted, 600, 'center');
  } else {
    const spots = [[-34, -12], [30, -14], [-6, 14], [44, 16]];
    world.plate.forEach((item, i) => {
      const [dx, dy] = spots[i % spots.length];
      drawIngredientIcon(ctx, item, plate.x + 110 + dx, plate.y + 86 + dy, 20);
    });
  }

  // Serve window
  const match = matchingTicket(world);
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, serve.x, serve.y, serve.w, serve.h, 10); ctx.fill();
  text(ctx, 'JENDELA SAJI', serve.x + 14, serve.y + 22, 13, '#fff8e7', 800);
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
  const { cook, bins, bin, hands } = LAYOUT;
  // Wooden counter the cook stands behind
  ctx.fillStyle = PALETTE.counterTop;
  rr(ctx, cook.x, cook.y + 96, cook.w, 54, 10); ctx.fill();
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(cook.x, cook.y + 96, cook.w, 8);
  // The cook
  const cx = cook.x + 110;
  const cy = cook.y + 60;
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath(); ctx.arc(cx, cy - 34, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  rr(ctx, cx - 30, cy - 62, 60, 22, 11); ctx.fill();
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.arc(cx - 9, cy - 34, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy - 34, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy - 28, 8, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.fillStyle = '#e63946';
  rr(ctx, cx - 34, cy - 6, 68, 56, 12); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  rr(ctx, cx - 20, cy + 2, 40, 34, 8); ctx.fill();
  text(ctx, 'KOKI', cx, cy + 74, 12, '#fff8e7', 800, 'center');
  // Carried items float above the cook's hands
  world.hands.forEach((item, i) => {
    const hx = cx + 62 + i * 52;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.arc(hx, cy - 6, 22, 0, Math.PI * 2); ctx.fill();
    drawIngredientIcon(ctx, item, hx, cy - 6, 15);
  });

  // Ingredient bins
  const raws = ['ayam', 'telur', 'sayur', 'cabai'];
  const keys = ['2', '3', '4', '5'];
  raws.forEach((id, i) => {
    const x = bins.x + i * (bin.w + bin.gap);
    const def = INGREDIENTS[id];
    ctx.fillStyle = PALETTE.counter;
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
  text(ctx, 'Klik bahan → klik stasiun → klik piring → SAJIKAN.  [1] nasi  [Spasi] sajikan  [P] jeda', LAYOUT.help.x, LAYOUT.help.y + 22, 14, '#3d2b1f', 600);
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

/** Draw one frame of the game. `screen` is title, play or over; `now` drives animation. */
export function draw(ctx, world, screen, now, best) {
  drawBackground(ctx);
  drawBoard(ctx, world, now);
  drawStations(ctx, world, now);
  drawCookAndBins(ctx, world, now);
  drawHud(ctx, world);
  drawFlashes(ctx, world);
  drawBanner(ctx, world);
  if (screen === SCREEN_TITLE) drawTitle(ctx, world, best);
  if (screen === SCREEN_OVER) drawGameOver(ctx, world, best);
}
