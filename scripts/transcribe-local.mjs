#!/usr/bin/env node
// Transcribe a video/audio file locally with whisper.cpp -> word-level JSON.
// Free, offline, nothing is uploaded. Default transcriber of this kit.
//
// Usage:
//   npm run transcribe -- <input> [--output path] [--language xx|auto] [--model path]
//
// Language: --language, then VIDEO_LANGUAGE (.env), then auto-detect.
// Recordings longer than 10 minutes are split at pauses into ~5-minute chunks
// (word timing drifts on long single runs) and joined back on one timeline.
//
// Output shape (what the cutting tools expect):
//   { words: [{ text, start, end, type: "word" }], audio_duration_secs, language_code }
//
// Model lookup: --model, then WHISPER_MODEL, then models/*.bin in this kit, then ../models/*.bin.
// Binary lookup: scripts/lib/whisper.mjs (WHISPER_CLI, PATH, Homebrew, whisper/Release/whisper-cli.exe on Windows).

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { findWhisper } from "./lib/whisper.mjs";
import { argv, exit, env } from "node:process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { readVideoLanguage } from "./lib/lang.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LONG_SECS = 600;   // split recordings longer than this
const CHUNK_SECS = 300;  // aim for chunks about this long
const die = (m) => { console.error(m); exit(1); };

const args = argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.log("Usage: npm run transcribe -- <input> [--output path] [--language xx|auto] [--model path]");
  exit(args.length ? 0 : 1);
}
const opts = { input: null, output: null, language: null, model: env.WHISPER_MODEL || null };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--output" || a === "-o") opts.output = args[++i];
  else if (a === "--language" || a === "--lang" || a === "-l") opts.language = args[++i];
  else if (a === "--model" || a === "-m") opts.model = args[++i];
  else if (!opts.input) opts.input = a;
  else die(`Unknown argument: ${a}`);
}
const input = resolve(opts.input);
if (!existsSync(input)) die(`Input not found: ${input}`);
const output = resolve(opts.output || input.slice(0, -extname(input).length) + ".json");
const language = opts.language || readVideoLanguage(ROOT) || "auto";

function findModel() {
  if (opts.model) return existsSync(opts.model) ? resolve(opts.model) : die(`Model not found: ${opts.model}`);
  const rank = (f) => (f.includes("large-v3-turbo") ? 0 : 1) + (f.includes("q5") ? 0.5 : 0);
  for (const dir of [join(ROOT, "models"), join(ROOT, "..", "models")]) {
    if (!existsSync(dir)) continue;
    const bins = readdirSync(dir).filter((f) => /^ggml-.*\.bin$/.test(f)).sort((a, b) => rank(a) - rank(b));
    if (bins.length) return join(dir, bins[0]);
  }
  die("No Whisper model found. Put a ggml-*.bin model in models/ or set WHISPER_MODEL.");
}
const bin = findWhisper(ROOT);
if (!bin) die(process.platform === "win32"
  ? "whisper-cli not found. Unpack the whisper.cpp Windows archive into the kit's whisper folder (see SETUP.md, Windows)."
  : "whisper-cli not found. Install it: brew install whisper-cpp");
const model = findModel();

const run = (cmd, a) => spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// Split points: the middle of a pause near every CHUNK_SECS, else a hard cut.
function chunkBounds(wav, duration) {
  if (duration <= LONG_SECS) return [[0, duration]];
  const det = run("ffmpeg", ["-hide_banner", "-i", wav, "-af", "silencedetect=noise=-35dB:d=0.35", "-f", "null", "-"]);
  const mids = [];
  let s = null;
  for (const line of det.stderr.split("\n")) {
    const a = line.match(/silence_start: ([\d.]+)/); if (a) s = +a[1];
    const b = line.match(/silence_end: ([\d.]+)/); if (b && s !== null) { mids.push((s + +b[1]) / 2); s = null; }
  }
  const bounds = [];
  let from = 0;
  while (duration - from > CHUNK_SECS * 1.5) {
    const target = from + CHUNK_SECS;
    const near = mids.filter((m) => m > from + CHUNK_SECS * 0.6 && m < from + CHUNK_SECS * 1.4);
    const cut = near.length ? near.reduce((p, m) => (Math.abs(m - target) < Math.abs(p - target) ? m : p)) : target;
    bounds.push([from, cut]);
    from = cut;
  }
  bounds.push([from, duration]);
  return bounds;
}

