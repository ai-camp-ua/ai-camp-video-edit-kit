#!/usr/bin/env node
// Render one test frame with text in the video's language: checks HyperFrames,
// fonts and letters in one go. Used by SETUP and handy after any font change.
//   npm run check-render -- [--format 9:16|16:9|1:1|4:5] [--lang xx] [--text "..."]
// Prints the path of the PNG to look at. The project lands in video-projects/check-<lang>-<format>.
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVideoLanguage, subsetFor, sampleFor } from './lib/lang.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i === -1 ? fallback : args[i + 1]; };
const format = opt('--format', '9:16');
const lang = opt('--lang', readVideoLanguage(root) || 'en');
const text = opt('--text', sampleFor(lang));
const slug = `check-${lang}-${format.replace(':', 'x')}`;
const dest = join(root, 'video-projects', slug);
if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });

const run = (cmd, a, cwd = root) => {
  // Windows runs .cmd files (npx.cmd) only through a shell; everything else runs directly,
  // so paths with spaces such as C:\Program Files\nodejs\node.exe stay intact.
  const r = spawnSync(cmd, a, { cwd, encoding: 'utf8', shell: cmd.endsWith('.cmd'), windowsHide: true });
  if (r.status !== 0) { console.error(`${cmd} ${a.join(' ')} failed:\n${r.stdout}\n${r.stderr}`); process.exit(1); }
  return r.stdout;
};
run(process.execPath, [join(root, 'scripts/new-video.mjs'), slug, '--format', format]);
const [W, H] = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] }[format];
const u = Math.min(W, H) / 100;

// The rule from docs/FONTS.md: Bebas Neue has no Cyrillic, so a Cyrillic video
// uses its replacement (Oswald) for the whole text, not a mix of two fonts.
const display = subsetFor(lang) === 'cyrillic' ? 'Oswald' : 'Bebas Neue';
const vertical = H > W;
const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><title>Render check</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${display.replace(' ', '+')}&family=Montserrat:wght@800&family=Inter:wght@700&display=block">
<script src="assets/gsap.min.js"></script>
<style>
*{box-sizing:border-box}html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#0b0f14}
#main{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:radial-gradient(ellipse at 50% 30%,#1d2a3a,#0b0f14 70%)}
.hook{position:absolute;left:${6 * u}px;right:${6 * u}px;top:${(vertical ? 15 : 12) * u}px;font-family:"${display}",sans-serif;font-size:${(vertical ? 14 : 13) * u}px;line-height:.95;color:#fff;text-transform:uppercase}
.sub{position:absolute;left:${6 * u}px;right:${6 * u}px;top:${(vertical ? 62 : 52) * u}px;font-family:"Inter",sans-serif;font-weight:700;font-size:${4.5 * u}px;color:#37BDF8}
.cap{position:absolute;left:${8 * u}px;right:${8 * u}px;bottom:${(vertical ? 36 : 9) * u}px;text-align:center;font-family:"Montserrat",sans-serif;font-weight:800;font-size:${(vertical ? 6.5 : 5.5) * u}px;color:#fff;background:rgba(0,0,0,.65);padding:${1.6 * u}px ${2.4 * u}px;border-radius:${1.6 * u}px}
</style></head><body>
<div id="main" data-composition-id="main" data-start="0" data-duration="3" data-width="${W}" data-height="${H}">
<div id="hook" class="hook clip" data-start="0" data-duration="3" data-track-index="0">${text}</div>
<div id="sub" class="sub clip" data-start="0" data-duration="3" data-track-index="1">${display} · Inter · ${format} · 0123456789</div>
<div id="cap" class="cap clip" data-start="0" data-duration="3" data-track-index="2">${text}</div>
</div>
<script>
const tl=gsap.timeline({paused:true});
tl.from('#hook',{opacity:0,y:40,duration:.5,ease:'power2.out'},0);
tl.from('#sub,#cap',{opacity:0,duration:.4},.3);
window.__timelines=window.__timelines||{};window.__timelines['main']=tl;
</script></body></html>
`;
writeFileSync(join(dest, 'index.html'), html);
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const lint = run(npx, ['hyperframes', 'lint'], dest);
if (!/0 errors/.test(lint)) { console.error(lint); process.exit(1); }
run(npx, ['hyperframes', 'render', '--quality', 'draft', '--output', 'renders/check.mp4'], dest);
const png = join(dest, 'renders', 'check.png');
run('ffmpeg', ['-v', 'error', '-y', '-ss', '1.5', '-i', join(dest, 'renders', 'check.mp4'), '-frames:v', '1', png]);
console.log(`ok · ${lang} · ${format} · ${display}\nLook at: ${png}\nDelete afterwards: video-projects/${slug}`);
