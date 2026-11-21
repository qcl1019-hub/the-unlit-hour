# 第 0 步验证证据

套件：`D:\makefun-kit\best-stealth-game-20261121-1759-kit`。

清单校验：24 个文件，0 个大小或 SHA-256 不匹配。

运行目录：`D:\the-unlit-hour`。实际运行的命令为以下两次独立调用，使用 `npx.cmd --yes node@22`，已确认版本 v22.23.5：

```powershell
$env:MAKEFUN_OUTPUT_DIR = 'D:\unlit-step0-checks\run1'
npx.cmd --yes node@22 main.ts
$env:MAKEFUN_OUTPUT_DIR = 'D:\unlit-step0-checks\run2'
npx.cmd --yes node@22 main.ts
```

两个进程均退出 0。输出相对文件名列表相同，对每个文件实际调用 `C:\Program Files\Git\usr\bin\cmp.exe -s -- <run1-file> <run2-file>`，12 次比较全部退出 0。vendor 另与套件副本比较，退出 0。

`dossier.json`：109,574 字节；SHA-256 `e66bada6bc5c08632fdf95555a0a0b709548d7560403d81e1b54290e4d49cedb`。

验证只覆盖示例文件的打包、字节确定性与 vendor 一致性，不覆盖 THE UNLIT HOUR 的游戏功能、浏览器运行或截图真实性。没有参赛提交。
