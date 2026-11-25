// Warung Kilat: the game loop, the screens, and the screenshot scenes behind ?shot=.
import { FIELD, STEP, BEST_KEY } from './config.js';
import { createWorld, resetWorld, stepWorld, EVENT_OVER } from './world.js';
import { draw, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import { handleClick, handleKey } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const world = createWorld(seed);
let screen = SCREEN_TITLE;
let paused = false;
let best = 0;
try {
  best = Number(window.localStorage.getItem(BEST_KEY) || '0') || 0;
} catch {
  best = 0;
}

function saveBest() {
  if (world.coins <= best) return;
  best = world.coins;
  try {
    window.localStorage.setItem(BEST_KEY, String(best));
  } catch {
    /* best score is a nicety, not a requirement */
  }
}

function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = Math.round(FIELD.width * scale);
  canvas.height = Math.round(FIELD.height * scale);
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}

function toField(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
    y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
  };
}

function announce() {
  if (!statusLine) return;
  statusLine.textContent = `Warung Kilat, hari ${world.day}, ${world.coins} koin, ${world.served} pesanan disajikan, ${world.hearts} hati.`;
}

function startGame() {
  resetWorld(world, seed);
  screen = SCREEN_PLAY;
  paused = false;
  announce();
}

canvas.addEventListener('click', (event) => {
  if (screen === SCREEN_TITLE) {
    startGame();
    return;
  }
  if (screen === SCREEN_OVER) return;
  if (paused) return;
  const at = toField(event);
  handleClick(world, at.x, at.y);
  announce();
});

window.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'Enter') event.preventDefault();
  const result = handleKey(world, event.key, screen);
  if (result === 'start') {
    if (screen === SCREEN_TITLE) startGame();
    else if (screen === SCREEN_OVER) startGame();
  } else if (result === 'pause') {
    paused = !paused;
  } else if (result === 'restart') {
    startGame();
  }
  announce();
});

window.addEventListener('resize', resize);
resize();

if (shotName) {
  // A screenshot scene: stage the world, draw one frame, and say so.
  screen = stageShot(shotName, world);
  ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  draw(ctx, world, screen, 2.0, best);
  document.body.dataset.ready = '1';
  document.title = `shot:${shotName}`;
} else {
  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!paused && screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        const events = stepWorld(world, STEP);
        accumulator -= STEP;
        if (events & EVENT_OVER) {
          screen = SCREEN_OVER;
          saveBest();
          announce();
          break;
        }
      }
    }
    ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
    draw(ctx, world, screen, now / 1000, best);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
