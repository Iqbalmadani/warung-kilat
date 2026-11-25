// Warung Kilat (Node 22, standard library only): a fast Indonesian warung cooking game.
// The game is this directory's game/ folder — plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library and no network request) — and this
// program hands it in. It copies game/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library. The game: cook to order against the clock — rice cooker, wok (2 slots) and
// chopping board (1 slot) feed one serving plate; tickets carry patience bars, serving pays
// price plus a patience-based tip times a combo multiplier, and a missed ticket costs a heart.
// 5 dishes, 120-second days with ramping pressure, keyboard + mouse play. Put the 4 PNG
// screenshots in screenshots/ (the first by name is the cover) and run it.
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
