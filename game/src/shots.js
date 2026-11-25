// The screenshot scenes behind ?shot=cover|rush|front|title. Each one stages the
// demo warung — a busy mid-play moment with the same seed every time — picks a
// view, and returns the screen to draw over it.
import { resetWorld, spawnCustomer, stageDemo, SCREEN_TITLE, SCREEN_PLAY } from './world.js';

/** Settle the camera on a view, with no walk in progress. */
function settle(world, view) {
  world.view = view;
  world.prevView = view;
  world.transition = 1;
}

/**
 * cover: the map — the whole warung from above, customers at the bar, the wok
 *   and the board at work, the plate half assembled.
 * rush: the kitchen zoomed in — four tickets on the cards, two nearly out of
 *   patience, both woks busy, a plate mid-assembly.
 * front: the counter — customers waiting with faces, a finished plate matching
 *   the oldest ticket, the serve bell lit.
 * title: the title screen over the map, mid-play.
 */
export function stageShot(name, world) {
  if (name === 'front') {
    resetWorld(world, 1);
    spawnCustomer(world, 0, 0.55, 'ayamSambal');
    spawnCustomer(world, 1, 0.75, 'ayamGoreng');
    spawnCustomer(world, 2, 0.85, 'telurDadar');
    world.customers.forEach((c) => { if (c) c.in = 1; });
    world.plate = ['nasi', 'ayamG', 'sambal'];
    world.level = 1;
    world.state = 'play';
    settle(world, 'counter');
    return SCREEN_PLAY;
  }
  if (name === 'title') {
    stageDemo(world);
    world.state = 'title';
    settle(world, 'hub');
    return SCREEN_TITLE;
  }
  stageDemo(world);
  if (name === 'rush') {
    settle(world, 'kitchen');
  } else {
    settle(world, 'hub');
  }
  return SCREEN_PLAY;
}
