# Changelog

## [0.3.0-rc.1]

### 破坏性变更：从「执行方法」到「成为作者」

- 总姿态反转：不再让模型执行规则，而是让模型在动笔前完整读入全部理论、在思考中成为作者，然后把理论忘记。中间没有工件、表格、门禁
- 退役 v0.2 四栏决策单与 `humanize_validate_decision` / `humanize_validate_artifact` 程序化思考校验：思考完整性由完整阅读与作者姿态保证，不由程序检查
- 新增 `humanize_study(体裁, 模式)`：一次返回 references/ 全部章节全文（按体裁排好阅读顺序）与三篇风格不同的示范文；模型动笔前必调一次，禁止跳读、摘抄、提炼
- 新增创作模式（authoring）与润色模式（polishing）：润色标准固定为内源标准——文本自己最好的版本，不预设原文是 AI，不按外部清单修改
- 常驻引导改为作家宪法：读全、成为作者、一口气写、听一遍、停；明确禁止评分、检测、画像、配额、表面指标、栏目标题、章号引用
- `humanize_guard` 保持只守内容与文字完好性，不评分、不检测、不画像
- references/00 重写为写作与润色总协议；references/11 改为内部思考单（不产出）；references/12、15 同步重写；新增 references/20 文笔与温度原理
- 旧章节统一加 v0.3 阅读规则：只完整阅读内化，不照做清单

### 变更

- 新增 lib/study.mjs 理论阅读包组装器；README、docs/WHY、docs/ARCHITECTURE 按新姿态重写，新增 docs/THEORY.md 理论总纲
- CLI 移除 validate-decision，新增 study 冒烟命令；测试套件更新

## [0.2.0-rc.1]

### 破坏性变更：删除后处理工序

- 定位反转：从「写完后的去 AI 味工作流」改为「写作前的决策前置协议」。去 AI 味一旦变成独立后处理工序，任何清单、轮次、配额都会成为新的统一指纹
- 退役十步状态机、三轮改写、三十项信号执行表；references/00 重写为写作决策协议，新增 references/19 后处理禁令与同类工具准入判据
- 移除 `humanize_profile` 的分布画像（句长/段落分布、连词密度、§18 特征字计数）：这些指标会诱导「围绕表面指标修改」，破坏排版与读句；工具保留为只返回内容锚点的兼容替身
- `humanize_guard` 移除文体扫描（破折号/半角引号/我是X的/心理代理/仿佛似乎/不是…而是）：命中列表会诱导机械替换；现在只做内容锚点保真 + 编码/引号成对 + 段落变化提示
- 新增 `humanize_validate_decision`：校验写作决策单四栏（材料来源/注意力选择/判断代价/保护清单）真填满，并拒绝「每章一处/全文只准一次/句长占比目标」等配额化声明
- `humanize_validate_artifact` 保留为 `humanize_validate_decision` 的兼容别名

### 变更

- index.mjs 常驻 system prompt 改为三不变量决策协议（写作前决策单 / 写作中回决策单 / 已有文本决策重建），不再注入十步与执行提示
- README、docs/WHY.md、docs/ARCHITECTURE.md、lib/client.js 全部按新定位重写
- references/09、references/18 增加退役告警；references/11 改为写作决策单；references/12 改为新执行提示；references/15 改为新完成判据
- CLI 移除 profile 命令，新增 validate-decision 命令
- 测试套件按新行为重写

## [0.1.0-rc.8]

### 新增
- docs/WHY.md：体系论证文档（与同类产品区别 + 每一条论断的研究/实战依据 + 理论依据清单）
- README 方法论节加入口链接

## [0.1.0-rc.7]

### 变更
- README 增加"它改出来的东西长什么样"效果示范（人味化前后对比 + 改动决策表）

## [0.1.0-rc.6]

### 变更
- 重写 §13 禁止与回退：十二类禁止逐条展开（禁止什么/为什么/看似合理的情形/识别与回退），补回退触发条件、操作规程、边界与关联表

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








