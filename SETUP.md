# SETUP: local video-editing workspace for Claude Code

You are setting up a workspace for editing videos (Reels, Shorts, TikTok, YouTube) with Claude Code.
The user is not a programmer. Talk to them in Ukrainian, in plain words. Never ask them to edit files or type commands, except where noted (a Mac password, which only they may enter).
Verify every step by running a command and reading its output, not by assuming. If a step fails, explain why in one or two sentences and fix it before moving on.

## Target

Everything is installed into **the folder this session is open in** (the workspace, below `$W`). Editing later happens in this same folder, so do not create a nested project folder.

```bash
W="$(pwd)"; echo "$W"; ls -A "$W"
```

Stop and ask the user to create a separate folder (for example `~/VideoEditing`) and reopen the session with it if `$W` is any of:
- the home folder;
- Desktop, Documents or Downloads, or anything inside iCloud Drive;
- a folder that already holds unrelated files.

A `.DS_Store` file, or a copy of SETUP.md in the folder, is fine.

Shell variables do not survive between tool calls. Re-define `W` or use the absolute path in each command.

What gets installed:

| Tool | Purpose |
|---|---|
| FFmpeg (full build, `ffmpeg-full`) | cutting, joining, colour, audio, burned-in subtitles |
| whisper.cpp + `ggml-large-v3-turbo` | local word-level transcription, Ukrainian included |
| yt-dlp | downloading reference videos from Instagram, YouTube or TikTok links |
| Node.js 22+ | runtime for HyperFrames and the kit |
| AI CAMP video-edit kit (`https://github.com/ai-camp-ua/ai-camp-video-edit-kit.git`) | editing skills, styles, Cyrillic-safe fonts, local transcription |
| HyperFrames skills | HTML-to-video rendering, captions, hook effects catalog |

## Step 0. System check

```bash
sw_vers 2>/dev/null; uname -m; df -h "$HOME" | tail -1; echo "RAM GB: $(( $(sysctl -n hw.memsize) / 1073741824 ))"
for c in brew git node npm; do printf "%-6s " $c; command -v $c >/dev/null && ($c --version 2>&1 | head -1) || echo "missing"; done
```

- At least 10 GB free is required. If there is less, ask the user to free space, then continue.
- On Windows, go to the "Windows" section.
- If Homebrew is missing, do not install it yourself, because its installer needs the Mac password.
  - Give the user the one-line command from https://brew.sh. Tell them to paste it into the Terminal app, enter their Mac password (typing is invisible), and wait for "Installation successful".
  - On Apple Silicon, also run the two `eval "$(/opt/homebrew/bin/brew shellenv)"` lines the installer prints, or run them yourself.
- If `git` triggers the "install command line developer tools" dialog, ask the user to click Install and wait for it to finish.

## Step 1. Packages (macOS)

```bash
brew install node git yt-dlp whisper-cpp ffmpeg-full
```

`ffmpeg-full` is keg-only (the plain `ffmpeg` formula lacks the `subtitles` and `drawtext` filters). Put it first on PATH for future sessions:

```bash
grep -q "ffmpeg-full/bin" ~/.zshrc 2>/dev/null || printf '\n# Full FFmpeg (libass, drawtext) for video editing\nexport PATH="%s/opt/ffmpeg-full/bin:$PATH"\n' "$(brew --prefix)" >> ~/.zshrc
```

In this session `.zshrc` is not reloaded, so prefix commands that need FFmpeg with `export PATH="$(brew --prefix)/opt/ffmpeg-full/bin:$PATH";`. Check both filters and that `node -v` is 22 or newer:

```bash
export PATH="$(brew --prefix)/opt/ffmpeg-full/bin:$PATH"; which ffmpeg ffprobe; ffmpeg -hide_banner -filters 2>/dev/null | grep -E " (subtitles|drawtext) "; node -v
```

## Step 2. Whisper model

Pick the model by memory:
- **16 GB RAM or more:** `ggml-large-v3-turbo.bin`, about 1.6 GB, best quality.
- **8 GB RAM or a slow connection:** `ggml-large-v3-turbo-q5_0.bin`, about 550 MB, nearly the same quality.

```bash
cd "$W" && mkdir -p models
RAM=$(( $(sysctl -n hw.memsize) / 1073741824 ))
if [ "$RAM" -ge 16 ]; then M=ggml-large-v3-turbo.bin; else M=ggml-large-v3-turbo-q5_0.bin; fi
curl -L --fail -C - -o "models/$M" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$M" && ls -lh models
```

Run the download in the background if your tool supports it. Tell the user it is the longest step.

## Step 3. The kit, installed into the workspace itself

`git clone` refuses a non-empty folder, and `models/` already exists. So (if a copy of SETUP.md lies in the folder, delete it first: the kit has its own):

```bash
cd "$W"
git init -q -b main
git remote add origin https://github.com/ai-camp-ua/ai-camp-video-edit-kit.git
git fetch -q --depth 1 origin main
git checkout -q -t origin/main
printf 'CLAUDE.local.md\n' >> .git/info/exclude
export PATH="$(brew --prefix)/opt/ffmpeg-full/bin:$PATH"
npm ci && npm run setup && npm test
npx hyperframes doctor
```

- If the safety layer blocks `npm ci` as third-party code, tell the user this is the kit's own open-source code and ask them to allow it.
- `npm warn` lines about install scripts are harmless.
- In `hyperframes doctor`, ✗ on Docker or MusicGen is not needed for editing. HyperFrames downloads its own render browser on first render.
- No API keys are needed: transcription is local.

