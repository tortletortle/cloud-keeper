# ESLint 规则

项目使用 ESLint 9 Flat Config，执行版本固定为 9.39.1。配置同时覆盖浏览器端 `src/**/*.js` 和 Node.js 工具、测试 `scripts/**/*.cjs`、`tests/**/*.cjs`。

## 执行

```bash
npm run lint
npm run verify
```

## 规则分层

- **错误并阻断 CI：** 未定义变量、不可达代码、重复对象键/分支、非法正则、危险动态执行、调试器残留、稀疏数组、危险 finally、无效 typeof、变量重声明风险等正确性和安全规则。
- **警告：** 未使用变量、隐式类型比较、代码块风格、尾随空格、重复空行、alert 和 const 优先级。
- **环境：** 明确声明浏览器与 Node.js 全局对象，避免合法宿主 API 被误报。

CI 的 `verify` 在语法/资源检查、单元测试和构建前先执行 ESLint。当前沙箱无法访问 npm registry，因此本地未能下载 ESLint 包执行 lint；固定版本会在 GitHub Actions 联网环境安装并运行，CI 结果作为规则是否通过的最终证据。