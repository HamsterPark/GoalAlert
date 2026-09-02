import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getScoreFromEvent,
  isTargetMatch,
  parseCli,
  parseKeywords,
  pollOnce,
  scoreboardUrl,
} from '../score-notify.js';

const event = (home, away, homeScore, awayScore) => ({
  name: `${home} at ${away}`,
  shortName: 'HOM v AWY',
  competitions: [
    {
      competitors: [
        { homeAway: 'home', score: String(homeScore), team: { displayName: home } },
        { homeAway: 'away', score: String(awayScore), team: { displayName: away } },
      ],
      status: { displayClock: "45'", type: { description: 'In Progress' } },
    },
  ],
});

test('parseKeywords lowercases, trims and drops empties', () => {
  assert.deepEqual(parseKeywords(' Elversberg, Braunschweig ,'), ['elversberg', 'braunschweig']);
});

test('isTargetMatch requires every keyword', () => {
  const e = event('SV Elversberg', 'Eintracht Braunschweig', 0, 0);
  assert.equal(isTargetMatch(e, ['elversberg', 'braunschweig']), true);
  assert.equal(isTargetMatch(e, ['elversberg', 'bayern']), false);
  assert.equal(isTargetMatch(e, []), false);
});

test('getScoreFromEvent parses home and away', () => {
  const s = getScoreFromEvent(event('Home FC', 'Away FC', 2, 1));
  assert.equal(s.scoreStr, '2-1');
  assert.equal(s.homeName, 'Home FC');
  assert.equal(s.awayName, 'Away FC');
  assert.equal(s.clock, "45'");
  assert.equal(getScoreFromEvent({}), null);
});

test('pollOnce notifies only when the score changes', async () => {
  const notifications = [];
  const feed = (h, a) => async () => ({ events: [event('Alpha', 'Beta', h, a)] });
  const base = { url: 'x', keywords: ['alpha'], notifyFn: (m) => notifications.push(m), log: () => {} };

  let last = await pollOnce({ ...base, lastScore: null, fetchFn: feed(0, 0) });
  assert.equal(last, '0-0');
  assert.equal(notifications.length, 0, 'first poll only records the score');

  last = await pollOnce({ ...base, lastScore: last, fetchFn: feed(0, 0) });
  assert.equal(notifications.length, 0, 'unchanged score is silent');

  last = await pollOnce({ ...base, lastScore: last, fetchFn: feed(1, 0) });
  assert.equal(last, '1-0');
  assert.deepEqual(notifications, ['Alpha 1 - 0 Beta']);
});

test('pollOnce keeps the last score when the match is not on the board', async () => {
  const last = await pollOnce({
    url: 'x',
    keywords: ['zzz'],
    lastScore: '1-1',
    fetchFn: async () => ({ events: [] }),
    notifyFn: () => assert.fail('must not notify'),
    log: () => {},
  });
  assert.equal(last, '1-1');
});

test('parseCli applies defaults and validates input', () => {
  const o = parseCli([]);
  assert.equal(o.league, 'ger.2');
  assert.equal(o.interval, 20);
  assert.deepEqual(o.keywords, ['elversberg', 'braunschweig']);
  assert.equal(parseCli(['--league', 'eng.1', '--match', 'Arsenal']).keywords[0], 'arsenal');
  assert.throws(() => parseCli(['--interval', '1']), /interval/);
  assert.throws(() => parseCli(['--match', ' , ']), /keyword/);
});

test('scoreboardUrl builds the ESPN endpoint', () => {
  assert.match(scoreboardUrl('ger.1'), /\/soccer\/ger\.1\/scoreboard$/);
});
