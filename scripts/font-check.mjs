#!/usr/bin/env node
// Can a font draw the video's language? If not, which font to use instead.
// Usage: npm run font-check -- "Bebas Neue" ["Font 2" ...] [--lang xx]
// Language: --lang, then VIDEO_LANGUAGE (.env). Without a language, Cyrillic is checked.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readVideoLanguage, subsetFor, sampleFor } from "./lib/lang.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const set = JSON.parse(readFileSync(join(root, "fonts", "fonts.json"), "utf8"));
const args = process.argv.slice(2);
let lang = null;
const names = [];
for (let i = 0; i < args.length; i++) args[i] === "--lang" ? (lang = args[++i]) : names.push(args[i]);
if (!names.length) { console.log('Usage: npm run font-check -- "Font Name" ... [--lang xx]'); process.exit(1); }
lang = lang || readVideoLanguage(root);
const subset = lang ? subsetFor(lang) : "cyrillic";
const sample = sampleFor(lang || "uk");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

console.log(`Language: ${lang || "not set"} · needs: ${subset || "basic Latin"} · test line: "${sample}"`);
for (const name of names) {
  if (!subset) { console.log(`${name}: ok (basic Latin is enough)`); continue; }
  if (subset === "cyrillic") {
    if (set.cyrillic.includes(name)) { console.log(`${name}: ok, has Cyrillic`); continue; }
    if (set.replace[name]) { console.log(`${name}: NO Cyrillic -> use ${set.replace[name]} for the whole text`); continue; }
  }
  let verdict;
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}`;
    const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
    if (!css.includes("@font-face")) verdict = `not on Google Fonts -> check its own files, render "${sample}" and look`;
    else if (css.includes(`/* ${subset} */`)) verdict = `ok, has ${subset} (Google Fonts)`;
    else verdict = subset === "cyrillic"
      ? `NO Cyrillic -> pick the closest-looking font from fonts/fonts.json 'cyrillic' for the whole text, render "${sample}" and look`
      : `NO ${subset} -> pick a similar font that has ${subset}, render "${sample}" and look`;
  } catch { verdict = `offline, could not check -> render "${sample}" and look`; }
  console.log(`${name}: ${verdict}`);
}
