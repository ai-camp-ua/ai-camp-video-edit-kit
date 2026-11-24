# Video formats

Pick the format when creating the project:

```sh
npm run new-video -- my-video                  # 9:16, 1080x1920 (default)
npm run new-video -- my-video --format 16:9    # 1920x1080
npm run new-video -- my-video --format 1:1     # 1080x1080
npm run new-video -- my-video --format 4:5     # 1080x1350
```

| Format | Where it goes | Typical length |
| --- | --- | --- |
| 9:16 | Reels, Shorts, TikTok, Stories | 15–90 s |
| 16:9 | YouTube, courses, presentations | 2–60 min |
| 1:1, 4:5 | Feed posts | 15–60 s |

If the user did not say, decide from the request ("рілс", "Shorts" → 9:16;
"YouTube", "урок", "вебінар" → 16:9) or from the footage's own orientation; ask
when it is still unclear. A second format of the same video is its own
composition with its own framing, never a centre crop.

## Layout rules

Sizes below are for the full frame; `u` is 1% of the short side (10.8 px).

**9:16 (phone, full screen)**
- Platform UI covers the edges: keep text out of the top ~13% and the bottom
  ~20%, and ~6% from the sides (right side holds like/comment buttons on Reels).
- Captions: 6–7u (65–75 px), bold, 1–2 lines, centred, around 60–70% height,
  never over the mouth.
- Hook headline: 10–14u, in the top third, readable in under a second.
- One idea per screen; faces usually framed in the upper-middle.

**16:9 (screen, watched longer)**
- Keep text inside the title-safe area: ~5% from every edge.
- Captions: 4.5–5.5u (48–60 px), bottom ~8–10% of the height, max 2 lines,
  about 42 characters per line. Long videos can go without burned captions
  (upload subtitles instead) if the user prefers.
- Titles and lower thirds: 6–9u titles, lower thirds in the bottom-left third.
- Calmer pacing than reels: B-roll and graphics support the speech, they do not
  fight it. Chapters or section cards help in long videos.

**1:1 and 4:5 (feed)**
- Same type sizes as 9:16, with ~6% margins all round; nothing important in
  the bottom 10% on 4:5 (caption overlay on some apps).

## Long recordings

`npm run transcribe` splits recordings over 10 minutes at pauses into ~5-minute
chunks and joins the words back on one timeline, so word timing does not drift.
For long edits cut silences and mistakes first, then plan graphics per chapter.