const t0 = Date.now();
const tmp = mkdtempSync(join(tmpdir(), "transcribe-"));
try {
  const wav = join(tmp, "audio.wav");
  const ff = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav], { stdio: "inherit" });
  if (ff.status !== 0) die("ffmpeg could not extract audio.");
  const probe = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]);
  const duration = parseFloat(probe.stdout) || 0;

  const bounds = chunkBounds(wav, duration);
  const words = [];
  let detected = language;
  for (const [i, [from, to]] of bounds.entries()) {
    let src = wav;
    if (bounds.length > 1) {
      src = join(tmp, `chunk${i}.wav`);
      const cut = run("ffmpeg", ["-v", "error", "-y", "-i", wav, "-ss", String(from), "-to", String(to), "-c", "copy", src]);
      if (cut.status !== 0) die(`ffmpeg could not cut chunk ${i + 1}:\n${cut.stderr}`);
      console.log(`chunk ${i + 1}/${bounds.length}: ${from.toFixed(1)}–${to.toFixed(1)} s`);
    }
    const base = join(tmp, `out${i}`);
    // Keep the language detected in the first chunk for the rest, so chunks agree.
    const r = run(bin, ["-m", model, "-f", src, "-l", detected, "-ml", "1", "-sow", "-oj", "-of", base, "-np"]);
    if (r.status !== 0) die(`whisper-cli failed:\n${r.stderr}`);
    const raw = JSON.parse(readFileSync(base + ".json", "utf8"));
    if (detected === "auto" && raw.result?.language) detected = raw.result.language;
    for (const seg of raw.transcription || []) {
      const text = (seg.text || "").trim();
      if (!text || /^[\[(].*[\])]$/.test(text)) continue; // skip empty and [music]-style tags
      const start = from + seg.offsets.from / 1000;
      const end = Math.max(from + seg.offsets.to / 1000, start + 0.02);
      const prev = words[words.length - 1];
      // whisper sometimes splits punctuation into its own segment: glue it back
      if (prev && /^[.,!?;:…»")\]]+$/.test(text)) { prev.text += text; prev.end = Math.max(prev.end, end); continue; }
      words.push({ text, start: +start.toFixed(3), end: +end.toFixed(3), type: "word" });
    }
  }

  // whisper.cpp sometimes squashes a few words into ~0 s and gives the whole slot
  // to the next word. Spread such a run over the slot by letter count.
  for (let i = 0; i < words.length; i++) {
    if (words[i].end - words[i].start > 0.05) continue;
    let j = i;
    while (j < words.length - 1 && words[j].end - words[j].start <= 0.05) j++;
    const runWords = words.slice(i, j + 1);
    const from = runWords[0].start, to = runWords.at(-1).end;
    const letters = runWords.reduce((n, w) => n + w.text.length, 0);
    let t = from;
    for (const w of runWords) {
      w.start = +t.toFixed(3);
      t += ((to - from) * w.text.length) / letters;
      w.end = +t.toFixed(3);
    }
    i = j;
  }

  writeFileSync(output, JSON.stringify({ language_code: detected, audio_duration_secs: duration || (words.at(-1)?.end ?? 0), source: "whisper.cpp", model: model.split(/[\\/]/).pop(), words }, null, 2));
  console.log(`ok ${((Date.now() - t0) / 1000).toFixed(1)}s | ${detected} | ${words.length} words | ${duration.toFixed(1)}s audio | ${bounds.length} chunk(s) | ${output}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
