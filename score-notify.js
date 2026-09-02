#!/usr/bin/env node
/**
 * GoalAlert - desktop notifications when the score of a football match changes.
 *
 * Polls the (unofficial) ESPN scoreboard API. No API key required.
 *
 *   node score-notify.js --league ger.2 --match elversberg,braunschweig
 *   node score-notify.js --league eng.1 --match arsenal --interval 30
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);

export const DEFAULTS = { league: 'ger.2', match: 'elversberg,braunschweig', interval: 20 };

const HELP = `GoalAlert - desktop notifications when a football score changes.

Usage: node score-notify.js [options]

Options:
  --league <code>     ESPN league code (default: ${DEFAULTS.league}).
                      Examples: ger.1, ger.2, eng.1, esp.1, ita.1, fra.1, aus.1, tur.1
  --match <keywords>  Comma-separated keywords that must ALL appear in the event
                      name, case-insensitive (default: ${DEFAULTS.match})
  --interval <sec>    Poll interval in seconds, minimum 5 (default: ${DEFAULTS.interval})
  --once              Fetch once, print the current score and exit
  -h, --help          Show this help
`;

export function scoreboardUrl(league) {
  return `https://site.api.espn.com/apis/site/v2/sports/soccer/${encodeURIComponent(league)}/scoreboard`;
}

export function parseKeywords(match) {
  return String(match)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isTargetMatch(event, keywords) {
  const text = `${event?.name ?? ''} ${event?.shortName ?? ''}`.toLowerCase();
  return keywords.length > 0 && keywords.every((k) => text.includes(k));
}

export function getScoreFromEvent(event) {
  const comp = event?.competitions?.[0];
  if (!comp?.competitors?.length) return null;
  const home = comp.competitors.find((c) => c.homeAway === 'home');
  const away = comp.competitors.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;
  const nameOf = (t) => t.team?.displayName || t.team?.name || t.homeAway;
  return {
    homeName: nameOf(home),
    awayName: nameOf(away),
    scoreStr: `${home.score}-${away.score}`,
    clock: comp.status?.displayClock ?? '',
    state: comp.status?.type?.description ?? '',
  };
}

export function formatScore(score) {
  return `${score.homeName} ${score.scoreStr.replace('-', ' - ')} ${score.awayName}`;
}

async function fetchScoreboard(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function desktopNotify(message) {
  const notifier = require('node-notifier');
  notifier.notify({ title: 'GoalAlert', message });
}

/**
 * One polling step. Returns the score string to remember for the next step.
 * I/O is injectable so the logic can be unit-tested without network or notifications.
 */
export async function pollOnce({
  url,
  keywords,
  lastScore,
  fetchFn = fetchScoreboard,
  notifyFn = desktopNotify,
  log = console.log,
}) {
  const data = await fetchFn(url);
  const event = (data.events || []).find((e) => isTargetMatch(e, keywords));
  if (!event) {
    log(`[poll] no event matching "${keywords.join(', ')}"`);
    return lastScore;
  }
  const current = getScoreFromEvent(event);
  if (!current) {
    log('[poll] could not parse score');
    return lastScore;
  }
  log(`[poll] ${formatScore(current)} ${current.clock} ${current.state}`.trim());
  if (lastScore !== null && lastScore !== current.scoreStr) {
    notifyFn(formatScore(current));
    log(`[notify] ${formatScore(current)}`);
  }
  return current.scoreStr;
}

export function parseCli(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      league: { type: 'string', default: DEFAULTS.league },
      match: { type: 'string', default: DEFAULTS.match },
      interval: { type: 'string', default: String(DEFAULTS.interval) },
      once: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const interval = Number(values.interval);
  if (!Number.isFinite(interval) || interval < 5) {
    throw new Error('--interval must be a number >= 5');
  }
  const keywords = parseKeywords(values.match);
  if (keywords.length === 0) throw new Error('--match needs at least one keyword');
  return { ...values, interval, keywords };
}

async function main() {
  let opts;
  try {
    opts = parseCli(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    console.error(HELP);
    process.exit(2);
  }
  if (opts.help) {
    console.log(HELP);
    return;
  }
  const url = scoreboardUrl(opts.league);
  console.log(
    `GoalAlert: watching "${opts.keywords.join(', ')}" in ${opts.league}, ` +
      `polling every ${opts.interval}s. Press Ctrl+C to quit.\n`,
  );
  let lastScore = null;
  for (;;) {
    try {
      lastScore = await pollOnce({ url, keywords: opts.keywords, lastScore });
    } catch (err) {
      console.error('[poll] request failed:', err.message);
    }
    if (opts.once) return;
    await new Promise((resolve) => setTimeout(resolve, opts.interval * 1000));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
