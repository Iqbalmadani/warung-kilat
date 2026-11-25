// The screenshot scenes behind ?shot=cover|rush|serve|title. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a script of
// timed clicks, so the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { STEP, DAY_SECONDS } from './config.js';
import { resetWorld, stepWorld, takeRice, takeRaw, placeInStation, collectFromStation, addToPlate } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';

/** Put a ticket with a fixed patience on the board. */
function stageTicket(world, dishId, patienceFraction) {
  const patience = 48 * patienceFraction;
  world.tickets.push({ id: world.nextTicketId, dishId, patience, maxPatience: 48 });
  world.nextTicketId += 1;
}

/** Run the world forward, firing each scripted click when its second arrives. */
function runScript(world, seconds, script) {
  let fired = 0;
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const t = world.time;
    while (fired < script.length && script[fired].at <= t) {
      script[fired].fn(world);
      fired += 1;
    }
    stepWorld(world, STEP);
  }
  while (fired < script.length) {
    script[fired].fn(world);
    fired += 1;
  }
}

function freezeSpawns(world) {
  world.spawnIn = 9999;
  world.dayTime = 74;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * cover: the hub — the whole warung from directly above, orders on the board
 *   of tables, a dish being assembled, the wok and the chopping board at work.
 * rush: the service rush — four tickets, two nearly out of patience, both wok slots
 *   busy, a plate mid-assembly.
 * front: the front view — customers waiting behind the counter, a finished plate
 *   matching the oldest ticket, the serve button lit.
 * title: the title screen over a kitchen already at work.
 */
export function stageShot(name, world) {
  resetWorld(world, 1);
  if (name === 'rush') {
    world.day = 2;
    stageTicket(world, 'nasi-komplit', 0.22);
    stageTicket(world, 'nasi-sambal', 0.3);
    stageTicket(world, 'nasi-ayam', 0.55);
    stageTicket(world, 'nasi-telur', 0.8);
    freezeSpawns(world);
    runScript(world, 9, [
      { at: 0.0, fn: (w) => takeRice(w) },
      { at: 0.2, fn: (w) => addToPlate(w) },
      { at: 0.5, fn: (w) => takeRaw(w, 'ayam') },
      { at: 0.8, fn: (w) => placeInStation(w, 'fry') },
      { at: 1.0, fn: (w) => takeRaw(w, 'telur') },
      { at: 1.3, fn: (w) => placeInStation(w, 'fry') },
      { at: 1.6, fn: (w) => takeRaw(w, 'sayur') },
      { at: 1.9, fn: (w) => placeInStation(w, 'chop') },
      { at: 4.6, fn: (w) => collectFromStation(w, 'chop', 0) },
      { at: 4.8, fn: (w) => addToPlate(w) },
      { at: 5.0, fn: (w) => takeRaw(w, 'ayam') },
      { at: 5.3, fn: (w) => placeInStation(w, 'fry') },
    ]);
    world.view = 'cook';
    return SCREEN_PLAY;
  }
  if (name === 'front') {
    // The front view: customers waiting behind the counter, a finished plate
    // matching the oldest ticket, the serve button lit.
    stageTicket(world, 'nasi-sambal', 0.55);
    stageTicket(world, 'nasi-ayam', 0.75);
    stageTicket(world, 'nasi-telur', 0.85);
    freezeSpawns(world);
    runScript(world, 7, [
      { at: 0.0, fn: (w) => takeRice(w) },
      { at: 0.2, fn: (w) => addToPlate(w) },
      { at: 0.5, fn: (w) => takeRaw(w, 'ayam') },
      { at: 0.8, fn: (w) => placeInStation(w, 'fry') },
      { at: 1.0, fn: (w) => takeRaw(w, 'cabai') },
      { at: 1.3, fn: (w) => placeInStation(w, 'chop') },
      { at: 3.5, fn: (w) => collectFromStation(w, 'chop', 0) },
      { at: 3.7, fn: (w) => addToPlate(w) },
      { at: 5.0, fn: (w) => collectFromStation(w, 'fry', 0) },
      { at: 5.2, fn: (w) => addToPlate(w) },
    ]);
    world.view = 'front';
    return SCREEN_PLAY;
  }
  if (name === 'title') {
    stageTicket(world, 'nasi-ayam', 0.7);
    stageTicket(world, 'nasi-telur', 0.85);
    freezeSpawns(world);
    runScript(world, 6, [
      { at: 0.0, fn: (w) => takeRice(w) },
      { at: 0.2, fn: (w) => addToPlate(w) },
      { at: 0.5, fn: (w) => takeRaw(w, 'ayam') },
      { at: 0.8, fn: (w) => placeInStation(w, 'fry') },
    ]);
    return SCREEN_TITLE;
  }
  // cover: the hub — the whole warung from above, busy mid-play.
  stageTicket(world, 'nasi-sambal', 0.6);
  stageTicket(world, 'nasi-ayam', 0.45);
  stageTicket(world, 'nasi-telur', 0.8);
  freezeSpawns(world);
  runScript(world, 6.5, [
    { at: 0.0, fn: (w) => takeRice(w) },
    { at: 0.2, fn: (w) => addToPlate(w) },
    { at: 0.5, fn: (w) => takeRaw(w, 'ayam') },
    { at: 0.8, fn: (w) => placeInStation(w, 'fry') },
    { at: 1.0, fn: (w) => takeRaw(w, 'cabai') },
    { at: 1.3, fn: (w) => placeInStation(w, 'chop') },
    { at: 3.5, fn: (w) => collectFromStation(w, 'chop', 0) },
    { at: 3.7, fn: (w) => addToPlate(w) },
    { at: 4.0, fn: (w) => takeRaw(w, 'telur') },
    { at: 4.3, fn: (w) => placeInStation(w, 'fry') },
    { at: 5.0, fn: (w) => collectFromStation(w, 'fry', 0) },
    { at: 5.2, fn: (w) => addToPlate(w) },
  ]);
  world.view = 'hub';
  return SCREEN_PLAY;
}

export { DAY_SECONDS };
