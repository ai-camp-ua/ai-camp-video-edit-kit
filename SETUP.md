# SETUP: local video-editing workspace for Claude Code

You are setting up a workspace for editing videos (Reels, Shorts, TikTok, YouTube) with Claude Code.
The user is not a programmer. Talk to them in the language they write in, in plain words, in every message including short progress notes. Never ask them to edit files or type commands, except where noted (a Mac password, which only they may enter).
Verify every step by running a command and reading its output, not by assuming. If a step fails, explain why in one or two sentences and fix it before moving on.

## Video language

Before installing, settle the language of the user's videos as a two-letter code (`LANG` below: `uk`, `ru`, `en`, `pl`…). Usually it is the language they write to you in; if that is not obvious (for example they write in one language but may record in another), ask one short question. Use `auto` only if they record in several languages. It is saved once in Step 3 and used for transcription and font checks.

## Target

Everything is installed into **the folder this session is open in** (the workspace, below `$W`). Editing later happens in this same folder, so do not create a nested project folder.

```bash
W="$(pwd)"; echo "$W"; ls -A "$W"
```

Stop and ask the user to create a separate folder (for example `~/VideoEditing`) and reopen the session with it if `$W` is any of:
- the home folder;
- a folder whose name ends with a dot or a space (it breaks on Windows and is easy to confuse);
- Desktop, Documents or Downloads, or anything inside iCloud Drive;
- a folder that already holds unrelated files.

A `.DS_Store` file, or a copy of SETUP.md in the folder, is fine.

Shell variables do not survive between tool calls. Re-define `W` or use the absolute path in each command.

What gets installed:

| Tool | Purpose |
|---|---|
| FFmpeg (full build, `ffmpeg-full`) | cutting, joining, colour, audio, burned-in subtitles |
| whisper.cpp + `ggml-large-v3-turbo` | local word-level transcription, ~100 languages |
| yt-dlp | downloading reference videos from Instagram, YouTube or TikTok links |
| Node.js 22+ | runtime for HyperFrames and the kit |
| AI CAMP video-edit kit (`https://github.com/ai-camp-ua/ai-camp-video-edit-kit.git`) | editing skills, styles, formats 9:16 and 16:9, font checks for the video's language, local transcription |
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
npm ci && npm run setup -- --lang LANG && npm test
npx hyperframes doctor
```

- If the safety layer blocks `npm ci` as third-party code, tell the user this is the kit's own open-source code and ask them to allow it.
- `npm warn` lines about install scripts (for example `esbuild`) are harmless; do not approve or deny them.
- In `hyperframes doctor`, ✗ on Docker, Kokoro TTS or MusicGen is not needed for editing. HyperFrames downloads its own render browser on first render.
- The kit pins a tested HyperFrames version. A notice that a newer version exists is expected; do not update and do not mention it.
- Replace `LANG` with the code from "Video language". Setup prints `Video language: …`; check it.
- No API keys are needed: transcription is local.

## Step 4. Global HyperFrames skills

```bash
cd "$W" && npx hyperframes skills update hyperframes hyperframes-cli hyperframes-registry media-use && ls ~/.claude/skills
```

Run from `$W`, they match the kit's HyperFrames version exactly. `hyperframes-registry` holds the hook effects catalog. The kit's own editing skills live in `$W/.claude/skills`.

## Step 5. Local notes for future sessions

The kit's `CLAUDE.md` already covers replies in the user's language, local transcription, formats, fonts and the user's style. Write `$W/CLAUDE.local.md` only with this computer's details. Fill in the real paths:

```markdown
# Local setup (this computer)

- FFmpeg: use `<brew prefix>/opt/ffmpeg-full/bin/ffmpeg` (full build with subtitles/drawtext) if `ffmpeg` on PATH lacks those filters.
- Whisper model: `<W>/models/<model file>` (found automatically by `npm run transcribe`).
- References: download with `yt-dlp <link>` into the video's `refs/` folder. If a link fails (private account), ask the user to send the file.
- Each new video gets its own folder via `npm run new-video -- <slug>` (reel-01, reel-02…; add `--format 16:9` for horizontal). Footage goes into its `assets/`, references into `refs/`. Never move or modify originals.
```

## Step 6. Smoke test

Check the results, not only exit codes. Run from `$W`, with `LANG` as in Step 3.

```bash
cd "$W" && export PATH="$(brew --prefix)/opt/ffmpeg-full/bin:$PATH"
T=$(mktemp -d)

# Transcription and silence cutting: a synthetic clip in the video's language (two sentences, 2 s pause)
node scripts/test-clip.mjs "$T" --lang LANG
npm run transcribe -- "$T/raw.mp4" && node -e "console.log(require(process.argv[1]).words.map(w=>w.text).join(' '))" "$T/raw.json"
node .claude/skills/cut-silences/scripts/cut-silences.mjs "$T/raw.json" --video "$T/raw.mp4" --apply --output "$T/cut.mp4" > "$T/cut.log" 2>&1 \
  || { tail -20 "$T/cut.log"; echo "CUT FAILED"; }
for f in raw cut; do printf "$f: "; ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/$f.mp4"; done

