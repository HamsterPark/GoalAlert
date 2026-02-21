# GoalAlert

**中文**  
监控指定足球比赛比分，有变化时在桌面弹窗提醒。轮询 [ESPN](https://www.espn.com/) scoreboard，无需 API Key。

**English**  
Get desktop notifications when the score of your watched football match changes. Polls ESPN scoreboard; no API key required.

- No API key
- Windows / macOS / Linux（系统原生通知 / native OS notifications）
- 单文件脚本，依赖仅 `node-notifier` / Single script, only depends on `node-notifier`

---

## 环境要求 / Requirements

**中文**  
- Node.js 18+  
- 网络可访问 `site.api.espn.com`

**English**  
- Node.js 18+  
- Network access to `site.api.espn.com`

---

## 安装 / Install

**中文**
```bash
git clone <你的仓库地址>
cd GoalAlert
npm install
```

**English**
```bash
git clone <your-repo-url>
cd GoalAlert
npm install
```

---

## 使用 / Usage

**中文**  
命令行运行：`node score-notify.js`  
Windows 下可双击 `启动比分提醒.bat` 启动，按 Ctrl+C 结束。

**English**  
Run: `node score-notify.js`  
On Windows you can double-click `启动比分提醒.bat` to start; press Ctrl+C to exit.

```bash
node score-notify.js
```

---

## 监控哪场比赛？/ Which match is watched?

**中文**  
当前默认监控：**SV 07 Elversberg vs Eintracht Braunschweig**（德乙）。  

要改成其他场次，编辑 `score-notify.js`：  
1. **联赛** — 修改 `SCOREBOARD_URL` 中的联赛代码（见下方示例）。  
2. **场次** — 修改 `TARGET_MATCH_LABEL` 和 `isTargetMatch(event)`，按主客队名或缩写匹配目标场次。

**English**  
Default watched match: **SV 07 Elversberg vs Eintracht Braunschweig** (2. Bundesliga).  

To watch another match, edit `score-notify.js`:  
1. **League** — Change the league code in `SCOREBOARD_URL` (examples below).  
2. **Match** — Update `TARGET_MATCH_LABEL` and `isTargetMatch(event)` to match your home/away team names or abbreviations.

**联赛代码示例 / League code examples**  
| 联赛 League | 代码 Code |
|------------|-----------|
| 德甲 Bundesliga | `ger.1` |
| 德乙 2. Bundesliga | `ger.2` |
| 英超 Premier League | `eng.1` |
| 西甲 La Liga | `esp.1` |
| 意甲 Serie A | `ita.1` |
| 法甲 Ligue 1 | `fra.1` |
| 澳超 A-League | `aus.1` |
| 土超 Süper Lig | `tur.1` |

更多联赛可参考 ESPN 足球 scoreboard 页面 URL 中的 `league/xxx`。  
For more leagues, check the `league/xxx` segment in ESPN soccer scoreboard URLs.

---

## 技术说明 / Technical notes

**中文**  
- 数据来源：ESPN 非官方 scoreboard API（`site.api.espn.com`），仅轮询使用，不保证长期稳定性。  
- 轮询间隔：默认 20 秒，可修改脚本中的 `POLL_INTERVAL_MS`。  
- 通知：通过 [node-notifier](https://github.com/mikaelbr/node-notifier) 调用系统通知（如 Windows 右下角 Toast、macOS 通知中心）。

**English**  
- Data: ESPN unofficial scoreboard API (`site.api.espn.com`); polling only, no long-term stability guarantee.  
- Poll interval: 20 seconds by default; change `POLL_INTERVAL_MS` in the script.  
- Notifications: via [node-notifier](https://github.com/mikaelbr/node-notifier) (e.g. Windows Toast, macOS Notification Center).

---

## License

MIT
