# Fonts and Ukrainian text

Videos here are mostly in Ukrainian. Many popular display fonts (Bebas Neue,
Poppins, Space Grotesk, Anton…) have **no Cyrillic**, and the browser silently
draws Ukrainian letters in some random fallback. This page prevents that.

## The set

`fonts/fonts.json` holds the font set: the fonts HyperFrames bundles and uses in
its presets, plus the fonts of this kit's styles. Nothing is hand-picked.

- **Have Cyrillic (18):** Inter, Montserrat, Nunito, Oswald, Roboto, Open Sans,
  Raleway, Playfair Display, Lora, Merriweather, Source Serif 4, EB Garamond,
  Pacifico, Caveat, IBM Plex Mono, JetBrains Mono, Source Code Pro, Fira Code.
  All were rendered with "Ґанок їжак єнот і" and draw every letter themselves.
- **No Cyrillic (24):** each has a replacement from the list above that looks
  closest (`replace` in `fonts/fonts.json`), for example Bebas Neue → Oswald,
  Poppins → Montserrat, Space Grotesk → Inter, Bodoni Moda → Playfair Display,
  Permanent Marker → Caveat.

Any style may use any font: a reference reel's font, a brand font, a trendy one.
The rule below only makes sure Ukrainian letters look right.

## The rule

1. Before using a font, run `npm run font-check -- "Font Name"`.
2. Has Cyrillic: use it.
3. No Cyrillic: put the replacement **right after it** in the font stack:
   `font-family: "Bebas Neue", "Oswald", sans-serif;` and load both. Latin
   letters keep the original look, Ukrainian letters use the replacement.
4. Not in the table: pick the closest-looking font from the Cyrillic list (same
   kind: condensed, geometric, serif, script, mono), add it the same way.
5. Render one frame with "Ґанок їжак єнот і" in that font and look at it: every
   letter must be in the same style, no letter from a different font.

Fonts not on Google Fonts (for example a brand's own files) need an
`@font-face` with the file in `assets/fonts/`; check their Cyrillic the same way.
