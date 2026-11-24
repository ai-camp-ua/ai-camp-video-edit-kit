#!/usr/bin/env node
// Transcribe a video/audio file locally with whisper.cpp -> word-level JSON.
// Free, offline, nothing is uploaded. Default transcriber of this kit.
//
// Usage:
//   npm run transcribe -- <input> [--output path] [--language uk] [--model path]
//
// Output shape (same as the cutting tools expect):
//   { words: [{ text, start, end, type: "word" }], audio_duration_secs, language }
//
// Model lookup: --model, then WHISPER_MODEL, then models/*.bin in this kit,
// then ../models/*.bin (the setup puts the model there).

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { argv, exit, env } from "node:process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const die = (m) => { console.error(m); exit(1); };

const args = argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) {
  console.log("Usage: npm run transcribe -- <input> [--output path] [--language uk] [--model path]");
  exit(args.length ? 0 : 1);
}
const opts = { input: null, output: null, language: "uk", model: env.WHISPER_MODEL || null };
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

const bin = [env.WHISPER_CLI, "whisper-cli", "/opt/homebrew/bin/whisper-cli", "/usr/local/bin/whisper-cli", join(ROOT, "whisper", "whisper-cli.exe")].filter(Boolean)
  .find((b) => spawnSync(b, ["--help"], { stdio: "ignore" }).status === 0);
if (!bin) die("whisper-cli not found. Install it: brew install whisper-cpp");
const model = findModel();

const t0 = Date.now();
const tmp = mkdtempSync(join(tmpdir(), "transcribe-"));
try {
  const wav = join(tmp, "audio.wav");
  const ff = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav], { stdio: "inherit" });
  if (ff.status !== 0) die("ffmpeg could not extract audio.");

  const base = join(tmp, "out");
  const run = spawnSync(bin, ["-m", model, "-f", wav, "-l", opts.language, "-ml", "1", "-sow", "-oj", "-of", base, "-np"], { encoding: "utf8" });
  if (run.status !== 0) die(`whisper-cli failed:\n${run.stderr}`);

  const raw = JSON.parse(readFileSync(base + ".json", "utf8"));
  const words = [];
  for (const seg of raw.transcription || []) {
    const text = (seg.text || "").trim();
    if (!text || /^[\[(].*[\])]$/.test(text)) continue; // skip empty and [музика]-style tags
    const start = seg.offsets.from / 1000;
    const end = Math.max(seg.offsets.to / 1000, start + 0.02);
    const prev = words[words.length - 1];
    // whisper sometimes splits punctuation into its own segment: glue it back
    if (prev && /^[.,!?;:…»")\]]+$/.test(text)) { prev.text += text; prev.end = Math.max(prev.end, end); continue; }
    words.push({ text, start: +start.toFixed(3), end: +end.toFixed(3), type: "word" });
  }

  // whisper.cpp sometimes squashes a few words into ~0 s and gives the whole slot
  // to the next word. Spread such a run over the slot by letter count.
  for (let i = 0; i < words.length; i++) {
    if (words[i].end - words[i].start > 0.05) continue;
    let j = i;
    while (j < words.length - 1 && words[j].end - words[j].start <= 0.05) j++;
    const run = words.slice(i, j + 1);
    const from = run[0].start, to = run.at(-1).end;
    const letters = run.reduce((n, w) => n + w.text.length, 0);
    let t = from;
    for (const w of run) {
      w.start = +t.toFixed(3);
      t += ((to - from) * w.text.length) / letters;
      w.end = +t.toFixed(3);
    }
    i = j;
  }

  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", input], { encoding: "utf8" });
  const duration = parseFloat(probe.stdout) || (words.at(-1)?.end ?? 0);

  writeFileSync(output, JSON.stringify({ language_code: opts.language, audio_duration_secs: duration, source: "whisper.cpp", model: model.split("/").pop(), words }, null, 2));
  console.log(`ok ${((Date.now() - t0) / 1000).toFixed(1)}s | ${words.length} words | ${duration.toFixed(1)}s audio | ${output}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
