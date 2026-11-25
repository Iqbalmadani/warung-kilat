// Everything the player sees: the warung world from above, the front counter
// view, the HUD and the overlays. All art is drawn in code, no image files.
// The world layer is drawn through the camera transform; the front view, the
// HUD and the overlays are drawn in screen space.
import {
  FIELD, FONT, PALETTE, NAV_TABS,
  INGREDIENTS, RECIPES, CUSTOMER_STYLES, STATIONS, dishKey,
  BAR_SLOTS_X, FRONT_SLOTS_X, MAP_ZONES, PLOT_SERVICE, PLOT_DINING,
} from './config.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER,
  cameraNow, frontAlpha, kitchenAmount, smooth,
} from './world.js';

export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER };

/** The hovered thing under the mouse (set by main.js each frame), for highlights. */
let hover = null;
export function setHover(value) {
  hover = value;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function circle(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}

function ellipse(ctx, x, y, rx, ry, fill, rot, stroke, lw) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.font = `${weight || 700} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** Text with a dark outline, centred — for labels that sit on the floor. */
function outlinedText(ctx, s, x, y, size, color, outline, weight, align, lw) {
  ctx.font = `${weight || 800} ${size}px ${FONT}`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw || 6;
  ctx.strokeStyle = outline;
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function fillRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function checkerFloor(ctx, x, y, w, h, s, c1, c2) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let j = 0; j * s < h; j += 1) {
    for (let i = 0; i * s < w; i += 1) {
      ctx.fillStyle = (i + j) % 2 ? c2 : c1;
      ctx.fillRect(x + i * s, y + j * s, s, s);
    }
  }
  ctx.restore();
}

/** Warm wood planks over a rect — the dining L's floor. */
function woodFloor(ctx, x, y, w, h) {
  ctx.fillStyle = '#C89A6B';
  ctx.fillRect(x, y, w, h);
  const rows = Math.ceil(h / 40);
  for (let j = 0; j < rows; j += 1) {
    const py = y + j * 40;
    const ph = Math.min(40, y + h - py);
    ctx.fillStyle = j % 2 ? 'rgba(255,230,190,.07)' : 'rgba(60,30,10,.06)';
    ctx.fillRect(x, py, w, ph);
    ctx.fillStyle = 'rgba(70,40,15,.28)';
    ctx.fillRect(x, py, w, 2);
    for (let px = x + ((j * 173) % 260); px < x + w; px += 260) ctx.fillRect(px, py, 2, ph);
  }
}

/** A door on the bottom edge: frame, panel, and a sign above it. */
function drawDoor(ctx, x, label) {
  fillRect(ctx, x, 1056, 100, 52, '#4b2f1c');
  fillRect(ctx, x, 1060, 100, 48, '#5a6066');
  rr(ctx, x + 5, 1030, 90, 26, 5);
  ctx.fillStyle = '#8A4A3A';
  ctx.fill();
  text(ctx, label, x + 50, 1043, 13, '#ffe9c8', 900, 'center');
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function easeOut(t) {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

/** One ingredient or cooked item as a small picture, centred at (x, y). */
export function drawItem(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (id === 'nasi') {
    ellipse(ctx, 0, r * 0.12, r * 0.98, r * 0.78, '#d9cfb6');
    ellipse(ctx, 0, 0, r * 0.98, r * 0.78, '#fffdf5', 0, '#e0d6bd', 1.5);
    [[-0.45, -0.2], [0.05, -0.4], [0.45, -0.05], [-0.12, 0.08], [0.28, 0.38], [-0.5, 0.28], [0, 0.5]].forEach((p) => {
      ellipse(ctx, p[0] * r, p[1] * r, r * 0.13, r * 0.07, '#e6dcc5', p[0] * 2);
    });
  } else if (id === 'ayam' || id === 'ayamG') {
    const raw = id === 'ayam';
    ctx.rotate(-0.55);
    ctx.strokeStyle = '#f4ecdc';
    ctx.lineWidth = r * 0.3;
    ctx.beginPath(); ctx.moveTo(-r * 0.1, r * 0.35); ctx.lineTo(-r * 0.95, r * 0.9); ctx.stroke();
    circle(ctx, -r, r * 0.8, r * 0.22, '#f4ecdc');
    circle(ctx, -r * 0.8, r * 1.02, r * 0.2, '#f4ecdc');
    ellipse(ctx, r * 0.2, -r * 0.05, r * 0.85, r * 0.62, raw ? '#E8A89B' : '#b4672a', 0, raw ? '#d98a7d' : '#85461a', 1.6);
    ellipse(ctx, r * 0.05, -r * 0.28, r * 0.48, r * 0.2, raw ? '#f9cbc1' : '#d9953f', -0.25);
    if (!raw) {
      [[0.35, 0.12], [-0.15, 0.05], [0.55, -0.15], [0.1, 0.3]].forEach((p) => {
        circle(ctx, p[0] * r, p[1] * r, r * 0.07, '#7a3f17');
      });
    }
  } else if (id === 'telur') {
    ellipse(ctx, 0, 0, r * 0.68, r * 0.88, '#fff8ee', 0, '#e2d3b9', 1.6);
    ellipse(ctx, -r * 0.22, -r * 0.32, r * 0.14, r * 0.26, 'rgba(255,255,255,.9)', 0.4);
  } else if (id === 'telurD') {
    ellipse(ctx, 0, r * 0.1, r, r * 0.72, '#C99A2E');
    ellipse(ctx, 0, 0, r, r * 0.72, '#E9C44A', 0, '#C99A2E', 1.6);
    ellipse(ctx, -r * 0.15, -r * 0.2, r * 0.6, r * 0.26, '#ffe795', -0.2);
    ctx.strokeStyle = '#C99A2E';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 0.1); ctx.quadraticCurveTo(0, -r * 0.35, r * 0.7, r * 0.1); ctx.stroke();
  } else if (id === 'sayur') {
    ellipse(ctx, -r * 0.42, r * 0.05, r * 0.5, r * 0.82, '#6FA96B', 0.5, '#2c7a34', 1.4);
    ellipse(ctx, r * 0.42, r * 0.05, r * 0.5, r * 0.82, '#4caf50', -0.5, '#2c7a34', 1.4);
    ellipse(ctx, 0, -r * 0.1, r * 0.5, r * 0.88, '#5cc05f', 0, '#2c7a34', 1.4);
    ctx.strokeStyle = '#2c7a34';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, r * 0.6); ctx.lineTo(0, -r * 0.6); ctx.stroke();
  } else if (id === 'sayurC') {
    [[-0.5, -0.35, 0.3], [0.2, -0.5, -0.5], [0.55, -0.1, 0.8], [-0.2, -0.05, -0.2], [-0.6, 0.3, 0.9], [0.1, 0.35, 0.4], [0.5, 0.5, -0.7], [-0.1, 0.62, 0.1]].forEach((p) => {
      ctx.save();
      ctx.translate(p[0] * r, p[1] * r);
      ctx.rotate(p[2]);
      rr(ctx, -r * 0.3, -r * 0.14, r * 0.6, r * 0.28, r * 0.1);
      ctx.fillStyle = '#63c261';
      ctx.fill();
      ctx.strokeStyle = '#2c7a34';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
  } else if (id === 'cabai') {
    ctx.strokeStyle = '#8f1d22';
    ctx.lineWidth = r * 0.55;
    ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.55); ctx.quadraticCurveTo(-r * 0.1, -r * 0.9, r * 0.75, -r * 0.25); ctx.stroke();
    ctx.strokeStyle = '#e0403f';
    ctx.lineWidth = r * 0.4;
    ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.55); ctx.quadraticCurveTo(-r * 0.1, -r * 0.9, r * 0.75, -r * 0.25); ctx.stroke();
    circle(ctx, r * 0.8, -r * 0.28, r * 0.17, '#6FA96B');
  } else if (id === 'sambal') {
    ellipse(ctx, 0, r * 0.1, r * 0.9, r * 0.66, '#7e141c');
    ellipse(ctx, 0, 0, r * 0.9, r * 0.66, '#A63A3A', 0, '#8a1019', 1.4);
    ellipse(ctx, -r * 0.2, -r * 0.2, r * 0.45, r * 0.2, '#d6454f', -0.2);
    [[-0.4, 0.05], [0.2, -0.25], [0.4, 0.2], [-0.1, 0.28], [0.05, -0.02]].forEach((p) => {
      circle(ctx, p[0] * r, p[1] * r, r * 0.08, '#f5c542');
    });
  }
  ctx.restore();
}

/** The items on a plate, arranged by how many there are. */
function drawPlateItems(ctx, list, cx, cy, r, sx, sy) {
  const spots = {
    1: [[0, 0]],
    2: [[-0.42, -0.1], [0.42, 0.1]],
    3: [[0, -0.45], [-0.45, 0.3], [0.45, 0.3]],
    4: [[-0.42, -0.36], [0.42, -0.36], [-0.42, 0.38], [0.42, 0.38]],
  }[list.length] || [];
  list.forEach((id, i) => {
    drawItem(ctx, id, cx + spots[i][0] * r * (sx || 1), cy + spots[i][1] * r * (sy || 1), r * (list.length > 2 ? 0.38 : 0.46));
  });
}

/** A progress ring that fills clockwise as `frac` goes 0..1. */
function ring(ctx, x, y, r, frac, color, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 6;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/* The kitchen stations, seen from above                              */
/* ------------------------------------------------------------------ */

function drawWok(ctx, x, y, wok, now) {
  circle(ctx, x, y, 52, '#3a3f45');
  circle(ctx, x, y, 46, '#23272b');
  rr(ctx, x - 7, y + 38, 14, 50, 6); ctx.fillStyle = '#2b2b2f'; ctx.fill();
  rr(ctx, x - 8, y + 62, 16, 30, 6); ctx.fillStyle = '#9A6E42'; ctx.fill();
  circle(ctx, x, y, 41, '#3b3d44', '#17181b', 3);
  circle(ctx, x, y, 34, '#232428');
  circle(ctx, x - 12, y - 14, 10, 'rgba(255,255,255,.07)');
  if (!wok.item) return;
  const frac = Math.max(0, Math.min(1, wok.t / wok.need));
  const raw = wok.item === 'ayam';
  if (wok.ready) {
    drawItem(ctx, raw ? 'ayamG' : 'telurD', x, y, 24);
  } else {
    drawItem(ctx, wok.item, x, y, 24);
    ctx.globalAlpha = frac;
    drawItem(ctx, raw ? 'ayamG' : 'telurD', x, y, 24);
    ctx.globalAlpha = 1;
    // Steam sparkles rising off the pan.
    for (let k = 0; k < 6; k += 1) {
      const a = now * 2.2 + k * 1.05;
      const rad = 10 + ((now * 26 + k * 9) % 22);
      circle(ctx, x + Math.cos(a) * rad, y + Math.sin(a) * rad, 2.6, 'rgba(255,255,255,.6)');
    }
  }
  ring(ctx, x, y, 48, wok.ready ? 1 : frac, wok.ready ? '#7FB069' : '#D9A45B', 6);
  if (wok.ready) {
    rr(ctx, x - 30, y - 62, 60, 24, 8);
    ctx.fillStyle = '#6FA96B';
    ctx.fill();
    ctx.strokeStyle = '#5F8F5A';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'SIAP!', x, y - 50, 15, '#fff', 900, 'center');
  }
}

function drawKitchenStations(ctx, world, now) {
  // The teal tile strip along the top of the kitchen wall.
  fillRect(ctx, 60, 36, 900, 26, '#7FA8A0');
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let x = 60; x < 960; x += 40) ctx.fillRect(x, 36, 2, 26);
  // The long wooden counter the stations sit on.
  fillRect(ctx, 60, 60, 900, 116, '#B08A5E');
  fillRect(ctx, 60, 60, 900, 6, '#C9A878');
  ctx.fillStyle = 'rgba(70,40,15,.18)';
  for (let x = 60; x < 960; x += 120) ctx.fillRect(x, 60, 2, 116);
  fillRect(ctx, 60, 170, 900, 8, '#6e4524');
  fillRect(ctx, 60, 178, 900, 14, 'rgba(0,0,0,.13)');
  // Rice cooker: a grey box with a round pot, lid and steam.
  rr(ctx, 80, 70, 100, 100, 16);
  ctx.fillStyle = '#cfd5dc';
  ctx.fill();
  ctx.strokeStyle = '#9aa2ab';
  ctx.lineWidth = 3;
  ctx.stroke();
  circle(ctx, 130, 118, 38, '#f6f7f9', '#b6bdc6', 3);
  circle(ctx, 130, 118, 28, null, '#e1e5ea', 2);
  circle(ctx, 130, 118, 6, '#9aa2ab');
  circle(ctx, 168, 156, 5, '#C96A5A');
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let k = 0; k < 2; k += 1) {
    const phase = (now * 0.6 + k * 0.5) % 1;
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath();
    ctx.moveTo(115 + k * 30, 104 - phase * 20);
    ctx.quadraticCurveTo(122 + k * 30, 92 - phase * 20, 115 + k * 30, 80 - phase * 20);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // The stove with its two woks.
  rr(ctx, 235, 72, 240, 100, 10);
  ctx.fillStyle = '#5c636b';
  ctx.fill();
  ctx.strokeStyle = '#3b4046';
  ctx.lineWidth = 3;
  ctx.stroke();
  rr(ctx, 243, 80, 224, 66, 8);
  ctx.fillStyle = '#7b838c';
  ctx.fill();
  [255, 300, 345, 390].forEach((x) => circle(ctx, x + 20, 162, 5, '#22262a'));
  drawWok(ctx, 300, 121, world.woks[0], now);
  drawWok(ctx, 410, 121, world.woks[1], now);
  // The chopping board with its knife block.
  rr(ctx, 515, 76, 150, 84, 12);
  ctx.fillStyle = '#D9BE8A';
  ctx.fill();
  ctx.strokeStyle = '#9A6E42';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,80,40,.25)';
  ctx.lineWidth = 2;
  for (let y = 94; y < 150; y += 14) {
    ctx.beginPath(); ctx.moveTo(526, y); ctx.lineTo(654, y); ctx.stroke();
  }
  rr(ctx, 665, 104, 34, 28, 10);
  ctx.fillStyle = '#B08A5E';
  ctx.fill();
  circle(ctx, 682, 118, 5, '#9A6E42');
  const board = world.board;
  if (board.item) {
    const frac = Math.max(0, Math.min(1, board.t / board.need));
    if (board.ready) {
      drawItem(ctx, board.item === 'sayur' ? 'sayurC' : 'sambal', 590, 118, 30);
    } else {
      drawItem(ctx, board.item, 590, 122, 30);
      // The knife chops while the board is busy.
      const k = Math.sin(now * 16) * 7;
      ctx.save();
      ctx.translate(560 + frac * 60, 102 + k);
      ctx.rotate(0.3);
      rr(ctx, -6, -26, 12, 40, 3);
      ctx.fillStyle = '#cfd5db';
      ctx.fill();
      rr(ctx, -5, 14, 10, 22, 4);
      ctx.fillStyle = '#5a3418';
      ctx.fill();
      ctx.restore();
      rr(ctx, 527, 150, 126, 6, 3);
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fill();
      rr(ctx, 527, 150, 126 * frac, 6, 3);
      ctx.fillStyle = '#D9A45B';
      ctx.fill();
    }
  } else {
    // The knife rests on the board when it is empty.
    ctx.save();
    ctx.translate(540, 148);
    ctx.rotate(-0.5);
    rr(ctx, -4, -22, 9, 34, 3);
    ctx.fillStyle = '#cfd5db';
    ctx.fill();
    rr(ctx, -4, 10, 9, 20, 4);
    ctx.fillStyle = '#5a3418';
    ctx.fill();
    ctx.restore();
  }
  // The trash can.
  circle(ctx, 790, 118, 40, '#5f666e', '#2f3338', 3);
  circle(ctx, 790, 118, 31, '#7b838c');
  rr(ctx, 776, 112, 28, 11, 5);
  ctx.fillStyle = '#2f3338';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.2)';
  ctx.lineWidth = 2;
  [-1, 1].forEach((k) => {
    ctx.beginPath(); ctx.moveTo(768, 118 + k * 14); ctx.lineTo(812, 118 + k * 14); ctx.stroke();
  });
  // Floor labels under the stations.
  const floorLabel = (s, x, y) => outlinedText(ctx, s, x, y, 15, '#fff6e0', 'rgba(60,35,15,.75)', 800, 'center', 4);
  floorLabel('NASI', 130, 192);
  floorLabel('WAJAN', 355, 192);
  floorLabel('TALENAN', 590, 192);
  floorLabel('BUANG', 790, 192);
  // The ingredient crates along the bottom of the kitchen.
  [['ayam', 150, 'AYAM'], ['telur', 270, 'TELUR'], ['sayur', 390, 'SAYUR'], ['cabai', 510, 'CABAI']].forEach(([id, x, label]) => {
    rr(ctx, x - 46, 459, 92, 92, 9);
    ctx.fillStyle = '#A97E4E';
    ctx.fill();
    ctx.strokeStyle = '#6e4524';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,10,.28)';
    ctx.lineWidth = 2;
    for (let k = 1; k < 4; k += 1) {
      ctx.beginPath(); ctx.moveTo(x - 44, 459 + k * 23); ctx.lineTo(x + 44, 459 + k * 23); ctx.stroke();
    }
    rr(ctx, x - 38, 466, 76, 58, 8);
    ctx.fillStyle = '#8A6242';
    ctx.fill();
    [[-18, -12], [16, -9], [-10, 12], [17, 14], [0, 2]].forEach((p) => {
      drawItem(ctx, id, x + p[0], 489 + p[1], id === 'sayur' ? 17 : 15);
    });
    rr(ctx, x - 34, 529, 68, 19, 6);
    ctx.fillStyle = '#f3e1b8';
    ctx.fill();
    text(ctx, label, x, 539, 13, '#5a3418', 900, 'center');
  });
  // The serving table with the assembly plate and the bell.
  fillRect(ctx, 640, 458, 320, 100, '#B08A5E');
  fillRect(ctx, 640, 458, 320, 6, '#C9A878');
  fillRect(ctx, 640, 552, 320, 8, '#6e4524');
  const match = world.plate.length && world.customers.some(
    (c) => c && !c.leaving && dishKey(RECIPES[c.recipe].items) === dishKey(world.plate),
  );
  circle(ctx, 790, 512, 56, 'rgba(0,0,0,.18)');
  circle(ctx, 790, 508, 54, '#fffdf8', '#d9d2c3', 3);
  circle(ctx, 790, 508, 42, null, '#efe9db', 2);
  drawPlateItems(ctx, world.plate, 790, 508, 40);
  if (match) {
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(now * 6);
    circle(ctx, 790, 508, 60, null, '#7FB069', 6);
    ctx.globalAlpha = 1;
  }
  outlinedText(ctx, 'PIRING', 712, 486, 13, '#fff6e0', 'rgba(60,35,15,.7)', 800, 'center', 4);
  const bounce = match ? Math.sin(now * 8) * 3 : 0;
  circle(ctx, 905, 513, 28, 'rgba(0,0,0,.2)');
  circle(ctx, 905, 508 + bounce, 28, '#D9A45B', '#9a6f12', 3);
  circle(ctx, 905, 505 + bounce, 19, '#f6cd5a');
  circle(ctx, 900, 498 + bounce, 6, 'rgba(255,255,255,.6)');
  circle(ctx, 905, 478 + bounce, 5, '#9a6f12');
  outlinedText(ctx, 'SAJIKAN', 905, 545, 14, '#ffe9a8', 'rgba(60,35,15,.75)', 900, 'center', 4);
  // The bar between the kitchen and the dining room.
  rr(ctx, 60, 556, 900, 68, 6);
  ctx.fillStyle = '#9A6E42';
  ctx.fill();
  ctx.fillStyle = '#B98F5C';
  ctx.fillRect(60, 556, 900, 8);
  ctx.fillStyle = '#5b3a1d';
  ctx.fillRect(60, 616, 900, 8);
  ctx.fillStyle = 'rgba(60,30,10,.22)';
  for (let x = 60; x < 960; x += 90) ctx.fillRect(x, 564, 2, 52);
}

/* ------------------------------------------------------------------ */
/* The world from above: rooms, tables, customers, the chef            */
/* ------------------------------------------------------------------ */

/** One customer seen from above: shoulders, hands, head by style. */
function drawPerson(ctx, x, y, rot, style, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale || 1, scale || 1);
  ellipse(ctx, 0, 16, 36, 15, 'rgba(0,0,0,.2)');
  ellipse(ctx, 0, 5, 35, 17, style.shirt, 0, 'rgba(0,0,0,.28)', 2);
  circle(ctx, -27, -7, 7.5, style.skin, 'rgba(0,0,0,.15)', 1);
  circle(ctx, 27, -7, 7.5, style.skin, 'rgba(0,0,0,.15)', 1);
  if (style.kind === 'hijab') {
    circle(ctx, 0, -8, 23, style.hair, 'rgba(0,0,0,.25)', 2);
    ellipse(ctx, 0, -17, 11.5, 8, style.skin);
  } else if (style.kind === 'peci') {
    circle(ctx, 0, -8, 20, style.skin, 'rgba(0,0,0,.2)', 2);
    ellipse(ctx, 0, -6, 17, 12.5, '#1d1d20');
    ellipse(ctx, 0, -13, 12, 4, '#34343a');
  } else if (style.kind === 'cap') {
    circle(ctx, 0, -8, 20, style.cap, 'rgba(0,0,0,.25)', 2);
    ellipse(ctx, 0, -24, 14, 7, '#b97d22', 0, 'rgba(0,0,0,.2)', 1);
    circle(ctx, 0, -8, 3, '#b97d22');
  } else {
    circle(ctx, 0, -8, 21, style.hair, 'rgba(0,0,0,.2)', 2);
    ellipse(ctx, 0, -17, 12.5, 9, style.skin);
  }
  ctx.restore();
}

/** The order bubble above a bar customer: dish icons and a patience bar. */
function drawBubble(ctx, c, x, y) {
  const recipe = RECIPES[c.recipe];
  const alpha = Math.max(0, Math.min(1, c.in * 1.5)) * (1 - Math.max(0, Math.min(1, c.out * 2)));
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  rr(ctx, x - 96, y - 42, 192, 84, 14);
  ctx.fillStyle = '#fff6df';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = c.patience < 0.3 ? '#C96A5A' : '#caa56a';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 42); ctx.lineTo(x + 11, y - 42); ctx.lineTo(x, y - 58);
  ctx.closePath();
  ctx.fillStyle = '#fff6df';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 41); ctx.lineTo(x + 9, y - 41); ctx.lineTo(x + 9, y - 44); ctx.lineTo(x - 9, y - 44);
  ctx.fill();
  const n = recipe.items.length;
  recipe.items.forEach((id, i) => {
    drawItem(ctx, id, x + (i - (n - 1) / 2) * 40, y - 8, 18);
  });
  rr(ctx, x - 84, y + 22, 168, 9, 4);
  ctx.fillStyle = '#e8dcc0';
  ctx.fill();
  rr(ctx, x - 84, y + 22, 168 * c.patience, 9, 4);
  ctx.fillStyle = c.patience > 0.5 ? '#7FB069' : c.patience > 0.25 ? '#D9A45B' : '#C96A5A';
  ctx.fill();
  ctx.restore();
}

/** A round dining table with chairs; `seated` holds a style per chair or null. */
function drawTable(ctx, x, y, r, seats, seated) {
  const angles = [-0.6, 0.9, 2.2, 3.7, 5.2].slice(0, seats);
  angles.forEach((a, i) => {
    const cx = x + Math.cos(a) * (r + 20);
    const cy = y + Math.sin(a) * (r + 20);
    circle(ctx, cx, cy, 21, '#8A6242', '#6B4A2E', 2);
    if (seated[i]) {
      drawPerson(ctx, cx, cy, Math.atan2(y - cy, x - cx) + Math.PI / 2, seated[i], 0.78);
    }
  });
  circle(ctx, x, y + 5, r + 3, 'rgba(0,0,0,.18)');
  circle(ctx, x, y, r, '#C89A6B', '#9A6E42', 4);
  circle(ctx, x, y, r - 12, null, 'rgba(255,235,200,.45)', 2);
  circle(ctx, x - 14, y - 8, 13, '#fffdf8', '#d9d2c3', 2);
  circle(ctx, x + 18, y + 12, 8, '#8A6242');
  circle(ctx, x + 18, y + 12, 5, '#3b2414');
}

/** The chef, seen from above: he walks, turns, and carries one item. */
function drawChef(ctx, world) {
  const c = world.chef;
  ctx.save();
  ctx.translate(c.x, c.y);
  ellipse(ctx, 0, 8, 36, 24, 'rgba(0,0,0,.22)');
  ctx.rotate(c.angle + Math.PI / 2);
  ctx.rotate(Math.sin(c.walk) * 0.07);
  const s = Math.sin(c.walk) * 7;
  ellipse(ctx, -10, 16 + s, 8, 5.5, '#3a2a22');
  ellipse(ctx, 10, 16 - s, 8, 5.5, '#3a2a22');
  ellipse(ctx, 0, 5, 31, 19, '#C65D4E', 0, '#9A5247', 2);
  ellipse(ctx, 0, 13, 15, 6, '#fff3e0');
  ellipse(ctx, -27, -8, 8, 13, '#C65D4E', 0.25, '#9A5247', 1.5);
  ellipse(ctx, 27, -8, 8, 13, '#C65D4E', -0.25, '#9A5247', 1.5);
  circle(ctx, -20, -24, 7, '#f0c9a0', 'rgba(0,0,0,.2)', 1);
  circle(ctx, 20, -24, 7, '#f0c9a0', 'rgba(0,0,0,.2)', 1);
  circle(ctx, 0, -3, 16, '#f0c9a0');
  circle(ctx, 0, -6, 22, '#ffffff', '#e3dccb', 2);
  circle(ctx, 0, -6, 14, null, '#ece5d5', 2);
  circle(ctx, -6, -12, 5, 'rgba(255,255,255,.9)');
  ctx.restore();
  if (world.hand) {
    const hx = c.x + Math.cos(c.angle) * 34;
    const hy = c.y + Math.sin(c.angle) * 34;
    circle(ctx, hx, hy + 3, 17, 'rgba(0,0,0,.15)');
    drawItem(ctx, world.hand, hx, hy, 19);
  }
}

/** The server (pelayan): muted teal shirt, white apron, cap — he carries the
 *  plate to the customer who was just served, then walks back to his post. */
function drawServer(ctx, world) {
  const s = world.server;
  ctx.save();
  ctx.translate(s.x, s.y);
  ellipse(ctx, 0, 8, 34, 22, 'rgba(0,0,0,.2)');
  ellipse(ctx, 0, 5, 29, 17, '#5A9A8A', 0, '#3F6E64', 2);
  ellipse(ctx, 0, 13, 14, 6, '#fff6e0');
  ellipse(ctx, -25, -8, 7, 12, '#5A9A8A', 0.25, '#3F6E64', 1.5);
  ellipse(ctx, 25, -8, 7, 12, '#5A9A8A', -0.25, '#3F6E64', 1.5);
  circle(ctx, 0, -3, 15, '#f0c9a0');
  ctx.save();
  ctx.beginPath(); ctx.rect(-22, -26, 44, 18); ctx.clip();
  ellipse(ctx, 0, -8, 18, 14, '#3F6E64');
  ctx.restore();
  rr(ctx, -20, -12, 40, 7, 3);
  ctx.fillStyle = '#3F6E64';
  ctx.fill();
  ctx.restore();
  if (s.carry) {
    circle(ctx, s.x, s.y - 30, 20, '#fffdf8', '#d9d2c3', 2);
    drawItem(ctx, s.carry, s.x, s.y - 30, 12);
  }
}

function drawWorld(ctx, world, now, cam) {
  // The world sits on a dark surround, inside a wooden frame.
  fillRect(ctx, -700, -700, 3400, 2600, '#1d2023');
  fillRect(ctx, 0, 0, 2000, 1125, '#30353a');
  rr(ctx, 14, 22, 1972, 1086, 26);
  ctx.fillStyle = '#4b2f1c';
  ctx.fill();
  // The floors: exactly two plots that tile the interior with no gaps.
  // Plot 1 (kitchen + service) is a soft sage checkerboard; plot 2 (the
  // big dining L) is warm wood planks. The floor change alone marks the
  // rooms — no walls, no dark gaps between them.
  checkerFloor(ctx, PLOT_SERVICE.x, PLOT_SERVICE.y, PLOT_SERVICE.w, PLOT_SERVICE.h, 40, '#DCE8D0', '#C9D9B8');
  PLOT_DINING.forEach((r) => woodFloor(ctx, r.x, r.y, r.w, r.h));
  // The top trim, and the two doors on the bottom edge: MASUK near the
  // kitchen (left), KELUAR at the far end (right). The strip along the
  // bottom stays clear of tables so both doors are free.
  fillRect(ctx, 60, 30, 1880, 30, '#3f2716');
  drawDoor(ctx, 180, 'MASUK');
  drawDoor(ctx, 1720, 'KELUAR');
  // The dining tables, some with customers already seated.
  const S = CUSTOMER_STYLES;
  drawTable(ctx, 1150, 200, 62, 4, [S[1], null, S[4], null]);
  drawTable(ctx, 1440, 360, 62, 4, [null, S[0], null, S[3]]);
  drawTable(ctx, 1720, 190, 62, 3, [S[5], null, null]);
  drawTable(ctx, 1770, 440, 56, 2, [null, S[2]]);
  [[340, 880], [640, 940], [940, 890], [1240, 950], [1540, 900], [1800, 880]].forEach((p, i) => {
    drawTable(ctx, p[0], p[1], 64, 4, [i % 2 ? S[(i + 1) % 6] : null, null, i % 3 === 0 ? S[(i + 3) % 6] : null, null]);
  });
  // Potted plants in the corners.
  [[1930, 70], [1010, 550], [80, 1040], [1920, 1040]].forEach((p) => {
    circle(ctx, p[0], p[1], 26, '#5F8F5A', '#1d5226', 3);
    circle(ctx, p[0] - 8, p[1] - 8, 13, '#7FAE7F');
    circle(ctx, p[0] + 9, p[1] + 6, 11, '#6FA96B');
  });
  drawKitchenStations(ctx, world, now);
  // The bar customers, sliding in and out, with their order bubbles.
  world.customers.forEach((c) => {
    if (!c) return;
    const x = BAR_SLOTS_X[c.slot];
    const y = 676 + (1 - easeOut(c.in)) * 130 + easeOut(c.out) * 160;
    const alpha = Math.max(0, Math.min(1, c.in * 1.4)) * (1 - Math.max(0, Math.min(1, c.out)));
    ctx.save();
    ctx.globalAlpha = alpha;
    drawPerson(ctx, x, y, 0, c.style, 1.3);
    if (c.leaving === 'happy') {
      outlinedText(ctx, '♥', x + 34, y - 28, 28, '#D97B8A', '#fff', 900, 'center', 4);
    }
    ctx.restore();
    if (!c.leaving) drawBubble(ctx, c, x, y + 88);
  });
  drawChef(ctx, world);
  drawServer(ctx, world);
  // Coins popping off a served order.
  world.pops.forEach((p) => {
    ctx.globalAlpha = 1 - p.t / 1.2;
    outlinedText(ctx, p.text, p.wx, p.wy - p.t * 70, 38, p.color, '#5a3418', 900, 'center', 7);
    ctx.globalAlpha = 1;
  });
  // On the map, the room names and the chef's marker; hovering a zone lights it.
  const hubAmount = 1 - smooth((cam.z - 0.56) / 0.35);
  if (hubAmount > 0.02) {
    ctx.save();
    ctx.globalAlpha = hubAmount;
    outlinedText(ctx, 'DAPUR', 510, 345, 110, 'rgba(110,70,30,.30)', 'rgba(255,255,255,0)', 900, 'center', 0);
    outlinedText(ctx, 'RUANG MAKAN', 1470, 290, 84, 'rgba(255,235,200,.30)', 'rgba(0,0,0,0)', 900, 'center', 0);
    outlinedText(ctx, 'KONTER', 510, 590, 40, '#ffe9c0', 'rgba(60,35,15,.8)', 900, 'center', 6);
    const chef = world.chef;
    ctx.beginPath();
    ctx.moveTo(chef.x, chef.y - 34);
    ctx.lineTo(chef.x - 14, chef.y - 58);
    ctx.lineTo(chef.x + 14, chef.y - 58);
    ctx.closePath();
    ctx.fillStyle = '#ffd36b';
    ctx.fill();
    ctx.strokeStyle = '#5a3418';
    ctx.lineWidth = 3;
    ctx.stroke();
    outlinedText(ctx, 'KOKI', chef.x, chef.y - 76, 26, '#ffd36b', '#5a3418', 900, 'center', 6);
    if (hover && hover.kind === 'zone' && world.transition >= 1) {
      const z = hover.view === 'kitchen' ? [60, 60, 900, 500] : [60, 556, 900, 270];
      const pulse = 0.7 + 0.3 * Math.sin(now * 6);
      rr(ctx, z[0], z[1], z[2], z[3], 12);
      ctx.fillStyle = 'rgba(255,230,150,.16)';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = `rgba(255,200,70,${pulse})`;
      ctx.stroke();
      outlinedText(
        ctx,
        hover.view === 'kitchen' ? 'KLIK → MASAK' : 'KLIK → LAYANI PELANGGAN',
        z[0] + z[2] / 2,
        hover.view === 'kitchen' ? z[1] + z[3] / 2 + 80 : z[1] + z[3] + 18,
        34, '#fff', '#5a3418', 900, 'center', 8,
      );
    }
    ctx.restore();
  }
  // Hovering a station in the kitchen view outlines it.
  if (hover && hover.kind === 'station' && world.view === 'kitchen' && world.transition >= 1) {
    const station = STATIONS.find((s) => s.id === hover.id);
    if (station) {
      const s = station.shape;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 5;
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      if (s[0] === 'c') {
        ctx.beginPath(); ctx.arc(s[1], s[2], s[3] + 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        rr(ctx, s[1] - 5, s[2] - 5, s[3] + 10, s[4] + 10, 12); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }
}

/* ------------------------------------------------------------------ */
/* The front view: customers with faces behind the counter             */
/* ------------------------------------------------------------------ */

/** One customer in the front view: face, mood, shirt, order bubble. */
function drawFrontCustomer(ctx, c, x, now) {
  const style = c.style;
  const baseY = 546;
  const bob = Math.sin(now * 2 + c.slot) * 2;
  const slide = (1 - easeOut(c.in)) * 120 + easeOut(c.out) * 100;
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * Math.max(0, Math.min(1, c.in * 1.5)) * (1 - Math.max(0, Math.min(1, c.out)));
  ctx.save();
  ctx.translate(0, bob + slide);
  // Shirt.
  ctx.beginPath();
  ctx.moveTo(x - 98, baseY + 6);
  ctx.quadraticCurveTo(x - 104, baseY - 74, x - 42, baseY - 92);
  ctx.lineTo(x + 42, baseY - 92);
  ctx.quadraticCurveTo(x + 104, baseY - 74, x + 98, baseY + 6);
  ctx.closePath();
  ctx.fillStyle = style.shirt;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Head and hair by style.
  if (style.kind === 'hijab') {
    ellipse(ctx, x, baseY - 112, 76, 50, style.hair, 0, 'rgba(0,0,0,.2)', 3);
    ellipse(ctx, x, baseY - 158, 64, 74, style.hair, 0, 'rgba(0,0,0,.2)', 3);
    ellipse(ctx, x, baseY - 152, 45, 54, style.skin);
  } else {
    rr(ctx, x - 17, baseY - 118, 34, 34, 8);
    ctx.fillStyle = style.skin;
    ctx.fill();
    ellipse(ctx, x - 49, baseY - 148, 9, 13, style.skin);
    ellipse(ctx, x + 49, baseY - 148, 9, 13, style.skin);
    ellipse(ctx, x, baseY - 152, 49, 55, style.skin, 0, 'rgba(0,0,0,.15)', 2);
  }
  if (style.kind === 'hair') {
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 70, baseY - 240, 140, 86); ctx.clip();
    ellipse(ctx, x, baseY - 170, 53, 48, style.hair);
    ctx.restore();
    ellipse(ctx, x - 48, baseY - 160, 7, 18, style.hair);
    ellipse(ctx, x + 48, baseY - 160, 7, 18, style.hair);
  }
  if (style.kind === 'peci') {
    rr(ctx, x - 46, baseY - 222, 92, 44, 10);
    ctx.fillStyle = '#1b1b1e';
    ctx.fill();
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(x - 46, baseY - 186, 92, 5);
  }
  if (style.kind === 'cap') {
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 70, baseY - 240, 140, 66); ctx.clip();
    ellipse(ctx, x, baseY - 172, 53, 46, style.cap);
    ctx.restore();
    rr(ctx, x - 60, baseY - 182, 120, 15, 7);
    ctx.fillStyle = '#b97d22';
    ctx.fill();
  }
  // Mood: happy, content, worried, angry — eyes, brows, mouth.
  const mood = c.leaving === 'happy' ? 2 : c.leaving === 'angry' ? -2 : c.patience > 0.5 ? 1 : c.patience > 0.25 ? 0 : -1;
  [-1, 1].forEach((k) => {
    ellipse(ctx, x + k * 19, baseY - 150, 6.5, 8.5, '#2a1a12');
    circle(ctx, x + k * 19 + 2, baseY - 153, 2.2, '#fff');
    ctx.strokeStyle = '#2a1a12';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const tilt = mood < 0 ? -k * 7 : mood === 2 ? -3 : 0;
    ctx.moveTo(x + k * 30, baseY - 167 + (mood < 0 ? -tilt : 0));
    ctx.lineTo(x + k * 9, baseY - 167 + tilt);
    ctx.stroke();
    circle(ctx, x + k * 31, baseY - 134, 8, 'rgba(240,120,110,.35)');
  });
  ctx.strokeStyle = '#7a2a20';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood >= 1) ctx.arc(x, baseY - 135, 17, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (mood === 0) { ctx.moveTo(x - 12, baseY - 122); ctx.lineTo(x + 12, baseY - 122); }
  else ctx.arc(x, baseY - 106, 17, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
  if (mood === 2) {
    ellipse(ctx, x, baseY - 128, 13, 7, '#7a2a20');
    ellipse(ctx, x, baseY - 125, 8, 3.5, '#e86a6a');
  }
  ctx.restore();
  // The order bubble above the customer.
  if (!c.leaving) {
    const recipe = RECIPES[c.recipe];
    rr(ctx, x - 116, 190, 232, 100, 16);
    ctx.fillStyle = '#fff6df';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = c.patience < 0.3 ? '#C96A5A' : '#caa56a';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 13, 289); ctx.lineTo(x + 13, 289); ctx.lineTo(x, 310);
    ctx.closePath();
    ctx.fillStyle = '#fff6df';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff6df';
    ctx.fillRect(x - 11, 286, 22, 5);
    text(ctx, recipe.name, x - 104, 210, 17, '#2b1c12', 900);
    text(ctx, `$${recipe.price}`, x + 104, 210, 17, '#9C7A33', 900, 'right');
    const n = recipe.items.length;
    recipe.items.forEach((id, i) => {
      drawItem(ctx, id, x + (i - (n - 1) / 2) * 52, 246, 22);
    });
    rr(ctx, x - 104, 272, 208, 9, 4);
    ctx.fillStyle = '#e8dcc0';
    ctx.fill();
    rr(ctx, x - 104, 272, 208 * c.patience, 9, 4);
    ctx.fillStyle = c.patience > 0.5 ? '#7FB069' : c.patience > 0.25 ? '#D9A45B' : '#C96A5A';
    ctx.fill();
  }
  ctx.globalAlpha = alpha;
}

function drawFront(ctx, world, now) {
  const W = FIELD.width;
  // The wall, the tile band and the top beam.
  let g = ctx.createLinearGradient(0, 0, 0, 546);
  g.addColorStop(0, '#DEB27C');
  g.addColorStop(1, '#C99A67');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 546);
  ctx.fillStyle = 'rgba(90,50,20,.16)';
  for (let x = 0; x < W; x += 80) ctx.fillRect(x, 0, 3, 546);
  checkerFloor(ctx, 0, 466, W, 80, 40, '#B0603F', '#f1e2c4');
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(0, 466, W, 6);
  ctx.fillStyle = '#5b3a24';
  ctx.fillRect(0, 0, W, 48);
  // The window with its red curtains, looking out on the hills.
  ctx.save();
  ctx.scale(1, 0.68);
  rr(ctx, 36, 78, 182, 184, 8);
  ctx.fillStyle = '#5b3a24';
  ctx.fill();
  g = ctx.createLinearGradient(0, 86, 0, 254);
  g.addColorStop(0, '#8fd0ee');
  g.addColorStop(1, '#e8f6fb');
  rr(ctx, 46, 88, 162, 164, 4);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = '#5b3a24';
  ctx.fillRect(124, 88, 6, 164);
  ctx.fillRect(46, 166, 162, 6);
  ctx.fillStyle = 'rgba(60,110,70,.85)';
  ctx.beginPath();
  ctx.moveTo(46, 252); ctx.lineTo(46, 215); ctx.lineTo(80, 200); ctx.lineTo(110, 222);
  ctx.lineTo(150, 196); ctx.lineTo(208, 224); ctx.lineTo(208, 252);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#C96A5A';
  ctx.fillRect(36, 78, 22, 184);
  ctx.fillRect(196, 78, 22, 184);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let y = 86; y < 260; y += 24) {
    ctx.fillRect(36, y, 22, 10);
    ctx.fillRect(196, y, 22, 10);
  }
  ctx.restore();
  // The hanging sign.
  ctx.strokeStyle = '#2b1c12';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(500, 48); ctx.lineTo(500, 66);
  ctx.moveTo(780, 48); ctx.lineTo(780, 66);
  ctx.stroke();
  rr(ctx, 440, 66, 400, 66, 12);
  ctx.fillStyle = '#2b1c12';
  ctx.fill();
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 4;
  ctx.stroke();
  outlinedText(ctx, 'WARUNG KILAT', 640, 99, 44, '#ffd36b', '#6e4a10', 900, 'center', 2);
  // The menu board.
  rr(ctx, 1050, 52, 200, 130, 10);
  ctx.fillStyle = '#2f3d36';
  ctx.fill();
  ctx.strokeStyle = '#9A6E42';
  ctx.lineWidth = 6;
  ctx.stroke();
  text(ctx, 'MENU', 1150, 70, 15, '#f3e6c4', 900, 'center');
  [['Ayam Goreng', 8], ['Telur Dadar', 6], ['Nasi Sayur', 6], ['Ayam Sambal', 10], ['Komplit', 14]].forEach((m, i) => {
    text(ctx, m[0], 1066, 92 + i * 18, 12.5, '#e9ddbc', 700);
    text(ctx, `$${m[1]}`, 1234, 92 + i * 18, 12.5, '#ffd36b', 800, 'right');
  });
  // The hanging lamps.
  [340, 640, 940].forEach((x) => {
    ctx.strokeStyle = '#3a2616';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x, 128); ctx.stroke();
    const glow = ctx.createRadialGradient(x, 150, 6, x, 150, 120);
    glow.addColorStop(0, 'rgba(255,224,150,.45)');
    glow.addColorStop(1, 'rgba(255,224,150,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 130, 20, 260, 260);
    ctx.beginPath();
    ctx.moveTo(x - 30, 150); ctx.lineTo(x - 12, 126); ctx.lineTo(x + 12, 126); ctx.lineTo(x + 30, 150);
    ctx.closePath();
    ctx.fillStyle = '#D9A45B';
    ctx.fill();
    circle(ctx, x, 152, 8, '#fff3c4');
  });
  // The waiting customers.
  world.customers.forEach((c) => {
    if (c) drawFrontCustomer(ctx, c, FRONT_SLOTS_X[c.slot], now);
  });
  // The counter, seen from the cook's side, with the plate and the bell.
  g = ctx.createLinearGradient(0, 546, 0, 720);
  g.addColorStop(0, '#C89A6B');
  g.addColorStop(1, '#A87F52');
  ctx.fillStyle = g;
  ctx.fillRect(0, 546, W, 174);
  ctx.fillStyle = '#6e4524';
  ctx.fillRect(0, 534, W, 14);
  ctx.fillStyle = '#e0b27a';
  ctx.fillRect(0, 534, W, 3);
  ctx.strokeStyle = 'rgba(80,45,20,.22)';
  ctx.lineWidth = 2;
  for (let i = -9; i <= 9; i += 1) {
    ctx.beginPath(); ctx.moveTo(640 + i * 62, 548); ctx.lineTo(640 + i * 150, 720); ctx.stroke();
  }
  const match = world.plate.length && world.customers.some(
    (c) => c && !c.leaving && dishKey(RECIPES[c.recipe].items) === dishKey(world.plate),
  );
  ellipse(ctx, 640, 632, 160, 46, 'rgba(0,0,0,.2)');
  ellipse(ctx, 640, 622, 152, 44, '#fffdf8', 0, '#d9d2c3', 3);
  ellipse(ctx, 640, 622, 120, 32, null, 0, '#efe9db', 2);
  drawPlateItems(ctx, world.plate, 640, 616, 62, 1.8, 0.62);
  if (match) {
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(now * 6);
    ellipse(ctx, 640, 622, 166, 54, null, 0, '#7FB069', 6);
    ctx.globalAlpha = 1;
  }
  outlinedText(ctx, 'PIRING SAJI', 640, 672, 15, '#fff6e0', 'rgba(60,35,15,.7)', 800, 'center', 4);
  const bounce = match ? Math.sin(now * 8) * 4 : 0;
  ellipse(ctx, 1100, 652, 52, 15, 'rgba(0,0,0,.25)');
  ellipse(ctx, 1100, 640, 48, 13, '#b9821a');
  ctx.beginPath();
  ctx.arc(1100, 636 + bounce, 38, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = '#E9C44A';
  ctx.fill();
  ctx.strokeStyle = '#9a6f12';
  ctx.lineWidth = 3;
  ctx.stroke();
  ellipse(ctx, 1088, 618 + bounce, 8, 13, 'rgba(255,255,255,.55)', 0.4);
  circle(ctx, 1100, 594 + bounce, 7, '#9a6f12');
  outlinedText(ctx, 'SAJIKAN', 1100, 676, 16, '#ffe9a8', 'rgba(60,35,15,.75)', 900, 'center', 4);
  // Coins popping off a served order, in front-view coordinates.
  world.pops.forEach((p) => {
    ctx.globalAlpha = 1 - p.t / 1.2;
    outlinedText(ctx, p.text, p.fx, p.fy - p.t * 70, 46, p.color, '#5a3418', 900, 'center', 8);
    ctx.globalAlpha = 1;
  });
  if (hover && hover.kind === 'customer') {
    const x = FRONT_SLOTS_X[hover.customer.slot];
    rr(ctx, x - 118, 186, 236, 364, 20);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  if (hover && hover.kind === 'bell') {
    rr(ctx, 1040, 572, 120, 118, 16);
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------ */
/* HUD and overlays (screen space)                                     */
/* ------------------------------------------------------------------ */

function drawHUD(ctx, world, now) {
  const W = FIELD.width;
  ctx.fillStyle = 'rgba(34,22,14,.95)';
  ctx.fillRect(0, 0, W, 44);
  text(ctx, 'WARUNG KILAT', 18, 23, 24, '#ffd36b', 900);
  text(ctx, `HARI ${world.level}`, 300, 23, 18, '#f3e6c4', 800);
  circle(ctx, 420, 22, 12, '#ffc83a', '#b78410', 2);
  text(ctx, '$', 420, 23, 14, '#8a5a05', 900, 'center');
  text(ctx, String(world.coins), 440, 23, 22, '#fff', 900);
  for (let i = 0; i < 3; i += 1) {
    text(ctx, '♥', 560 + i * 26, 23, 26, i < world.hearts ? '#D97B8A' : 'rgba(255,255,255,.2)', 900, 'center');
  }
  text(ctx, `Saji: ${world.served}`, 680, 23, 18, '#f3e6c4', 800);
  // The three view tabs, top right; the active view is gold.
  NAV_TABS.forEach((tab) => {
    const active = tab.view === world.view;
    const hovered = hover && hover.kind === 'nav' && hover.view === tab.view;
    rr(ctx, tab.x, tab.y, tab.w, tab.h, 15);
    ctx.fillStyle = active ? '#ffd36b' : hovered ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.1)';
    ctx.fill();
    if (!active) {
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, `${tab.key}  ${tab.label}`, tab.x + tab.w / 2, tab.y + 16, 15, active ? '#3a2410' : '#f3e6c4', 900, 'center');
  });
  // The ticket cards, fading in with the kitchen view.
  const ka = kitchenAmount(world);
  if (ka > 0) {
    ctx.save();
    ctx.globalAlpha = ka;
    let x = 14;
    world.customers.forEach((c) => {
      if (!c || c.leaving) return;
      const recipe = RECIPES[c.recipe];
      ctx.font = `900 15px ${FONT}`;
      const w = Math.max(
        recipe.items.length * 32 + 44,
        ctx.measureText(recipe.name).width + ctx.measureText(`$${recipe.price}`).width + 44,
      );
      rr(ctx, x, 50, w, 58, 10);
      ctx.fillStyle = '#fff6df';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = c.patience < 0.3 ? '#C96A5A' : '#caa56a';
      ctx.stroke();
      text(ctx, recipe.name, x + 10, 66, 15, '#2b1c12', 900);
      text(ctx, `$${recipe.price}`, x + w - 10, 66, 15, '#9C7A33', 900, 'right');
      recipe.items.forEach((id, i) => {
        drawItem(ctx, id, x + 24 + i * 32, 85, 10);
      });
      rr(ctx, x + 10, 98, w - 20, 6, 3);
      ctx.fillStyle = '#e8dcc0';
      ctx.fill();
      rr(ctx, x + 10, 98, (w - 20) * c.patience, 6, 3);
      ctx.fillStyle = c.patience > 0.5 ? '#7FB069' : c.patience > 0.25 ? '#D9A45B' : '#C96A5A';
      ctx.fill();
      x += w + 10;
    });
    // The hand box, top right of the kitchen view.
    rr(ctx, 1066, 52, 200, 38, 10);
    ctx.fillStyle = 'rgba(34,22,14,.9)';
    ctx.fill();
    text(ctx, 'TANGAN', 1080, 71, 12, '#c9a46a', 900);
    if (world.hand) {
      drawItem(ctx, world.hand, 1156, 71, 13);
      text(ctx, INGREDIENTS[world.hand].name, 1176, 71, 14, '#fff', 800);
    } else {
      text(ctx, 'kosong', 1150, 71, 15, 'rgba(255,255,255,.55)', 700);
    }
    ctx.restore();
  }
  // The hint bar at the bottom, with the hint for this view.
  ctx.fillStyle = 'rgba(34,22,14,.62)';
  ctx.fillRect(0, 692, W, 28);
  const hints = {
    hub: 'Klik DAPUR untuk masak  •  klik KONTER untuk layani pelanggan  •  [V] ganti view',
    kitchen: 'Klik bahan → klik wajan / talenan → klik piring → klik lonceng SAJIKAN (atau Spasi)  •  [V] ganti view',
    counter: 'Klik pelanggan untuk menyajikan piring  •  [Spasi] sajikan otomatis  •  [V] ganti view',
  };
  text(ctx, hints[world.view], W / 2, 706, 14, '#f3e6c4', 700, 'center');
  // Toasts: a pill in the middle of the screen.
  if (world.toast) {
    const t = world.toast;
    const alpha = 1 - smooth((t.t - 1.4) / 0.4);
    ctx.font = `900 20px ${FONT}`;
    const w = ctx.measureText(t.text).width + 36;
    const y = world.view === 'kitchen' ? 122 : world.view === 'counter' ? 148 : 60;
    ctx.save();
    ctx.globalAlpha = alpha;
    rr(ctx, W / 2 - w / 2, y, w, 36, 18);
    ctx.fillStyle = t.kind === 'good' ? '#6FA96B' : t.kind === 'bad' ? '#B65A4A' : '#4a3a2a';
    ctx.fill();
    text(ctx, t.text, W / 2, y + 19, 20, '#fff', 900, 'center');
    ctx.restore();
  }
}

function drawOverlays(ctx, world, now) {
  const W = FIELD.width;
  if (world.state === 'title') {
    ctx.fillStyle = 'rgba(24,14,8,.58)';
    ctx.fillRect(0, 44, W, 648);
    outlinedText(ctx, 'WARUNG KILAT', 640, 250, 112, '#ffd36b', '#4a2a0c', 900, 'center', 14);
    outlinedText(ctx, 'Masak cepat, sajikan tepat waktu — sebelum pelanggan kabur!', 640, 332, 28, '#fff6e0', 'rgba(40,22,8,.8)', 700, 'center', 6);
    const pulse = 1 + 0.04 * Math.sin(now * 4);
    ctx.save();
    ctx.translate(640, 452);
    ctx.scale(pulse, pulse);
    rr(ctx, -190, -34, 380, 68, 34);
    ctx.fillStyle = '#ffd36b';
    ctx.fill();
    ctx.strokeStyle = '#4a2a0c';
    ctx.lineWidth = 5;
    ctx.stroke();
    text(ctx, 'MULAI — klik / Spasi', 0, 2, 28, '#3a2410', 900, 'center');
    ctx.restore();
    text(ctx, '3 view: PETA dari atas · DAPUR dari atas · KONTER dari depan   —   ganti pakai tombol di pojok kanan atas atau tombol V', 640, 540, 17, '#f3e6c4', 700, 'center');
  }
  if (world.state === 'over') {
    ctx.fillStyle = 'rgba(24,14,8,.7)';
    ctx.fillRect(0, 44, W, 648);
    outlinedText(ctx, 'WARUNG TUTUP', 640, 270, 84, '#ff8a7a', '#4a1208', 900, 'center', 12);
    outlinedText(ctx, `Pelanggan habis kesabaran. Koin $${world.coins}  •  Saji ${world.served}  •  Hari ${world.level}`, 640, 360, 28, '#fff6e0', 'rgba(40,22,8,.8)', 700, 'center', 6);
    rr(ctx, 450, 418, 380, 64, 32);
    ctx.fillStyle = '#ffd36b';
    ctx.fill();
    text(ctx, 'COBA LAGI — klik / R', 640, 451, 26, '#3a2410', 900, 'center');
  }
}

/* ------------------------------------------------------------------ */
/* The frame: camera transform, crossfade, HUD, overlays               */
/* ------------------------------------------------------------------ */

/** Draw one frame. `screen` is title, play or over; `now` drives animation. */
export function draw(ctx, world, screen, now, best) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#16120f';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const cam = cameraNow(world);
  const fa = frontAlpha(world);
  if (fa < 1) {
    // The world through the camera: zoom and pan, no fade.
    ctx.save();
    ctx.translate(FIELD.width / 2, FIELD.height / 2);
    ctx.scale(cam.z, cam.z);
    ctx.translate(-cam.x, -cam.y);
    drawWorld(ctx, world, now, cam);
    ctx.restore();
  }
  if (fa > 0) {
    // The front view, fading in as the camera settles at the counter.
    ctx.save();
    ctx.globalAlpha = fa;
    const s = 1 + (1 - fa) * 0.05;
    ctx.translate(FIELD.width / 2, FIELD.height / 2);
    ctx.scale(s, s);
    ctx.translate(-FIELD.width / 2, -FIELD.height / 2);
    drawFront(ctx, world, now);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  drawHUD(ctx, world, now);
  drawOverlays(ctx, world, now);
}
