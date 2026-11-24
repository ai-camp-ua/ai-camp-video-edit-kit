# AI CAMP video-edit kit

Кіт для монтажу відео з **Claude Code** або Codex: вертикальних (Reels, Shorts,
TikTok) і горизонтальних (YouTube). Записуєш себе на камеру, кидаєш файл, а Claude ріже паузи й дублі, робить
субтитри, хуки, графіку, музику й звук і рендерить готове відео.

Працює з будь-якою мовою: мова відео задається один раз під час встановлення.
Транскрипція локально через Whisper (безкоштовно, нічого не вивантажується), а
шрифти перевіряються на всі літери мови: кирилиця (ґ ї є і, ё ы э ъ), польські,
турецькі тощо.

## Що всередині

- **Скіли монтажу:** рілс від сирого запису до готового відео (`short-form-edit`),
  довгі відео (`edit-video`), різання пауз (`cut-silences`) і дублів (`cut-mistakes`),
  сторітелінг, моушн-графіка, шоуріли.
- **Ефекти для хуків** з каталогу HyperFrames (`hyperframes-registry`).
- **406 карток графіки** у двох стилях, з токенами кольорів і шрифтів.
- **Свій стиль:** `MY-STYLE.md`. Скидаєш 4–5 рілсів, які подобаються, кажеш, що
  саме в кожному подобається, і Claude збирає з цього твій стиль.
- **Шрифти:** набір з HyperFrames, перевірка літер мови (`npm run font-check`) і
  таблиця заміни для шрифтів без кирилиці ([docs/FONTS.md](docs/FONTS.md)).
- **Формати:** 9:16, 16:9, 1:1, 4:5 з правилами розмітки для кожного
  ([docs/FORMATS.md](docs/FORMATS.md)). Довгі записи транскрибуються шматками.
- Інструменти: транскрипція, різання, перевірка таймінгу, preflight.

## Встановлення

Найпростіше: перетягни `SETUP.md` у чат Claude Code, і він усе поставить сам.

Вручну (macOS): потрібні Node.js 22+, Git, FFmpeg, whisper.cpp і Chrome.

```sh
brew install node git ffmpeg-full whisper-cpp yt-dlp
git clone https://github.com/ai-camp-ua/ai-camp-video-edit-kit.git ai-camp-video-edit-kit
cd ai-camp-video-edit-kit
npm ci
npm run setup -- --lang uk    # мова відео: uk, ru, en, pl…
npm test
npx hyperframes skills update
```

Модель Whisper (`ggml-large-v3-turbo.bin` або легша `ggml-large-v3-turbo-q5_0.bin`)
кладеться в папку `models/` поруч із кітом або всередині нього.

## Як монтувати

```sh
npm run new-video -- my-reel                    # 9:16
npm run new-video -- my-lesson --format 16:9    # YouTube
```

Поклади запис у `video-projects/my-reel/assets/raw.mp4` і скажи Claude:

> Змонтуй рілс з video-projects/my-reel/assets/raw.mp4 у моєму стилі.
> Прибери паузи й дублі, запропонуй 3–4 хуки, зроби субтитри. Покажи чернетку.

Окремі кроки: `npm run transcribe -- <відео>` (текст зі словами й таймінгом),
скіли `cut-silences`, `cut-mistakes`, `short-form-edit`.
Детально: [docs/WORKFLOW.md](docs/WORKFLOW.md), [docs/SHORT-FORM.md](docs/SHORT-FORM.md).

## Перший тестовий рендер

```sh
npm run demo
cd video-projects/demo
npx hyperframes render --quality draft --output renders/demo.mp4
```

## Корисне

| Що | Де |
| --- | --- |
| Правила якості монтажу | [docs/EDITING-PLAYBOOK.md](docs/EDITING-PLAYBOOK.md) |
| Шрифти й кирилиця | [docs/FONTS.md](docs/FONTS.md) |
| Платні сервіси (необов'язково) | [docs/TOOLS-AND-API-KEYS.md](docs/TOOLS-AND-API-KEYS.md) |
| Інструкція для Claude | [AGENTS.md](AGENTS.md) (CLAUDE.md підтягує її) |
| Бібліотека карток | [style-library/GUIDE.md](style-library/GUIDE.md) |
| Шаблони сцен | [style-templates/README.md](style-templates/README.md) |
| Проблеми з установкою | [docs/SETUP.md](docs/SETUP.md) |

## Ліцензія

MIT ([LICENSE](LICENSE)). Рендер на [HyperFrames](https://github.com/heygen-com/hyperframes) (Apache-2.0).
Сторонні ресурси: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
