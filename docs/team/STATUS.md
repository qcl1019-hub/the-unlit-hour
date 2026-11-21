# THE UNLIT HOUR — Step 0

NEEDS CLAUDE: kit read, write CONTRACT.md

状态：第 0 步的仓库与套件打包验证完成。停在接口约定关口，尚未编写 THE UNLIT HOUR 游戏代码，尚未派发 Gemini 任务，尚未推送或提交参赛。

## 已完成

- 本地 Git 仓库：`D:\the-unlit-hour`，分支 `main`，origin 为 `https://github.com/qcl1019-hub/the-unlit-hour.git`。现有公开仓库由用户核对为 2026-11-21 19:07:46 UTC 创建。
- 采用 GitHub 仓库路线，不运行源码包的 `init`。本仓库首次提交包含 `.makefun/owner.json`。
- 使用 PowerShell 的 `cp` 从 `C:\Users\Public\zhuma-handoff\owner.json` 直接复制归属文件，内容未显示。源文件与目标文件哈希相同。
- MIT LICENSE 已署名 `The Unlit Hour contributors`，保留复制的示例所需的 make.fun 原有版权声明和 SPDX 标识。
- `starter/` 全部复制入仓库，包括 `main.ts`、`serve.ts`、`shots.json`、示例 `game/`、示例截图和 `vendor/makefun-game.ts`。
- 套件清单 24 个文件的 SHA-256 与大小全部匹配。
- 读取了套件 RULES 的任务、产物、引用、截图、提交与作者身份要求，检查了 main.ts、serve.ts，以及 vendor 的接口、文件遍历、排序和 dossier 构造逻辑。
- main.ts 复制后通过两条独立编辑消息修改了真实代码：检查游戏入口是否存在；在写入前检查 dossier 不超过本比赛的 1.5 MiB 上限。没有以只改注释替代 authored line 要求。
- Node 22.23.5 运行两次，输出分别保存在仓库外 `D:\unlit-step0-checks\run1` 和 `run2`；文件集合相同，12 个文件经 `cmp -s` 全部逐字节相同。
- vendor 与套件经 `cmp -s` 完全相同。dossier 为 109,574 字节，SHA-256 为 `e66bada6bc5c08632fdf95555a0a0b709548d7560403d81e1b54290e4d49cedb`。

## 套件与原方案的差异及处理

1. 套件没有 README。规范在 `RULES.txt`、`competition.yaml` 和 vendor 文档中，不能报告已读不存在的 README。
2. 套件允许 classic scripts、ES modules、可选 import map，以及静态 HTTP 服务；它不强制模块或某个源目录。示例使用 `game/src/` 和模块，原方案要求 `game/js/`、普通脚本与 file:// 双击运行。后者是本项目更严格的目标，并不违反套件。请 CONTRACT 明确采用的加载顺序，不把示例实现当成强制规范。
3. 套件允许 3–4 张真实浏览器截图，PNG 或 JPEG，每张不超过 262,144 字节，长边至多 1280、短边至少 480。示例是三张 1280×720 JPEG；本项目要求四张 1280×480 PNG，也符合套件。保留项目要求，不因示例不同而擅自放宽它。
4. 套件示例使用 `shots.json` 中的 `?shot=start|play|end&seed=1`；本项目要求四个 `?shot=1..4`、seed 1337、固定 tick、READY 标记。后续实现按项目要求，当前示例不具备这些功能。
5. 套件主程序的产物是 `/output/game/`、`/output/screenshots/`、`/output/dossier.json`。评审程序重新生成 dossier 比较字节，不能手写或改动 dossier。仓库外本地测试使用 `MAKEFUN_OUTPUT_DIR`。
6. vendor 的通用 dossier 上限是 4 MiB，但本比赛 gate 更严格：1.5 MiB。main.ts 已增加比赛上限检查。
7. 注释不能可靠地满足入口至少一行 authored code 和两次真实编辑的要求；现已做两次实际代码修改。最终仍以套件 `check` 和服务器检查为准。
8. Block Dodger 是套件演示，不是本项目的潜行游戏。当前示例截图仅用来验证打包，不能作为完成 THE UNLIT HOUR 的证据，也不会按原样提交。

## 尚未完成 / 后续

- Claude 编写 CONTRACT.md 和第一批三份任务书，然后用户通知本会话读取。当前不进入第 1 步。
- CONTRACT 必须明确共享 util.js、index.html、styles、数据与截图模式的归属；原交接没有明确 util.js/index.html 的负责人。
- Gemini A / B 尚未启动，不存在已通过的 Gemini 验收或日志兼容性检查。派工后记录原始 session id，不改写或重建日志。
- 按用户计划，第 1 步后尽早 bundle/check，确认 Gemini 原始记录能被识别；当前没有运行参赛提交或服务器评分。
- README.md 留给 Gemini B，必须包含本比赛的三枚 make.fun 实时徽章、比赛链接和游戏/截图说明。About 已设置，README 仍待编写。
- 尚未测试示例的浏览器游玩、file://、控制台、断网、截图捕获或 25% 缩略图；不把打包成功等同于这些验收成功。
- 用户已确认复用之前的 Phantom 公开地址，归属文件按该确认创建；本会话未操作 Phantom UI，未声称亲眼比较钱包界面。若用户要更换地址，应由用户确认，不能自行改付款设置。
- 提交前按既定交接让用户运行 push 入口，随后核对远端 commit；不强推。所有参赛提交都必须由用户明确授权并提供命令。
- 最终导出所有参与会话的原始日志，保留原件；使用套件在副本中处理个人信息，运行正式 check。当前主会话此前处理过另一场比赛，整段日志须保留，不能裁切或改写为只含本项目。

## 下一动作

请告诉 Claude：看 STATUS.md。

Claude 的首份约定与任务书写好后，再由用户通知 GPT 继续。