## Step 4. Global HyperFrames skills

```bash
cd "$HOME" && npx -y hyperframes@latest skills update hyperframes hyperframes-cli hyperframes-registry media-use && ls ~/.claude/skills
```

These always match the newest HyperFrames. `hyperframes-registry` holds the hook effects catalog. The kit's own editing skills live in `$W/.claude/skills`.

## Step 5. Local notes for future sessions

The kit's `CLAUDE.md` already covers Ukrainian replies, local transcription, fonts and the user's style. Write `$W/CLAUDE.local.md` only with this computer's details. Fill in the real paths:

```markdown
# Local setup (this computer)

- FFmpeg: use `<brew prefix>/opt/ffmpeg-full/bin/ffmpeg` (full build with subtitles/drawtext) if `ffmpeg` on PATH lacks those filters.
- Whisper model: `<W>/models/<model file>` (found automatically by `npm run transcribe`).
- References: download with `yt-dlp <link>` into the video's `refs/` folder. If a link fails (private account), ask the user to send the file.
- Each new video gets its own folder via `npm run new-video -- <slug>` (reel-01, reel-02…). Footage goes into its `assets/`, references into `refs/`. Never move or modify originals.
```

## Step 6. Smoke test

Check the results, not only exit codes. Run from `$W`.

```bash
cd "$W" && export PATH="$(brew --prefix)/opt/ffmpeg-full/bin:$PATH"
T=$(mktemp -d)

# Whisper through the kit: a Ukrainian phrase with a pause, then silence cutting
say -v Lesya -o "$T/a.aiff" "Привіт! Це тестове відео." && say -v Lesya -o "$T/b.aiff" "Ґанок, їжак, єнот."
ffmpeg -y -loglevel error -i "$T/a.aiff" -f lavfi -t 2 -i anullsrc=r=22050:cl=mono -i "$T/b.aiff" \
  -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1[a]" -map "[a]" "$T/voice.wav"
ffmpeg -y -loglevel error -f lavfi -i color=c=gray:s=1080x1920:r=30 -i "$T/voice.wav" -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac "$T/raw.mp4"
npm run transcribe -- "$T/raw.mp4" && node .claude/skills/cut-silences/scripts/cut-silences.mjs "$T/raw.json" --video "$T/raw.mp4" --apply --output "$T/cut.mp4" > /dev/null && ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/raw.mp4" "$T/cut.mp4"

# FFmpeg subtitles
printf '1\n00:00:00,000 --> 00:00:03,000\nҐанок, їжак, єнот\n' > "$T/s.srt"
ffmpeg -y -loglevel error -i "$T/cut.mp4" -vf "subtitles=$T/s.srt:force_style='FontSize=18'" -t 3 "$T/sub.mp4" && ffmpeg -y -loglevel error -ss 1 -i "$T/sub.mp4" -frames:v 1 "$T/sub.png"

# yt-dlp: metadata only
yt-dlp --simulate --print "%(title)s | %(duration)ss" "https://www.youtube.com/watch?v=jNQXAC9IVRw"

# Fonts and HyperFrames: render the Ukrainian letters check
npm run -s font-check -- "Bebas Neue" Montserrat
npm run -s new-video -- ua-check && cp examples/ua-check/index.html video-projects/ua-check/
cd video-projects/ua-check && npx hyperframes lint && npx hyperframes render --quality draft --output renders/ua-check.mp4 \
  && ffmpeg -y -loglevel error -ss 1.5 -i renders/ua-check.mp4 -frames:v 1 "$T/ua.png"; echo "$T"
```

- The transcript must contain the Ukrainian words, and `cut.mp4` must be about 1.5 s shorter than `raw.mp4`.
- Open `sub.png` and `ua.png` yourself. Every ґ ї є і must be drawn in the same style as the rest of its line, with no letter from a different font.
- If the HyperFrames render stalls near the end, run it once more.
- Afterwards delete `$T` and `$W/video-projects/ua-check`.

## Step 7. Report

Show one table:
- tool, version, test result (✓ or ✗);
- what to do for each ✗;
- a separate group listing the items that are not needed for editing (Docker, MusicGen, the `.env` keys), so they cause no worry.

Then tell the user:
- setup is finished;
- they should open a **new chat in this same environment**, because the editing skills and the PATH change load in a new chat;
- that is where they edit: drop a video into the chat and describe what they want.

---

## Windows (untested in practice: go carefully and verify each step)

Use PowerShell. Install the packages:

```powershell
winget install --accept-package-agreements --accept-source-agreements OpenJS.NodeJS.LTS Git.Git Gyan.FFmpeg yt-dlp.yt-dlp
```

Open a new PowerShell afterwards so PATH refreshes.

- **FFmpeg:** `Gyan.FFmpeg` is a full build with `libass`. Check with `ffmpeg -hide_banner -filters | findstr subtitles`.
- **whisper.cpp:** download the latest Windows x64 release archive from https://github.com/ggml-org/whisper.cpp/releases and unpack it into `$W\whisper` (the kit finds `whisper\whisper-cli.exe` there).
- **Model:** same files and RAM rule as Step 2, saved into `$W\models` (`curl.exe -L -o ...`).
- **Steps 3–5:** the same commands work in PowerShell. Skip the `brew` and `.zshrc` parts. In `CLAUDE.local.md`, write the Windows paths.
- **Test:** for the Whisper test, use any short voice recording instead of `say`.
