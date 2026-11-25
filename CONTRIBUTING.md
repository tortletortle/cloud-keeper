# 贡献指南

## 本地准备

- Node.js 20+
- 支持现代 JavaScript、CSS Grid、Pointer Events 和 `inert` 的浏览器

## 提交前检查

```bash
npm run verify
```

涉及 DOM、Pointer Events、动画、弹窗、存档读写或响应式布局的改动，还必须在真实浏览器中手动验收桌面和移动视口，并记录浏览器版本与结果。

## 代码边界

- `cloud-brain.js`、`cloud-social.js`、`cloud-ecology.js`、`cloud-saves.js` 不应依赖 DOM。
- `app.js` 负责将纯逻辑与 DOM、输入和渲染连接起来。
- 纯逻辑新增行为时，应优先增加 Node `node:test` 用例。
- 修改存档结构时，必须保留 V0.12 的 `version: 1` 读取兼容，除非提供明确、可测试的迁移路径。
- 不能在解析失败时自动把玩家现有存档替换成新游戏。
- 新增资源需记录原始来源、创作者、授权方式和许可文本；未核实授权的资源不得公开发布。

## Pull Request 验收内容

1. 改动目的与影响范围。
2. 基线 commit SHA。
3. 自动化测试命令和完整结果。
4. 浏览器验收步骤与证据（如适用）。
5. 存档兼容性说明（如适用）。
6. 已知限制和未完成事项。