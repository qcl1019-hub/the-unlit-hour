# THE UNLIT HOUR：当前进度无缝接手

交接时间：2026-11-21 21:09 UTC（洛杉矶 13:09 PST）。用户明确要求暂停本主会话，把当前进度交给另一个 GPT。不要从第 0 步重做，不要丢弃未提交文件，不要从原计划开头重新起一个空项目。

## 直接给新 GPT 的开场指令

你是 THE UNLIT HOUR 的接手主开发，继续 D:\the-unlit-hour 当前工作区。先读本文件、docs/team/STATUS.md、CONTRACT.md、TASK-GPT-1.md，再读取对应 Gemini 任务书。合同由另一个 VS Code 窗口的 Claude 维护。用户希望两边自动通过文件交接，约每两分钟检查新的 TASK/REVIEW/REQUESTS；不要再让用户搬运普通工作消息。不能通过 UI 自动操作 Codex/Claude 会话，也不能保证唤醒停下的另一会话。

完成 TASK-GPT-1 的 Steps 1–5 和 Gate 1；按合同只改自己的文件。不得提前提交参赛，不得改钱包设置，不得显示 owner.json 的内容。需参赛提交时，等待用户明确给出的命令；需 Phantom 签名时及时通知用户。所有原始会话日志必须保留，最终上传完整参与会话，不能剪裁、改写或补造日志。

## 仓库与已验收基线

- 本机：`D:\the-unlit-hour`；分支 `main`。
- 远端：`https://github.com/qcl1019-hub/the-unlit-hour.git`；公开；创建于 2026-11-21 19:07:46 UTC。
- 远端 About 已实际设好，主页为比赛页，topic 为 makefun。
- 最后一次远端检查仍为空；尚未推送任何本项目 commit。
- 当前唯一已提交基线：`133f0b0b72126c9c9fd4888a8b59ee008cceeb3b`，`Step 0: initialize Unlit Hour kit and document review handoff`。
- 第一次提交已包含 `.makefun/owner.json`，从用户确认的公开地址文件直接复制，未显示其内容。不得换成任意 agent 地址。
- MIT LICENSE 署名 The Unlit Hour contributors，并保留 make.fun 的复制代码版权；不要再问署名。
- 套件：`D:\makefun-kit\best-stealth-game-20261121-1759-kit`。24 个清单文件的字节数和哈希全部核对通过。套件无 README，要求在 RULES.txt / competition.yaml。
- 套件 main.ts、serve.ts、vendor、示例源码和三张 JPG 已复制。vendor 一字节未改。main.ts 已经有两次实际 authored-code 编辑：入口存在检查与本比赛 dossier 1.5 MiB 上限检查。
- 第 0 步用 Node 22.23.5 运行两次，全部 12 个输出经真实 cmp 比较一致；vendor 也经 cmp 与套件一致。产物在 `D:\unlit-step0-checks\run1` / `run2`。这仅证明 kit 示例打包，不证明潜行游戏功能。

## 现在的未提交内容——一定保留

GPT 已写但尚未测试/提交：

- game/js/util.js：合同 palette、tuning、mulberry32、数学辅助。
- game/js/grid.js：walkability / sight 查询、DDA ray、LOS、确定性 E/S/W/N BFS。
- game/js/screens.js：屏风朝向、范围/占用检查、旋转插值，结束时切换阻挡。
- game/js/vision.js：80 射线锥体、玩家中心的锥体判定。
- game/js/player.js：轴分离圆形碰撞、移动/潜行、掩体、交互。
- exposureRate(d,sneaking) 和 advanceExposure(value,d,sneaking,dt) 放在 player.js，准备让 game.js 与逻辑测试共用。null/undefined/Infinity 距离表示不被看见，按 -35/s 衰减。

这些文件还没有运行 syntax check 或 logic-test，不要称为验收通过。levels.js、guard.js、game.js、logic-test.mjs 都还没写。game/index.html 仍是原 kit 示例，尚未切到新 js 加载顺序；因此新逻辑目前不会被浏览器加载。

Gemini B 在被暂停前已写出、但没有报告或验收的文件：

- game/js/level-data.js
- game/js/audio.js
- tools/browser-check.mjs
- tools/check-shots.mjs
- tools/contact.html
- shots.json（修改为四张游戏截图计划）

必须亲自复核这些文件，恢复 B 后让它补齐报告；不要把部分写盘当成完成。地图未通过 GPT 的 validateLevel，也没有 unseen playthrough 证明。A 暂停前没有交付 style.css / render.js / ui.js 等文件，也没有任何验收报告。

