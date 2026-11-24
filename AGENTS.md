# AI CAMP video-edit kit: workspace guide

Turn a talking-head recording into a finished vertical video (Reels, Shorts,
TikTok) with local HyperFrames rendering, transcript-driven cuts, captions, and
motion graphics. Users are often not programmers: answer in their language
(usually Ukrainian), in short plain words, and show results instead of code.

## Runtime routing

`AGENTS.md` and `CLAUDE.md` contain the same standing guide. Keep them synchronized.
Claude Code uses `.claude/skills/`. Codex uses the generated `.agents/skills/`.
Edit canonical skills in `.claude/skills/`, then run `npm run sync:skills`.
The HyperFrames skills (`hyperframes`, `hyperframes-cli`, `hyperframes-registry`,
`media-use`) are installed globally with `npx hyperframes skills update`, so they
always match the newest CLI. Work locally unless the user requests subagents.

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

## Fonts and Ukrainian text

Every font must draw Ukrainian letters (ґ ї є і) itself. Before using a font run
`npm run font-check -- "Font Name"`. If it has no Cyrillic, put the replacement
from `fonts/fonts.json` right after it in the font stack and load both; if it is
not in the table, pick the closest-looking Cyrillic font from that file. Render
one frame with "Ґанок їжак єнот і" and look at it. Details: `docs/FONTS.md`.

## Workspace

Create a project with `npm run new-video -- my-video`. Keep source media, EDLs,
transcripts, compositions, and renders together under `video-projects/<slug>/`.
Run HyperFrames from that project's directory. `style-library/registry.json`
indexes cards; each style has a DESIGN.md, CSS tokens, and named text slots.
See `style-templates/README.md` for whole-scene templates.

Preserve raw files. Use a new output filename for each editing stage (v1, v2…).
Video projects, personal footage, transcripts, credentials, and renders are
gitignored. Never print secrets or copy private media into library examples.

## Editing and timing

Transcribe locally: `npm run transcribe -- <video>` (whisper.cpp, Ukrainian by
default, `--language en` for English; free, nothing uploaded). Whisper can
mishear names, brands, and slang: fix them in captions from context and never
invent words the speaker did not say. Whisper also invents phrases on silence
("Дякую за перегляд", "Субтитрувальниця…"): drop them. Cloud providers (ElevenLabs, OpenAI) and
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

Review the encoded draft, extract and inspect hero frames and transition
boundaries, and listen to the audio joins. Check cropped faces, overflow, black
flashes, readable captions, Ukrainian letters, clipping, and A/V sync. Resolve
problems before the final render. Save evidence in VERIFY.md.

Honor approvals already provided. When review approval is missing, prepare the
concrete preview or cut proposal first. Never claim a lint result proves visual
quality. Only publish or upload a finished video when the user authorizes it.
Automated browser checks must be headless, with Pointer Lock and cursor capture
disabled; synthetic input must remain inside the virtual browser.

For short-form edits, read `docs/SHORT-FORM.md` and `docs/EDITING-PLAYBOOK.md`
(quality rules and lessons), and use the plan and footage validators. Structural
checks supplement rendered video and audio review.
