// Comet Shepherd: a best-game-01 entry program (Node 22, standard library only).
//
// The playable game lives in game/ beside this file: plain static files that a
// desktop browser opens offline from game/index.html. This program hands the
// game in. It copies game/ and screenshots/ into the output directory and
// writes dossier.json there with the vendored make.fun library, which is the
// summary the judge reads. Run it locally with:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// In the grader MAKEFUN_OUTPUT_DIR is unset and the output directory is /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const repoShots = join(repoRoot, 'screenshots');
if (existsSync(repoShots)) {
  cpSync(repoShots, shotsDir, { recursive: true });
}

// Caps mirror the gate: the dossier text stays under 160 KiB, at most four
// screenshots of at most 256 KiB each, and game/ stays within its file,
// byte and path-length limits.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
