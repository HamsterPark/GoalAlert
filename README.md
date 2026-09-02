# GoalAlert

[![CI](https://github.com/HamsterPark/GoalAlert/actions/workflows/ci.yml/badge.svg)](https://github.com/HamsterPark/GoalAlert/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D18.17-brightgreen)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Get a desktop notification whenever the score of the football match you are watching changes.
Polls the public ESPN scoreboard; no API key, no account, one dependency.

监控指定足球比赛的比分，有变化时弹出系统通知。轮询 ESPN 记分板，无需 API Key。

- Works on Windows, macOS and Linux (native notifications via [node-notifier](https://github.com/mikaelbr/node-notifier))
- Any league ESPN covers, any match, chosen from the command line
- Single ~150-line script with unit tests

## Install

```bash
git clone https://github.com/HamsterPark/GoalAlert.git
cd GoalAlert
npm install
```

Requires Node.js 18.17 or newer.

## Usage

```bash
# default: SV 07 Elversberg vs Eintracht Braunschweig, 2. Bundesliga, every 20 s
node score-notify.js

# any other match: league code + keywords that must all appear in the fixture name
node score-notify.js --league eng.1 --match arsenal,chelsea --interval 30

# check the current score once and exit
node score-notify.js --league esp.1 --match barcelona --once
```

On Windows you can also double-click `start.bat`. Press Ctrl+C to stop.

| Option | Meaning | Default |
|---|---|---|
| `--league <code>` | ESPN league code | `ger.2` |
| `--match <keywords>` | comma-separated keywords, all must match the fixture name (case-insensitive) | `elversberg,braunschweig` |
| `--interval <sec>` | polling interval in seconds (minimum 5) | `20` |
| `--once` | fetch once, print the score, exit | off |

Common league codes: `ger.1` Bundesliga, `ger.2` 2. Bundesliga, `eng.1` Premier League,
`esp.1` La Liga, `ita.1` Serie A, `fra.1` Ligue 1, `aus.1` A-League, `tur.1` Süper Lig.
For others, look at the `league/xxx` segment of an ESPN soccer scoreboard URL.

## How it works

Every `--interval` seconds the script fetches `site.api.espn.com/.../soccer/<league>/scoreboard`,
finds the first event whose name contains all your keywords, and compares the `home-away` score
with the previous poll. On a change it fires a system notification and logs the new score.
The first poll only records the score, so starting the script mid-match does not trigger a
spurious alert.

## Development

```bash
npm test          # node:test unit tests (no network, no notifications)
```

The polling step takes injectable `fetch` and `notify` functions, so the logic is tested
against fixture events without touching the network.

## Limitations

- The ESPN scoreboard endpoint is unofficial and undocumented; it may change or rate-limit without notice.
- Only the first fixture matching your keywords is watched. Use enough keywords to make it unique.
- Notifications depend on the OS notification centre being enabled for the terminal / Node.

## License

MIT
