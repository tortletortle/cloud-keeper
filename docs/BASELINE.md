# 源码基线与远端差异

核查日期：2026-11-25

## 采用的功能基线

- Library 原始文件：`CloudRanch_V0.12.html`
- 文件大小：3,654,054 bytes
- 文件最后记录时间：2026-11-23 12:45 UTC
- 本轮工程版本：V0.12.1
- 采用原因：在本次可访问的项目资料中，这是最新的完整游戏 HTML 源码；V0.12 已包含存档导入/导出、旧档保护、生态、社交和行为模块。

## GitHub 远端核查

仓库：`tortletortle/cloud-keeper`

| 分支 | HEAD | 提交说明 | 本轮判断 |
|---|---|---|---|
| `main` | `9681066db6ff5fce2d659f26740a866008d76f28` | Import playable Cloud Ranch V0.4 with embedded game source and assets | 远端主线仍是 V0.4 |
| `v0.5-ecology` | `266d2f2b44c65dbc0b80134a4d9d044b1bb914df` | feat: V0.5 weather, cloud nursery and growth | V0.5 功能分支，尚未证明包含 V0.12 |

- `main` 的上一个提交：`4d5e154bc585a62e25bfd106f5c45605ce6e1646`（初始化仓库）。
- `v0.5-ecology` 以 `9681066` 为父提交。
- `docs/CHANGELOG.md` 仍只有建仓骨架内容。
- 当前可见 Releases 列表为空。
- 本地 V0.12 不是这两个远端分支的已验证内容。

## 安全边界

本轮改造以 Library 的 V0.12 为源，生成可审查的 V0.12.1 工程包。没有把 V0.12 假装成已经存在于 GitHub 的远端提交，也没有覆盖 `main` 或 `v0.5-ecology`。待具备完整二进制资源写入与 PR 验收路径后，再把工程包作为独立分支提交；远端合并状态必须以实际 PR 和 CI 结果为准。