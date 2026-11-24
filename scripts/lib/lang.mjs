// Video language helpers shared by the kit's scripts.
// The language is one setting: VIDEO_LANGUAGE in .env (written by `npm run setup -- --lang xx`).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ISO 639-1 codes of languages written in Cyrillic.
export const CYRILLIC = new Set(["uk", "ru", "be", "bg", "sr", "mk", "kk", "ky", "tg", "mn", "ba", "tt"]);

// Google Fonts subset a language needs beyond basic Latin.
const SUBSET = {
  pl: "latin-ext", cs: "latin-ext", sk: "latin-ext", tr: "latin-ext", ro: "latin-ext", hu: "latin-ext",
  hr: "latin-ext", sl: "latin-ext", lv: "latin-ext", lt: "latin-ext", et: "latin-ext", az: "latin-ext",
  sq: "latin-ext", is: "latin-ext", mt: "latin-ext", cy: "latin-ext", vi: "vietnamese", el: "greek",
  he: "hebrew", ar: "arabic", ka: "georgian", hi: "devanagari", th: "thai",
};

export function subsetFor(lang) {
  if (!lang || lang === "auto") return null;
  if (CYRILLIC.has(lang)) return "cyrillic";
  return SUBSET[lang] || null; // null = basic Latin is enough
}

// One line that shows the letters a font must draw for this language.
const SAMPLE = {
  uk: "Ґанок, їжак і єнот", ru: "Съешь ещё этих мягких булок", be: "Беларуская мова: ў, і, ё",
  bg: "Щастливо, юнако", sr: "Ђак, ћерка, џеп", kk: "Қазақ тілі: әңгіме, өнер",
  en: "The quick brown fox jumps", de: "Grüße aus München", pl: "Zażółć gęślą jaźń",
  es: "¿Qué tal? Año nuevo", fr: "Ça va très bien", it: "Perché no? Così è", pt: "Não há ação",
  tr: "Çok güzel, şişe ğ ı", cs: "Příliš žluťoučký kůň", ro: "Știință și țară",
};
export const sampleFor = (lang) => SAMPLE[lang] || SAMPLE.en;

// Two short sentences for the setup's synthetic test clip.
const SPEECH = {
  uk: ["Привіт! Це тестове відео.", "Ґанок, їжак, єнот."],
  ru: ["Привет! Это тестовое видео.", "Съешь ещё этих мягких булок."],
  en: ["Hello! This is a test video.", "The quick brown fox jumps."],
  de: ["Hallo! Das ist ein Testvideo.", "Grüße aus München."],
  pl: ["Cześć! To jest film testowy.", "Zażółć gęślą jaźń."],
  es: ["¡Hola! Este es un video de prueba.", "Año nuevo, vida nueva."],
};
export const speechFor = (lang) => SPEECH[lang] || null;

export function readVideoLanguage(root) {
  if (process.env.VIDEO_LANGUAGE) return process.env.VIDEO_LANGUAGE.trim();
  const env = join(root, ".env");
  if (!existsSync(env)) return null;
  const line = readFileSync(env, "utf8").split(/\r?\n/).find((l) => /^\s*VIDEO_LANGUAGE\s*=/.test(l));
  const value = line?.split("=")[1]?.trim().replace(/^["']|["']$/g, "");
  return value || null;
}
