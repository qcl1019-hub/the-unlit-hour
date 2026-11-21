# 原始会话索引

## GPT 主会话

- Codex 原始记录：`C:\Users\Administrator\.codex\sessions\2026\11\21\rollout-2026-11-21T11-27-58-01a1ff94-6787-7fc1-bcb7-7820966fbea3.jsonl`
- 该会话开始于本比赛开放之后，曾处理另一场比赛，随后由用户转入 THE UNLIT HOUR；最终保留完整原始记录，不能剪裁成新会话。
- 模型、权限、计费与时间信息以 harness 原始记录为准，不能照抄任务模板中预设的模型声明。
- 接手 Codex 原始记录：`C:\Users\Administrator\.codex\sessions\2026\11\21\rollout-2026-11-21T13-14-33-01a1fff5-fc30-7390-b900-fb32e7f60c62.jsonl`。

## Claude / Gemini

Claude 在独立窗口工作，其原始日志路径待 Claude 提供。最终必须收集实际参与开发的所有原始会话，不能把这张索引当作日志替代品。

### Gemini A — 第一批

- 官方 Antigravity CLI 会话 ID：`50262ca5-6581-4b95-8d48-df3493c5e90e`
- 模型：`gemini-4-neon-high`，effort high，mode auto。
- 原始 stream-json：`D:\unlit-agent-runs\gemini-a-1.stream.jsonl`
- 原始 CLI / stderr：`D:\unlit-agent-runs\gemini-a-1.cli.log`、`D:\unlit-agent-runs\gemini-a-1.stderr.log`
- 任务：TASK-GEMINI-A-1，工作目录 D:\the-unlit-hour。2026-11-21 21:09 UTC 按用户要求停止；退出 -1，任务未完成，无交付报告。

### Gemini B — 第一批

- 官方 Antigravity CLI 会话 ID：`7b3df7d0-efb6-4569-9ef9-e6cb784067f0`
- 模型：`gemini-4-hydrogen-high`，effort high，mode auto。
- 原始 stream-json：`D:\unlit-agent-runs\gemini-b-1.stream.jsonl`
- 原始 CLI / stderr：`D:\unlit-agent-runs\gemini-b-1.cli.log`、`D:\unlit-agent-runs\gemini-b-1.stderr.log`
- 任务：TASK-GEMINI-B-1，工作目录 D:\the-unlit-hour。2026-11-21 21:09 UTC 按用户要求停止；退出 -1，文件部分落盘但尚未复核，无交付报告。

### 2026-11-21 21:15 UTC 续接

- 两项恢复使用各自原会话 ID 和模型，effort high，执行模式 accept-edits。
- A 新记录：`D:\unlit-agent-runs\gemini-a-1-resume-20261121-211515.stream.jsonl`、`D:\unlit-agent-runs\gemini-a-1-resume-20261121-211515.cli.log`、`D:\unlit-agent-runs\gemini-a-1-resume-20261121-211515.stderr.log`。
- B 新记录：`D:\unlit-agent-runs\gemini-b-1-resume-20261121-211515.stream.jsonl`、`D:\unlit-agent-runs\gemini-b-1-resume-20261121-211515.cli.log`、`D:\unlit-agent-runs\gemini-b-1-resume-20261121-211515.stderr.log`。
- Antigravity 本机存储位于 `C:\Users\Administrator\.gemini\antigravity-cli`，可按上述会话 ID 选择原始 conversation。
- A/B 已交付并分别通过复核，见 reports/GEMINI-A-1.md 和 reports/GEMINI-B-1.md。套件本地探测识别两项原生会话。原先两份 UTF-16LE stream 保留在原处，套件未把它们作为 UTF-8 流接收。

### 2026-11-21 21:49 UTC 第二批本地交付准备

- 沿用上面的两个官方会话 ID、模型与 high effort。A 负责四景与截图，B 负责 README 和截图重现说明。Gate 1 尚无 Claude 回审。
- A：`D:\unlit-agent-runs\gemini-a-2-20261121-214949.stream.jsonl`、`D:\unlit-agent-runs\gemini-a-2-20261121-214949.cli.log`、`D:\unlit-agent-runs\gemini-a-2-20261121-214949.stderr.log`。
- B：`D:\unlit-agent-runs\gemini-b-2-20261121-214949.stream.jsonl`、`D:\unlit-agent-runs\gemini-b-2-20261121-214949.cli.log`、`D:\unlit-agent-runs\gemini-b-2-20261121-214949.stderr.log`。
- B 的重现说明复核：`D:\unlit-agent-runs\gemini-b-2-reconcile-20261121-215458.stream.jsonl`、`D:\unlit-agent-runs\gemini-b-2-reconcile-20261121-215458.cli.log`、`D:\unlit-agent-runs\gemini-b-2-reconcile-20261121-215458.stderr.log`。
- B 的最终说明校验：`D:\unlit-agent-runs\gemini-b-2-guide-20261121-220034.stream.jsonl`、`D:\unlit-agent-runs\gemini-b-2-guide-20261121-220034.cli.log`、`D:\unlit-agent-runs\gemini-b-2-guide-20261121-220034.stderr.log`。
- `agy.exe --version` 返回 `1.5.14`。旧 Codex 原始记录声明版本 0.169.0、effort xhigh。套件 dry-run 从参与记录检测到 `codex_apps`、`cua_repl`、`node_repl`，完整 run record 需按真实使用情况填写。
