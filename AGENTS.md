# AI CAMP video-edit kit: workspace guide

Turn a talking-head recording into a finished video, vertical (Reels, Shorts,
TikTok) or horizontal (YouTube), with local HyperFrames rendering,
transcript-driven cuts, captions, and motion graphics. Users are often not
programmers: answer in the language they write in, in short plain words, and
show results instead of code.

The video's language is `VIDEO_LANGUAGE` in `.env` (set by
`npm run setup -- --lang xx`; empty = auto-detect). Transcription, the font check
and the render check read it. If a video is in another language, pass
`--language xx` / `--lang xx` for that video.

## Runtime routing

This guide lives in `AGENTS.md`; `CLAUDE.md` only imports it (`@AGENTS.md`). Edit this file only.
Claude Code uses `.claude/skills/`. Codex uses the generated `.agents/skills/`.
Edit canonical skills in `.claude/skills/`, then run `npm run sync:skills`.
The HyperFrames skills (`hyperframes`, `hyperframes-cli`, `hyperframes-registry`,
`media-use`) are installed globally with `npx hyperframes skills update` run from the
workspace, so they match the kit's pinned CLI. Do not update HyperFrames on your own. Work locally unless the user requests subagents.

## Start and route

Read `docs/WORKFLOW.md` for a complete edit. For one stage, load the matching skill:

| Need | Skill |
| --- | --- |
| Reels, Shorts, and short advertisements | `short-form-edit` |
| Full raw-video edit (long form) | `edit-video` |
| Silence removal | `cut-silences` |
| Retakes, false starts, or stutters | `cut-mistakes` |
| New motion-graphics video from a brief | `make-a-video` |
| Motion-design showreels and brand reels cut to music | `motion-showreel` |
| Narrative arc, persistent world, and visual callbacks | `video-storytelling` |
| Overlay beats, paper takeovers, and glass cards | `hyperframes-video-beats` |
| Select or extend styles and templates | `style-library` |
| HTML compositions and media timing | `hyperframes` |
| Preview, lint, and rendering | `hyperframes-cli` |
| Hook effects and catalog blocks | `hyperframes-registry` |
| Timeline animation | `gsap` |

## Style

`MY-STYLE.md` in the workspace root is the user's own video style (fonts,
colours, captions, pacing, effects). When it exists it wins over every default,
including `docs/EDITING-PLAYBOOK.md` and `MOTION_PHILOSOPHY.md`. When the user
sends reference reels, take only what they said they like in each one; never
copy a reference one to one. Save style decisions to `MY-STYLE.md`, not here.

Before a creative session read `MY-STYLE.md` (if any), `MOTION_PHILOSOPHY.md`,
and the project's DESIGN.md. The philosophy's fast sizzle pacing is a style
reference; give speech room to breathe. Framework skill contracts override
historical code recipes in the style guide.

## Fonts and letters

Every font must draw all letters of the video's language itself. Before using a
font run `npm run font-check -- "Font Name"`. If it does not cover the language,
use its replacement (Cyrillic: `fonts/fonts.json`) for the whole text, Latin and
digits included, so a line never mixes two fonts. Check one frame with
`npm run check-render` or a frame of the real video. Details: `docs/FONTS.md`.

## Workspace

Create a project with `npm run new-video -- my-video [--format 9:16|16:9|1:1|4:5]`
(default 9:16). Choose the format from the request or the footage and ask when
unclear; layout rules per format are in `docs/FORMATS.md`. Footage goes into the
project's `assets/`, reference videos into `refs/`. Keep source media, EDLs,
transcripts, compositions, and renders together under `video-projects/<slug>/`.
Run HyperFrames from that project's directory. `style-library/registry.json`
indexes cards; each style has a DESIGN.md, CSS tokens, and named text slots.
See `style-templates/README.md` for whole-scene templates.

Preserve raw files. Use a new output filename for each editing stage (v1, v2…).
Video projects, personal footage, transcripts, credentials, and renders are
gitignored. Never print secrets or copy private media into library examples.

## Editing and timing

Transcribe locally: `npm run transcribe -- <video>` (whisper.cpp, language from
`VIDEO_LANGUAGE` or auto-detected; free, nothing uploaded; recordings over 10
minutes are split at pauses automatically). Whisper can mishear names, brands,
and slang: fix them in captions from context and never invent words the speaker
did not say. Whisper also invents stock phrases over silence or music, the kind
a video ends with ("Thanks for watching", "Дякую за перегляд", "Продолжение
следует", subtitle credits): drop any phrase with no speech under it. Cloud providers (ElevenLabs, OpenAI) and
paid generation (Kie.ai) are optional; see `docs/TOOLS-AND-API-KEYS.md` and ask
before any upload or paid call. Reuse existing transcripts and assets.

Cut silences first; use its edited video AND retimed transcript for cut-mistakes.
Review each mistake in context. Intentional repetition is not a mistake. Record
the reviewed decisions before applying them. If no cuts are needed, preserve the
input or use an empty cuts list. Never mix original timestamps with edited footage.

When the user has not given a hook or headline, offer 3–4 short options and let
them choose.

Load the relevant skills before changing HTML. Root compositions use a visible
div with id, data-composition-id, data-start, duration, width, and height. Timed
elements carry data-start, data-duration, and data-track-index; same-track clips
must not overlap. Visible timed divs use class="clip"; videos do not.
Mute videos and use sibling audio for the mix. Animate a non-timed video wrapper.
Register one synchronous paused GSAP timeline per composition in window.__timelines
using its exact composition ID. Keep finite timelines and explicit durations.
HyperFrames owns media playback. Use deterministic animation and local assets.
Skip the HyperFrames skill's optional "usage note"; do not run `hyperframes events`.

## Verification and approvals

Run `node scripts/preflight.mjs <project>` and HyperFrames lint. For anchored
sub-compositions, run `node scripts/validate-beat-sync.mjs <project>`; each beat
needs data-anchor with an exact transcript phrase. Enter between 0.2 seconds after
and 1.8 seconds before that word. Inline timelines require manual timing review.

Run each render alone, with no background removal, transcription or encoding
alongside it.

Review the encoded draft, extract and inspect hero frames and transition
boundaries, and listen to the audio joins. Check cropped faces, overflow, black
flashes, readable captions, every letter of the language, safe zones of the format, clipping, and A/V sync. Resolve
problems before the final render. Save evidence in VERIFY.md.

Honor approvals already provided. When review approval is missing, prepare the
concrete preview or cut proposal first. Never claim a lint result proves visual
quality. Only publish or upload a finished video when the user authorizes it.
Automated browser checks must be headless, with Pointer Lock and cursor capture
disabled; synthetic input must remain inside the virtual browser.

For short-form edits, read `docs/SHORT-FORM.md` and `docs/EDITING-PLAYBOOK.md`
(quality rules and lessons), and use the plan and footage validators. Structural
checks supplement rendered video and audio review.
