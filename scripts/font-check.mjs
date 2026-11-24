#!/usr/bin/env node
// Does a font have Cyrillic? If not, which font to use instead.
// Usage: npm run font-check -- "Bebas Neue" ["Font 2" ...]
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const set = JSON.parse(readFileSync(join(root, "fonts", "fonts.json"), "utf8"));
const names = process.argv.slice(2);
if (!names.length) { console.log('Usage: npm run font-check -- "Font Name" ...'); process.exit(1); }

for (const name of names) {
  if (set.cyrillic.includes(name)) { console.log(`${name}: ok, has Cyrillic`); continue; }
  if (set.replace[name]) { console.log(`${name}: NO Cyrillic -> use ${set.replace[name]}`); continue; }
  let verdict;
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}`;
    const css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" } })).text();
    verdict = css.includes("/* cyrillic */") ? "ok, has Cyrillic (Google Fonts)"
      : css.includes("@font-face") ? "NO Cyrillic -> pick the closest-looking font from fonts/fonts.json 'cyrillic', render 'Ґанок їжак єнот і' and check"
      : "not on Google Fonts -> check its own files for Cyrillic, render 'Ґанок їжак єнот і' and check";
  } catch { verdict = "offline, could not check -> render 'Ґанок їжак єнот і' and check"; }
  console.log(`${name}: ${verdict}`);
}
