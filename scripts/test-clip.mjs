#!/usr/bin/env node
// macOS only: make a synthetic test clip in the video's language:
// sentence 1, two seconds of silence, sentence 2. Used by SETUP to test
// transcription and silence cutting without real footage.
//   node scripts/test-clip.mjs <out-dir> [--lang xx] [--text "Sentence one." "Sentence two."]
// Writes <out-dir>/raw.mp4 and prints the expected text.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVideoLanguage, speechFor } from './lib/lang.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const out = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : null;
if (!out) { console.log('Usage: node scripts/test-clip.mjs <out-dir> [--lang xx] [--text "One." "Two."]'); process.exit(1); }
const li = args.indexOf('--lang');
const lang = li !== -1 ? args[li + 1] : (readVideoLanguage(root) || 'en');
const ti = args.indexOf('--text');
const lines = ti !== -1 ? args.slice(ti + 1, ti + 3) : speechFor(lang);
if (!lines || lines.length < 2) { console.error(`No test sentences for "${lang}". Pass two: --text "One." "Two."`); process.exit(1); }
if (process.platform !== 'darwin') { console.error('Synthetic voices need macOS. Record a short clip with a pause instead.'); process.exit(1); }

// Pick a voice for the language: preferred names first, then any voice with that locale.
const preferred = { uk: 'Lesya', ru: 'Milena', en: 'Samantha', de: 'Anna', pl: 'Zosia', es: 'Mónica' };
const list = spawnSync('say', ['-v', '?'], { encoding: 'utf8' }).stdout.split('\n')
  .map((l) => l.match(/^(.+?)\s+([a-z]{2,3})_[A-Za-z0-9]+\s+#/)).filter(Boolean)
  .map((m) => ({ name: m[1].trim(), lang: m[2] }));
const voice = list.find((v) => v.name === preferred[lang]) || list.find((v) => v.lang === lang);
if (!voice) { console.error(`No macOS voice for "${lang}". Add one in System Settings → Accessibility → Spoken Content, or record a clip.`); process.exit(1); }

mkdirSync(out, { recursive: true });
const run = (cmd, a) => { const r = spawnSync(cmd, a, { encoding: 'utf8' }); if (r.status !== 0) { console.error(`${cmd} failed:\n${r.stderr}`); process.exit(1); } };
run('say', ['-v', voice.name, '-o', join(out, 'a.aiff'), lines[0]]);
run('say', ['-v', voice.name, '-o', join(out, 'b.aiff'), lines[1]]);
run('ffmpeg', ['-v', 'error', '-y', '-i', join(out, 'a.aiff'), '-f', 'lavfi', '-t', '2', '-i', 'anullsrc=r=22050:cl=mono', '-i', join(out, 'b.aiff'),
  '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[a]', '-map', '[a]', join(out, 'voice.wav')]);
run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=gray:s=1080x1920:r=30', '-i', join(out, 'voice.wav'),
  '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', join(out, 'raw.mp4')]);
console.log(`ok · ${lang} · voice ${voice.name}\nClip: ${join(out, 'raw.mp4')}\nExpected text: ${lines.join(' ')}`);
