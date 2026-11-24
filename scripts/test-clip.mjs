#!/usr/bin/env node
// macOS and Windows: make a synthetic test clip in the video's language:
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
const run = (cmd, a, opts = {}) => { const r = spawnSync(cmd, a, { encoding: 'utf8', windowsHide: true, ...opts }); if (r.status !== 0) { console.error(`${cmd} failed:\n${r.stderr || r.stdout}`); process.exit(1); } return r; };
mkdirSync(out, { recursive: true });
const a = join(out, 'a.wav'), b = join(out, 'b.wav');
let voiceName;

if (process.platform === 'darwin') {
  // macOS: `say`. Preferred names first, then any voice with that locale.
  const preferred = { uk: 'Lesya', ru: 'Milena', en: 'Samantha', de: 'Anna', pl: 'Zosia', es: 'Mónica' };
  const list = spawnSync('say', ['-v', '?'], { encoding: 'utf8' }).stdout.split('\n')
    .map((l) => l.match(/^(.+?)\s+([a-z]{2,3})_[A-Za-z0-9]+\s+#/)).filter(Boolean)
    .map((m) => ({ name: m[1].trim(), lang: m[2] }));
  const voice = list.find((v) => v.name === preferred[lang]) || list.find((v) => v.lang === lang);
  if (!voice) { console.error(`No macOS voice for "${lang}". Add one in System Settings → Accessibility → Spoken Content, or record a clip.`); process.exit(1); }
  voiceName = voice.name;
  run('say', ['-v', voice.name, '--file-format=WAVE', '--data-format=LEI16@22050', '-o', a, lines[0]]);
  run('say', ['-v', voice.name, '--file-format=WAVE', '--data-format=LEI16@22050', '-o', b, lines[1]]);
} else if (process.platform === 'win32') {
  // Windows: built-in speech (System.Speech) through PowerShell. Text goes in
  // through environment variables, so quotes in it cannot break the command.
  const ps = `
    Add-Type -AssemblyName System.Speech
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $v = $s.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.TwoLetterISOLanguageName -eq $env:TC_LANG } | Select-Object -First 1
    if (-not $v) { [Console]::Error.WriteLine("NOVOICE"); exit 3 }
    $s.SelectVoice($v.VoiceInfo.Name)
    $s.SetOutputToWaveFile($env:TC_A); $s.Speak($env:TC_T1)
    $s.SetOutputToWaveFile($env:TC_B); $s.Speak($env:TC_T2)
    $s.Dispose()
    Write-Output $v.VoiceInfo.Name`;
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    encoding: 'utf8', windowsHide: true,
    env: { ...process.env, TC_LANG: lang, TC_A: a, TC_B: b, TC_T1: lines[0], TC_T2: lines[1] },
  });
  if (r.status === 3) { console.error(`No Windows voice for "${lang}". Add one in Settings → Time & language → Speech, or record a clip.`); process.exit(1); }
  if (r.status !== 0) { console.error(`Windows speech failed:\n${r.stderr || r.stdout}`); process.exit(1); }
  voiceName = r.stdout.trim().split(/\r?\n/).pop();
} else {
  console.error('Synthetic voices need macOS or Windows. Record a short clip with a pause instead.'); process.exit(1);
}

run('ffmpeg', ['-v', 'error', '-y', '-i', a, '-f', 'lavfi', '-t', '2', '-i', 'anullsrc=r=22050:cl=mono', '-i', b,
  '-filter_complex', '[0:a]aresample=22050,aformat=channel_layouts=mono[x];[2:a]aresample=22050,aformat=channel_layouts=mono[y];[x][1:a][y]concat=n=3:v=0:a=1[a]', '-map', '[a]', join(out, 'voice.wav')]);
run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=gray:s=1080x1920:r=30', '-i', join(out, 'voice.wav'),
  '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', join(out, 'raw.mp4')]);
console.log(`ok · ${lang} · voice ${voiceName}\nClip: ${join(out, 'raw.mp4')}\nExpected text: ${lines.join(' ')}`);
