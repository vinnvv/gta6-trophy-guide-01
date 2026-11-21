# Leonida Ledger

[![Leonida Ledger on make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/vinnvv/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/vinnvv/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. It shows every trophy with its official name, description and grade, a guide in our own words with its sources named, a three-step roadmap to the platinum, a stylised neon map of Leonida, and a checklist that saves your progress in your own browser.

## The trophies

55 trophies in total: 1 platinum, 2 gold, 6 silver and 46 bronze. 28 of them are hidden on PlayStation until earned, so the guide hides their names and descriptions too, unless you switch spoilers on or tick one off as earned. There are no online trophies: all 55 are single-player, and one playthrough is enough.

## The roadmap

PowerPyx rates the set 4 out of 10 in difficulty and about 200 hours.

1. **Play the story** (60 to 80 hours): finish the five chapters and take the optional missions as they appear. Do the Chapter 1 meditation at Jason's house when Lucia offers it, it is the one trophy that can be missed: Positive Mental Attitude.
2. **The 100 percent checklist** (about 100 hours): after the story the checklist opens under Progress, Stats, 100% Completion. It is lenient, closer to 60 percent true completion, and nothing on it is missable.
3. **Strangers and cleanup** (about 10 hours): finish the 8 Strangers and Freaks strands that count and the character questlines, then sweep up whatever is left.

One trophy is missable (Positive Mental Attitude), there are 0 online trophies, and the run takes 1 playthrough.

## How to open it

No build step and no network. Serve the `app` folder with any static file server, for example:

```sh
cd app
python3 -m http.server 8000
```

Then open http://localhost:8000 in a desktop browser. The guide loads its trophy list from `app/data/trophies.json` on the same server and never reaches for the network. Your checklist is stored only in your browser's localStorage, and you can export it as JSON and import it back from the filters bar.

## Sources

The trophy names, descriptions and grades follow the official list as published on PlayStation Network, cross-checked against Exophase, PSNProfiles and TrueAchievements. The guides are written in our own words and cite their sources beside each one, mainly the PowerPyx GTA 6 Trophy Guide and Roadmap and the GTABase trophy list. Where no source has confirmed a method yet, the guide says so plainly instead of guessing.

Leonida Ledger is an unofficial fan guide. Grand Theft Auto, GTA and GTA VI are trademarks of Rockstar Games. No Rockstar logo or official artwork is used here.
