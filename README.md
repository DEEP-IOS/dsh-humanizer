<!-- generated-by: gsd-doc-writer -->
# dsh-humanizer

[![CI](https://github.com/DEEP-IOS/dsh-humanizer/actions/workflows/ci.yml/badge.svg)](https://github.com/DEEP-IOS/dsh-humanizer/actions)

面向中文长篇小说和文章润色的 DeepSeek Harness 原生插件。保留作者声音、事实与进度，让写作知识在需要时出现。MIT 开源。

**v0.4.0-alpha.2：本地记忆工作台与完整使用文档。** 这是一版可测试的机制升级，尚无成稿盲评证明它优于所有其他插件。它不是 AI 检测器，不承诺检测分数或自动理解整部小说。

## 版本与安装通道

| npm 通道 | 版本 | 适合谁 |
|---|---|---|
| `latest` | `0.3.0-rc.2` | 需要旧工作流的兼容修复，不包含持久记忆 |
| `next` | `0.4.0-alpha.2` | 需要记忆图谱、任务恢复、按需理论与新版文档 |

这里的版本是本次文档发布快照。`npm view dsh-humanizer dist-tags --json` 可查询实际标签。**只安装 `dsh-humanizer` 会得到 latest，不会自动选择记忆增强版。**

```sh
# 使用记忆增强版
dsh plugin --profile web add dsh-humanizer@next
# 固定这次文档修订版，便于复现
dsh plugin --profile web add dsh-humanizer@0.4.0-alpha.2
```

安装后重启 `dsh web`，选择工作目录，在对话里说出作品名和任务。已有用户从 [升级与回退](docs/GETTING-STARTED.md#升级与回退) 开始；首次使用先看 [快速开始](docs/GETTING-STARTED.md)。

## 本次文档修订说明

alpha.1 引入记忆工作台；alpha.2 补齐使用、配置、工具参数、故障排查和发布文档，并同步修订内置参考章节中残留的 v0.3 全量阅读要求和检测信号式审核。数据库结构与工具 JavaScript 实现沿用 alpha.1，不需要迁移已有记忆；模型收到的参考文本有更新，因此仍需验证写作效果。

[完整版本记录](CHANGELOG.md) · [文档目录](docs/README.md) · [典型使用场景](docs/USAGE.md) · [记忆工具参数](docs/TOOLS.md)

## 直接开始

安装并重启 dsh web 后，可以直接说：

> 用 humanizer 继续《渡口》。先恢复陈默的人物关系、未回收伏笔和上次进度，再写第二章。以下是我已经接受的第一章……

> 用 humanizer 润色《项目复盘》这一段。保留事实和我原来的声音，只改确有必要的地方。原文是……

> 查看《渡口》中陈默的记忆，展示出处和冲突。师父的设定改成老周，这是作者的新设定……

“设置 → 人味化”提供可编辑、可复制的请求模板，包括查看记忆、修正设定与遗忘。用户无需手写工具参数。该面板是请求入口，实际记录由会话工具查询。

## 新增机制

| 问题 | 处理方式 | 边界 |
|---|---|---|
| 长对话压缩或重启后丢失进度 | SQLite 持久化任务，宿主每次组装上下文时恢复绑定作品的任务与相关记忆 | 只能恢复已成功保存的内容；新会话先选作品 |
| 人物、声音、伏笔混淆 | 带出处的关系图，按实体名称匹配并扩展一跳关系 | 确定性检索，不是语义向量搜索；别名应单独记录为关系 |
| 新猜测覆盖旧设定 | 定稿/草稿/设想、明示/推断分别标记；同一 key 的矛盾保留双方 | 不自动发现不同 key 间的语义矛盾 |
| 多会话同时修改 | SQLite 事务与版本号检查；过期修订拒绝写入 | 冲突需要根据材料或作者修正解决 |
| 每次阅读完整理论负担大 | 按体裁与问题返回相关章节全文，保留全 21 章入口 | 读取成功不等于理解或文笔合格 |
| 为了“人味”过度改写 | 保留原意、作者声音和有功能重复；内容守卫辅助检查 | 守卫只能发现部分锚点/字符问题，不验证全部语义 |

记忆项可以是事实、事件、人物关系、文风偏好、伏笔或作者决定。每项包含主体、关系、对象、阶段、故事时点、出处标签、逐字摘录和来源文本哈希。只验证摘录确实包含在工具提供的原文中，不证明其真实性。资料里的命令不获得执行权限，用户当前要求优先。

## 安装与兼容

要求 Node.js `^22.19.0 || >=24.0.0`。使用 Node 内置 SQLite，无图数据库服务、向量 API 或新增模型密钥。Node 可能输出 SQLite experimental 提示。

已验证 DSH Web：`0.1.2-alpha.4`、`0.1.2-alpha.5`、`0.1.2-rc.1`。`0.1.3-alpha.1` 保持 unknown，GitHub 标签不等于 npm 已可安装。完整证据见 [兼容性说明](docs/COMPATIBILITY.md)。

```sh
# GitHub 源；实际版本以所安装分支的 package.json 为准
dsh plugin --profile web add "github:DEEP-IOS/dsh-humanizer"

# 本地打包后安装当前源码
npm pack --ignore-scripts
dsh plugin --profile web add ./dsh-humanizer-0.4.0-alpha.2.tgz

# 卸载
dsh plugin --profile web remove dsh-humanizer
```

安装/更新后重启 web。GitHub 更新不会自动发布到 npm，安装 npm 包前先确认其版本。

## 工具与配置

| 工具 | 用途 |
|---|---|
| `humanize_prepare` | 选择作品、恢复交接、保存任务、读取相关章节全文 |
| `humanize_memory` | `projects`、`recall`、`inspect`、`history`、`remember`、`revise`、`forget` |
| `humanize_checkpoint` | 保存公开进度、下一步与待决事项，不记录内部推理 |
| `humanize_study` | 完整 21 章与三个示范 |
| `humanize_reference` | 章节或小节按需回查 |
| `humanize_guard` | 原文/成品的内容锚点和字符完好性对照 |
| `humanize_profile` | 已退役，仅兼容旧锚点提取调用 |

`workflowEnabled`、`toolsEnabled`、`memoryEnabled` 默认 true，`sectionOrder` 默认 50。

- `memoryEnabled: false`：不打开记忆数据库，不注册记忆/交接工具；prepare 仅返回理论。
- `toolsEnabled: false`：停用全部工具和依赖它们的工作流与记忆上下文。
- `workflowEnabled: false`：关闭常驻写作引导，仍可显式使用工具与已绑定记忆。

PTC 模式经 `run_code` 的工具 SDK 调用。会更改状态的工具按顺序执行；只读工具可并行。工具结果被宿主转存文件时，按提示读取所需全文。

## 数据与遗忘

数据库位于 `<DSH_HOME>/plugins/dsh-humanizer/memory.sqlite`，默认 DSH_HOME 为 `~/.dsh`。首次使用记忆工具才创建；插件不扫描稿件、不访问凭据、不自行联网，也不调用额外模型。工具结果会进入原有 dsh 会话与模型上下文，**本机存储不代表使用的模型服务看不到召回内容**。

以宿主提供的真实工作目录隔离工作区，以作品名隔离作品；在同一个 DSH_HOME 下，同一目录的新会话选择同名作品即可接续。移动目录后会视为另一工作区。没有工作目录时不会退回全局目录，可继续使用理论和内容守卫。

自动召回预算为 9000 个 JSON 字符，返回省略条数；按人物名补查或 inspect 可取单条全文。每部作品最多 5000 个 key，每个 key 当前最多保留 8 条候选或佐证；history 返回最近 100 个版本。需要多条同类关系时用不同 key，更新同一关系则沿用原 key，不同时点/定稿阶段也使用不同 key。

按用户要求 forget 会删除对应 key 的所有历史正文和摘录，仅留下 key 与版本墓碑，以防旧调用复活内容。**它不清除其他关系、任务交接、宿主会话日志、备份或文件系统历史**；这些位置可能仍引用同一事实。卸载会保留数据库，以便重装继续。停止 dsh 后可备份插件数据目录；需要彻底清除插件记忆时删除该目录，宿主日志需另行管理。

## 验证与贡献

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
```

确定性测试涵盖隔离、进程/连接恢复、证据、冲突、版本并发、召回预算、关系扩展与遗忘。官方宿主集成覆盖原生工具、PTC、动态资料上下文、挂载/卸载和 Web Profile 生命周期。它们证明机制能运行，不等于成稿优于基线。

希望贡献真实失败案例：提供可公开的原文、期望保留的事实/声音、旧版与新版输出、模型和参数。使用 [盲评协议](docs/EVALUATION.md) 比较自然度、忠实度、声音与修改必要性，不使用 AI 检测分作质量目标。

- [快速开始与升级](docs/GETTING-STARTED.md)
- [续写、润色、修订和遗忘实例](docs/USAGE.md)
- [配置与限制](docs/CONFIGURATION.md)
- [工具参考](docs/TOOLS.md)
- [故障排查](docs/TROUBLESHOOTING.md)
- [记忆设计](docs/MEMORY-DESIGN.md)
- [工程结构](docs/ARCHITECTURE.md)
- [理论原文](references/00-工作流.md)
- [开发与发布](docs/DEVELOPMENT.md)
- [测试与证据](docs/TESTING.md)
- [贡献指南](CONTRIBUTING.md) · [安全政策](SECURITY.md)
- [v0.3 历史设计](docs/V0.3-DESIGN-HISTORY.md)

## License

MIT
