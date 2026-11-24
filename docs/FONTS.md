# Fonts and the video's language

Many popular display fonts (Bebas Neue, Poppins, Space Grotesk, Anton…) cover
only Latin. For a video in Ukrainian, Russian or another Cyrillic language, the
browser silently draws the missing letters in some random fallback font. Some
fonts also lack Polish, Turkish, Czech… letters. This page prevents that.

The video's language is one setting: `VIDEO_LANGUAGE` in `.env`, written by
`npm run setup -- --lang xx`. The font check and the render check read it.

## The set

`fonts/fonts.json` holds the font set: the fonts HyperFrames bundles and uses in
its presets, plus the fonts of this kit's styles. Nothing is hand-picked.

- **Have Cyrillic (18):** Inter, Montserrat, Nunito, Oswald, Roboto, Open Sans,
  Raleway, Playfair Display, Lora, Merriweather, Source Serif 4, EB Garamond,
  Pacifico, Caveat, IBM Plex Mono, JetBrains Mono, Source Code Pro, Fira Code.
  All were rendered with Ukrainian and Russian text and draw every letter themselves.
- **No Cyrillic (24):** each has a replacement from the list above that looks
  closest (`replace` in `fonts/fonts.json`), for example Bebas Neue → Oswald,
  Poppins → Montserrat, Space Grotesk → Inter, Bodoni Moda → Playfair Display,
  Permanent Marker → Caveat.

Any style may use any font: a reference reel's font, a brand font, a trendy one.
The rule below only makes sure every letter of the video's language looks right.

## The rule

1. Before using a font, run `npm run font-check -- "Font Name"`. It checks the
   letters the video's language needs (Cyrillic, Polish/Turkish/Czech extended
   Latin, Greek…); for plain English nothing is needed.
2. The font covers the language: use it.
3. It does not: use the replacement **for the whole text** (Latin letters and
   digits too), so one line never mixes two fonts. For Cyrillic the replacement
   comes from `fonts/fonts.json`; otherwise pick the closest-looking font that
   covers the language.
4. Check one frame: `npm run check-render` renders the language's test line, or
   render a frame of the real video. Every letter must be in the same style.

Fonts not on Google Fonts (for example a brand's own files) need an
`@font-face` with the file in `assets/fonts/`; check their letters the same way.

The two built-in styles list a replacement after their Latin-only fonts
(`"Fraunces", "Lora", …`). That is only a safety net; for a Cyrillic video
still apply step 3.
