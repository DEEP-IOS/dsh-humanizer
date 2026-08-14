# Changelog

本项目遵循语义化版本；`next` tag 承载 rc 线，稳定后转 `latest`。

## [0.1.0-rc.1] — 待发布

### 新增
- 三个确定性工具：`humanize_profile`（分布画像+内容锚点）、`humanize_guard`（内容忠实守卫+§18 禁止条件）、`humanize_validate_artifact`（工件门禁）
- `humanize_reference`：按需读取插件 references/ 章节全文（打通方法论可达性）
- 常驻 system prompt 工作流引导（十步状态机 + 铁律，`order: 50` 高位）
- Client half：设置页「人味化」工作台面板（官方 `__ModuleLoader__` + `slots` 机制）
- `Config`：`workflowEnabled` / `toolsEnabled` / `sectionOrder`（全带默认值）
- `./invariant` 配套入口（官方惯例空 installer）
- 测试套件（20 用例，`node --test`）+ CI（node 22 / pnpm）

### 修复
- 依赖声明对齐官方规范：`@deepseek-ai/dsh-tools`/`@deepseek-ai/cordis` 转 peerDependencies（精确 rc 线），根治本地 `link:` 的模块解析问题
- `systemPrompt.section` 的 `order` 语义修正（官方升序拼接，`500`→`50`）
- 引导文本中 references 读取方式从「read 工具」改为 `humanize_reference` 工具（原方式模型无法定位插件包内路径）

### 规范对齐
- bundle/client 双面声明、`exports` 补 `./invariant`、`files` 白名单、`publishConfig.access: public`
- 开源配套：CONTRIBUTING / SECURITY / ARCHITECTURE / CHANGELOG
