# Leonida Ledger

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/vinnvv/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/vinnvv/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

Leonida Ledger is an offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5. Referral code: `9j79nw8m`.

## What it does

- Every trophy with its official name, description and grade, exactly as PlayStation publishes them.
- A guide for each trophy, written in our own words, with its sources named beside it: PowerPyx, GTABase, Exophase, PSNProfiles and Planet GTA 6. Four trophies have no confirmed method yet as of 19 November 2026, and their guides say so instead of guessing.
- A roadmap to the platinum in 3 steps (about 200 hours, difficulty 4 out of 10, one playthrough), built from the PowerPyx roadmap.
- One possibly missable trophy flagged: Positive Mental Attitude, the Chapter 1 meditation.
- A checklist that saves progress in the browser (localStorage), with export to a file and import back.
- Filters by kind (story, missable, collectibles, activities, crime, strangers, odd ones, online), by grade and by status, plus search.
- A spoiler setting that hides hidden trophies until they are earned. There are no online trophies: all 55 are single-player.

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The app loads nothing from the network; everything is a file under `app/`.

## What is inside

- `app/index.html` and `app/style.css`: the guide page and its ledger look.
- `app/app.js`: the tracker: checklist, filters, spoiler setting, detail panel, export and import.
- `app/data/trophies.json`: all 55 trophies with official names, descriptions, grades, hidden flags, kinds, missable flags, roadmap stages, guides and sources.
- `main.ts`: copies `app/` and `screenshots/` to `/output` and writes the dossier with the vendored make.fun library.

## License

MIT. See `LICENSE`.