Claude 已写的 CONTRACT.md 与三份 TASK-*-1.md 目前未提交，原样保留；不得重写它们。

## Gemini 会话——已停止，可原会话续接

官方 CLI：`C:\Users\Administrator\.gemini\bin\agy.exe`，`agy.exe --help` 和 `models` 已实际运行。

| 角色 | conversation ID | 模型 |
|---|---|---|
| A | 50262ca5-6581-4b95-8d48-df3493c5e90e | gemini-4-neon-high，effort high |
| B | 7b3df7d0-efb6-4569-9ef9-e6cb784067f0 | gemini-4-hydrogen-high，effort high |

本主会话已按用户暂停要求停止这两个 agy 进程；exec 结果都是 -1，不是成功完成。没有仍在运行的这两项派工。原始 stdout stream / CLI / stderr 全在 `D:\unlit-agent-runs\gemini-<a|b>-1.*`，路径已登记在 SESSIONS.md。

恢复时用官方 `--conversation <ID>`，仍指定相同模型和 high effort，提示它读取当前合同、继续原任务、不要覆盖其他人的文件、不要运行 git，并写报告。为新的 stdout/stderr 使用新文件名，绝不要覆盖旧日志。原先 `--mode auto` 在本机不支持 terminal sandbox，CLI 警告后按默认模式继续；不要把这个模式当成已启用。

目前还没有做 Antigravity 原始会话格式、usage 或 authorship 的 bundle/check 兼容性验证，这是第一项 Gemini 交付后的优先事项。原 stdout 由 PowerShell 重定向，保留原件；正式 reader 能否识别要实际验证，不要改写为别的 harness 格式。

## 紧接着应该做的事

1. 检查 git status，保留全部 working tree；读取 CONTRACT / TASK / REQUESTS，并查看 Claude 是否写了新 REVIEW。先不要重建仓库或回滚到 HEAD。
2. 需要恢复派工时续接上面两个官方会话，不另起会话以假装代码由新 agent 编写。报告和验收按合同走。
3. 补写 GPT 的 levels.js（7 条校验规则）、guard.js（5 状态）、game.js / index.html（合同 load order、固定步长、输入、状态、fallback render），以及 tools/logic-test.mjs。继续使用现有 util/grid/screens/vision/player，并测试修正。
4. 注意 Step 1 清理 kit demo 被自动审批拦截，见下节。原 game/src 和三张 JPG 仍在，不能声称清理完成。
5. 第一项 Gemini 交付后，先确认 bundle/check 是否会联网。任务书要求若上传 transcript 必须停下询问。仅做本地时，采集当前及两项 Gemini 会话，并从 Claude 取得其日志路径。redact.txt 是否已存在需要检查，不能打印内容。
6. 完成 Steps 1–5 后真实跑 logic-test 和必要的浏览器验证；只提交已验收的代码，不混入未完成的别方文件。写 NEEDS CLAUDE: Gate 1 logic review，自动等新 REVIEW，不要求用户搬运普通消息。

## 必须知道的限制和事实

- 自动审批两次拒绝了删除示例源码/JPG 的操作：一次为 Resolve-Path 校验后的 PowerShell Remove-Item，一次为逐文件 git rm。两者都未执行。不要换工具规避拒绝。文件仍在；应处理审批限制或让用户自行清理明确的示例文件。禁止删除/改写任何会话日志。
- 未启动本项目的 HTTP 服务，未做浏览器游玩、logic-test、截图捕获或新游戏两次打包；不要把上一场 poem 比赛的验证算进来。
- 原始日志必须包括本会话；本会话还包含此前 poem 比赛，这是记录事实，不得剪裁成只含游戏的新记录。
- 与用户约定：不强推，推送使用 C:\Users\Public\zhuma-handoff\unlit-github-push.cmd，并核对远端 SHA。所有参赛提交都须用户明确授权。
- deadline：2026-11-22 05:59 UTC，即 2026-11-21 21:59 PST。不是 poem 的 12:27 PST 截止。
- 4 张截图 1280×480 PNG、普通 scripts、file:// 和 HTTP 都能运行，是本项目的额外要求；套件允许更宽范围但不能据此放松合同。

## 不应做的事

不要再编辑 LICENSE、owner.json、vendor 或 serve.ts。不要把 C:\Users\Administrator\.makefun 中的 API 密钥、任何 keypair、Phantom 数据复制进项目或交接包。不要为了赶时间跳过作者身份与会话格式检查。不要在没有合同审查与用户授权时自行参赛提交。