# FFmpeg subtitles with the language's letters
printf '1\n00:00:00,000 --> 00:00:03,000\n%s\n' "$(node -e "import('./scripts/lib/lang.mjs').then(m=>console.log(m.sampleFor('LANG')))")" > "$T/s.srt"
(cd "$T" && ffmpeg -y -loglevel error -i cut.mp4 -vf "subtitles=s.srt:force_style='FontSize=18'" -t 3 sub.mp4 && ffmpeg -y -loglevel error -ss 1 -i sub.mp4 -frames:v 1 sub.png)

# yt-dlp: metadata only
yt-dlp --simulate --print "%(title)s | %(duration)ss" "https://www.youtube.com/watch?v=jNQXAC9IVRw"

# Fonts and HyperFrames: one test frame per format
npm run -s font-check -- "Bebas Neue" Montserrat
npm run -s check-render -- --format 9:16
npm run -s check-render -- --format 16:9
echo "$T"
```

- `test-clip.mjs` prints the expected text. The transcript must match it apart from small spelling slips, in the same language, and `cut.mp4` must be about 1.5 s shorter than `raw.mp4`.
- If `test-clip.mjs` has no sentences or no voice for the language, pass two short sentences with `--text "…" "…"` or use any short voice recording with a pause.
- Open `sub.png` and both `renders/check.png` files that `check-render` prints. Every letter must be drawn, in the same style as the rest of its line; the 9:16 and 16:9 frames must be laid out for their shape.
- If a HyperFrames render stalls near the end, run it once more.
- Afterwards delete `$T` and the `video-projects/check-*` folders.

## Step 7. Report

Show one table:
- tool, version, test result (✓ or ✗);
- what to do for each ✗;
- a separate group listing the items that are not needed for editing (Docker, Kokoro TTS, MusicGen, the `.env` keys), so they cause no worry.

Then tell the user:
- setup is finished;
- they should open a **new chat in this same environment**, because the editing skills and the PATH change load in a new chat;
- that is where they edit: drop a video into the chat and describe what they want.

---

## Windows

Claude Code on Windows runs commands in Git Bash, so the steps above work as written, with these changes.

**Step 0.** System check:

```bash
cmd //c ver; echo "$PROCESSOR_ARCHITECTURE"; df -h "$HOME" | tail -1
echo "RAM GB: $(powershell.exe -NoProfile -Command '[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB)' | tr -d '\r')"
```

**Step 1.** Packages:

```bash
winget install --accept-package-agreements --accept-source-agreements OpenJS.NodeJS.LTS Git.Git Gyan.FFmpeg yt-dlp.yt-dlp DenoLand.Deno Microsoft.VCRedist.2015+.x64
```

- Windows may ask "Do you want to allow this app to make changes?" a few times. The user clicks Yes.
- "Already installed" lines are fine.
- `Gyan.FFmpeg` is a full build (subtitles, drawtext). `DenoLand.Deno` is what yt-dlp needs for YouTube links.

Programs installed now are not visible to this session yet. Save a line that picks them up, and from here on start every command with `source ~/.ai-camp-path.sh;`. After Claude Code restarts it is no longer needed.

```bash
cat > ~/.ai-camp-path.sh <<'EOF'
export PATH="$(cygpath -u -p "$(powershell.exe -NoProfile -Command '[Environment]::GetEnvironmentVariable("Path","User")+";"+[Environment]::GetEnvironmentVariable("Path","Machine")' | tr -d '\r')"):$PATH"
EOF
source ~/.ai-camp-path.sh; node -v; yt-dlp --version; ffmpeg -hide_banner -filters 2>/dev/null | grep -E " (subtitles|drawtext) "
```

whisper.cpp (the newest release that has a Windows build):

```bash
cd "$W" && source ~/.ai-camp-path.sh
U=$(curl -s "https://api.github.com/repos/ggml-org/whisper.cpp/releases?per_page=20" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{for(const r of JSON.parse(s))for(const a of r.assets)if(a.name==='whisper-bin-x64.zip'){console.log(a.browser_download_url);return}})")
curl -L --fail -o whisper.zip "$U" && powershell.exe -NoProfile -Command "Expand-Archive whisper.zip -DestinationPath whisper -Force" && rm whisper.zip
./whisper/Release/whisper-cli.exe --help 2>&1 | head -3
```

The kit finds `whisper/Release/whisper-cli.exe` by itself. If it prints nothing, the Visual C++ runtime is missing: run the winget line again.

**Step 2.** Same commands; replace the `RAM=` line with:

```bash
RAM=$(powershell.exe -NoProfile -Command '[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory/1GB)' | tr -d '\r')
```

**Steps 3–6.**
- Replace `export PATH="$(brew --prefix)/opt/ffmpeg-full/bin:$PATH"` with `source ~/.ai-camp-path.sh`.
- In `CLAUDE.local.md`, skip the FFmpeg line and write the Windows paths.
- `test-clip.mjs` uses Windows voices. Often only English is installed. If there is no voice for `LANG`, make the clip with `--lang en` and transcribe it with `npm run transcribe -- "$T/raw.mp4" --language en`. Or the user can add a voice in Settings → Time & language → Speech.
