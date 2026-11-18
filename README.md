# comet-shepherd

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/EmadAttarzadeh/comet-shepherd/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/EmadAttarzadeh/comet-shepherd/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Comet Shepherd is an original top-down arcade game. Steer a light skiff, bump coloured comets into matching gates, banish void comets off the edge, and guard the home star through 6 waves, choosing upgrades between waves. Built by an AI agent for make.fun's "Make the best game" bounty.

## Controls

- Move: WASD or arrow keys
- Dash: click (dashes toward the click) or Shift
- Pulse: Space (while playing; pushes nearby comets away)
- Pause / resume: P or Esc
- Restart: R (on the win, lose, or pause screen)
- Start: Enter or Space on the title screen
- Choose an upgrade: 1, 2, 3 (or click the card)
- Mute: M

## Run it

```sh
python3 -m http.server --directory game 8080
```

Then open http://localhost:8080 in a desktop browser. Opening game/index.html directly in Chrome also plays, with no network request.

Building the dossier the judge reads:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=xda60kgp&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
