#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let missing = false;
for (const [command, args] of [['node', ['--version']], ['ffmpeg', ['-version']], ['ffprobe', ['-version']]]) {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) { console.error(`${command}: missing from PATH`); missing = true; }
  else console.log((result.stdout || result.stderr).split(/\r?\n/)[0]);
}
const whisper = spawnSync('whisper-cli', ['--help'], { stdio: 'ignore', windowsHide: true });
console.log(whisper.status === 0 ? 'whisper-cli: ok' : 'whisper-cli: not found (needed for npm run transcribe)');
if (Number(process.versions.node.split('.')[0]) < 22) { console.error('Node 22+ required.'); missing = true; }
if (!existsSync(join(root, '.env'))) { copyFileSync(join(root, '.env.example'), join(root, '.env')); console.log('Created local .env. No keys are required; fill only optional services you choose.'); }
else console.log('Existing .env preserved.');
const langArg = process.argv.indexOf('--lang');
if (langArg !== -1) {
  const lang = (process.argv[langArg + 1] || '').trim().toLowerCase();
  if (!/^([a-z]{2}|auto)$/.test(lang)) { console.error('Use a two-letter language code, e.g. --lang uk, ru, en, or auto.'); missing = true; }
  else {
    const envPath = join(root, '.env');
    const text = readFileSync(envPath, 'utf8');
    const next = /^VIDEO_LANGUAGE=.*$/m.test(text) ? text.replace(/^VIDEO_LANGUAGE=.*$/m, `VIDEO_LANGUAGE=${lang}`) : text.replace(/\n?$/, `\nVIDEO_LANGUAGE=${lang}\n`);
    writeFileSync(envPath, next);
    console.log(`Video language: ${lang} (saved in .env as VIDEO_LANGUAGE)`);
  }
}
console.log('Service setup and alternatives: docs/TOOLS-AND-API-KEYS.md');
console.log('Next: npx hyperframes doctor (Chrome diagnostics), then npm run demo.');
process.exitCode = missing ? 1 : 0;
