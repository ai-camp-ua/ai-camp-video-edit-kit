#!/usr/bin/env node
// Create a video project: npm run new-video -- <slug> [--format 9:16|16:9|1:1|4:5]
// Default format is 9:16 (Reels, Shorts, TikTok). 16:9 is YouTube / horizontal.
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FORMATS = {
  '9:16': [1080, 1920],
  '16:9': [1920, 1080],
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
};
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let format = '9:16';
const rest = [];
for (let i = 0; i < args.length; i++) args[i] === '--format' ? (format = args[++i]) : rest.push(args[i]);
const slug = rest[0];
if (!slug || slug === '--help') {
  console.log('Usage: npm run new-video -- <lowercase-project-slug> [--format 9:16|16:9|1:1|4:5]');
  process.exit(slug ? 0 : 1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use a lowercase kebab-case slug, not a path.');
if (!FORMATS[format]) throw new Error(`Unknown format ${format}. Use one of: ${Object.keys(FORMATS).join(', ')}`);
const [width, height] = FORMATS[format];
const dest = join(root, 'video-projects', slug);
if (existsSync(dest)) throw new Error(`Project already exists: ${slug}. Choose a new name.`);
const gsap = join(root, 'node_modules/gsap/dist/gsap.min.js');
if (!existsSync(gsap)) throw new Error('Run npm ci in the kit root first.');

cpSync(join(root, 'examples/starter'), dest, { recursive: true, errorOnExist: true });
for (const dir of ['assets', 'compositions', 'renders', 'refs']) mkdirSync(join(dest, dir), { recursive: true });
copyFileSync(gsap, join(dest, 'assets/gsap.min.js'));

const layout = height > width ? 'portrait' : width > height ? 'landscape' : 'square';
const unit = (Math.min(width, height) / 100).toFixed(1);
const html = readFileSync(join(dest, 'index.html'), 'utf8')
  .replaceAll('__W__', String(width)).replaceAll('__H__', String(height))
  .replaceAll('__U__', unit).replaceAll('__LAYOUT__', layout);
writeFileSync(join(dest, 'index.html'), html);

const meta = JSON.parse(readFileSync(join(dest, 'meta.json'), 'utf8'));
Object.assign(meta, { name: slug, width, height, format });
writeFileSync(join(dest, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
console.log(`Created video-projects/${slug} (${format}, ${width}x${height}). Footage goes in assets/, references in refs/.`);
