# Changelog

## [0.1.0-rc.5]

### 变更
- README 安装节补 Git 源一行命令（`github:DEEP-IOS/dsh-humanizer`，已实测可用）

## [0.1.0-rc.4]

### 变更
- README 语言重写：开头改为具体场景，删除空洞形容词与翻译腔

## [0.1.0-rc.3]

### 变更
- `humanize_profile` 增加逐段分布画像（segments + §18 特征字计数，只画像不判定）
- `humanize_reference` 支持读小节（如 `04#4.7`、`04 特殊句式`）
- 引导文本微强化：十步补"逐维审计/不压缩层级/按 §11 逐格填写"
- README 彻底重写：讲透理论、有立场、无 AI 腔、无破折号
- 测试 22 → 26 用例

## [0.1.0-rc.2]

### 变更
- 引导文本内联 §00 工作流全文 + §12 执行提示全文，理论真正常驻 system prompt（不再靠模型主动读才可见）
- README 补全理论介绍、十步工作流表与 19 章 reference 目录
- 包名改为 dsh-humanizer（无 scope，脱离非官方 @dsh-external）

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
- 引导文本补全导航：十步每步补回"读 §XX"章节指引；铁律补全 9 条（补"禁跳章＋诊断顺序"、英文思考例外条款）；新增 19 章目录索引与第 0 步读 §12/§11 指引——打通 references 理论到执行的可达性
- 代码层与理论对齐：`validateArtifact` 英文告警排除 AI/AIGC（铁律 5 例外）；`guard` 心理套路补"我先前/本来/当时＋以为/想着"（§18 第 4 条）；破折号/半角引号/我是X的 note 措辞改为"项目级规范，通用场景作参考"
- 依赖声明对齐官方规范：`@deepseek-ai/dsh-tools`/`@deepseek-ai/cordis` 转 peerDependencies（精确 rc 线），根治本地 `link:` 的模块解析问题
- `systemPrompt.section` 的 `order` 语义修正（官方升序拼接，`500`→`50`）
- 引导文本中 references 读取方式从「read 工具」改为 `humanize_reference` 工具（原方式模型无法定位插件包内路径）

### 规范对齐
- bundle/client 双面声明、`exports` 补 `./invariant`、`files` 白名单、`publishConfig.access: public`
- 开源配套：CONTRIBUTING / SECURITY / ARCHITECTURE / CHANGELOG





