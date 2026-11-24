// Find the whisper.cpp command line tool on macOS, Linux or Windows.
// Order: WHISPER_CLI, whisper-cli on PATH, Homebrew, then the Windows release
// archive unpacked into <kit>/whisper (it holds a Release/ folder).
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

export function findWhisper(root) {
  const candidates = [
    process.env.WHISPER_CLI,
    'whisper-cli',
    '/opt/homebrew/bin/whisper-cli',
    '/usr/local/bin/whisper-cli',
    join(root, 'whisper', 'Release', 'whisper-cli.exe'),
    join(root, 'whisper', 'whisper-cli.exe'),
  ].filter(Boolean);
  return candidates.find((b) => spawnSync(b, ['--help'], { stdio: 'ignore', windowsHide: true }).status === 0) || null;
}
