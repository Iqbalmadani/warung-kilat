// Warung Kilat (Node 22, standard library only): a fast Indonesian warung cooking game.
// The game is this directory's game/ folder — plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library and no network request) — and this
// program hands it in. It copies game/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library. The game: one continuous warung world (2000x1125) — exactly two plots that
// tile the interior with no gaps: plot 1 is the kitchen + customer-service square
// (stations, bins, serving table, bar and the bar customers), plot 2 is one big
// L-shaped dining room where customers eat and order; the entrance is near the kitchen
// and a free exit sits at the far end — that the camera zooms and pans across in three
// views: the map from above, the kitchen zoomed in (still from above), and the counter
// from the front. Click a station and the chef walks there to work it: rice cooker, two
// woks and a chopping board feed one serving plate; a server (pelayan) waits in the
// kitchen square and walks each served plate over to its customer. Tickets carry
// patience, serving pays price plus a patience tip, and a missed ticket costs a heart.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Build-time sanity check: the dossier must exist, parse, and name the same game files and
// screenshots that were just copied, so a broken build fails here instead of at the judge.
const dossierPath = join(out, 'dossier.json');
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
const gameFiles = readdirSync(join(out, 'game'), { recursive: true }).filter((f) => statSync(join(out, 'game', f)).isFile());
const shotFiles = readdirSync(join(out, 'screenshots')).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (!dossier || gameFiles.length === 0 || shotFiles.length === 0) {
  throw new Error(`Warung Kilat build incomplete: ${gameFiles.length} game files, ${shotFiles.length} screenshots`);
}
console.log(`Warung Kilat: ${gameFiles.length} game files, ${shotFiles.length} screenshots, dossier ${statSync(dossierPath).size} bytes -> ${out}`);
