/**
 * 轮询 ESPN 德乙 scoreboard，检测 SV 07 Elversberg vs Eintracht Braunschweig 比分变化并弹出系统通知。
 * 运行: node score-notify.js
 * 若该场在德甲，将 SCOREBOARD_URL 中的 ger.2 改为 ger.1。
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const notifier = require('node-notifier');

const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.2/scoreboard';
const POLL_INTERVAL_MS = 20 * 1000; // 20 秒

const TARGET_MATCH_LABEL = 'SV 07 Elversberg vs Eintracht Braunschweig';

function isTargetMatch(event) {
  const name = (event.name || '').toLowerCase();
  const short = (event.shortName || '').toLowerCase();
  const text = name + ' ' + short;
  const hasElversberg = text.includes('elversberg');
  const hasBraunschweig = text.includes('braunschweig');
  return hasElversberg && hasBraunschweig;
}

function getScoreFromEvent(event) {
  const comp = event.competitions?.[0];
  if (!comp?.competitors?.length) return null;
  const home = comp.competitors.find((c) => c.homeAway === 'home');
  const away = comp.competitors.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;
  const homeName = home.team?.displayName || home.team?.name || 'Home';
  const awayName = away.team?.displayName || away.team?.name || 'Away';
  const scoreStr = `${home.score}-${away.score}`;
  return { scoreStr, homeName, awayName, status: comp.status };
}

async function fetchScoreboard() {
  const res = await fetch(SCOREBOARD_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function runNotification(current) {
  const message = `${current.homeName} ${current.scoreStr.replace('-', ' - ')} ${current.awayName}`;
  notifier.notify({ title: '比分变化', message });
  console.log(`[通知] ${message}`);
}

async function poll(lastScore) {
  try {
    const data = await fetchScoreboard();
    const events = data.events || [];
    const event = events.find(isTargetMatch);
    if (!event) {
      console.log('[轮询] 未找到目标场次 (' + TARGET_MATCH_LABEL + ')');
      return lastScore;
    }
    const current = getScoreFromEvent(event);
    if (!current) {
      console.log('[轮询] 无法解析比分');
      return lastScore;
    }
    const detail = event.competitions?.[0]?.status?.displayClock ?? '';
    console.log(`[轮询] ${current.homeName} ${current.scoreStr} ${current.awayName} ${detail}`);

    if (lastScore !== null && lastScore !== current.scoreStr) {
      runNotification(current);
    }
    return current.scoreStr;
  } catch (err) {
    console.error('[轮询] 请求失败:', err.message);
    return lastScore;
  }
}

async function main() {
  console.log('ESPN 比分变化提醒已启动，监控', TARGET_MATCH_LABEL + '，每', POLL_INTERVAL_MS / 1000, '秒轮询一次。Ctrl+C 退出。\n');
  let lastScore = null;
  for (;;) {
    lastScore = await poll(lastScore);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main();
