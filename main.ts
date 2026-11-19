// Leonida Ledger: the hand-in program for the GTA VI trophy guide entry.
//
// The entry itself is plain static files: app/index.html, app/style.css,
// app/app.js and app/data/trophies.json, plus the screenshots in
// screenshots/. Nothing is built and nothing is fetched at run time, so
// this program only has to copy those two folders into /output and ask the
// vendored make.fun library to write the dossier the judge reads.
//
// Node 22, standard library only. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it twice and requires both runs to write identical bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyFolder(name) {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyFolder('app');
copyFolder('screenshots');

// The scorer re-derives this dossier from the same files with its own copy
// of the library, so the options here must stay exactly as the kit sets
// them: at most 4 screenshots of 256 KiB, at most 993 files and 48 MiB in
// app/, and a dossier text cap of 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
