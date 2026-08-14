# dsh-humanizer 体系理解文档（ARCHITECTURE）

> 本文档完整描述插件的定位、组成、运作机制与已知差距，是仓库的架构基线。
> 最后更新：0.1.0-rc.1

## 1. 定位与核心理念

**一句话**：把 dsh 变成中文文本的深度编辑工作台——用「模型做人味，程序守内容」的分工，强制一套反套路化的深层改写工作流。

核心理念（与实现的对应）：

| 理念 | 实现 |
|---|---|
| 不是"换词"，不是"正则去 AI 味" | 确定性层只做画像/守卫/校验，不做"命中即修"；禁止条件只作核验信号 |
| 反套路化/反同质化/反模板化 | 十维叙事设计 + 功能路径轮换，由常驻 system prompt 强制 |
| 一次一步（十步状态机） | 常驻引导定义十步；每步工件必须过 `humanize_validate_artifact` 门禁 |
| 模型做人味，程序守内容 | 改写全权交给模型；程序只守锚点忠实、禁止条件、工件质量 |
| 编辑辅助，非 AI 检测器 | 不输出概率、不识别作者、不要求提交外部检测 |

## 2. 文件结构与职责

```
dsh-humanizer/
├── package.json            # npm 包 manifest + dsh bundle/client 声明（官方字段）
├── index.mjs               # Node half：Cordis 插件本体（Config/apply/三个工具 + 工作流引导）
├── invariant.js            # ./invariant 配套入口（官方惯例：空 installer）
├── cordis.patch.yml        # bundle patch：向 profile 配置树插入本插件一行
├── lib/
│   ├── guard.mjs           # 确定性层（零依赖）：profile/guard/validateArtifact
│   └── reference.mjs       # references/ 目录读取器（humanize_reference 工具后端）
├── lib/client.js           # 浏览器 half：设置页「人味化」工作台面板（官方 __ModuleLoader__ + slots）
├── references/             # 方法论全文（00-工作流 + 01—18 章），随包分发的数据资产
├── scripts/guard-humanizer.mjs  # CLI：profile / guard 冒烟
├── test/guard.test.mjs     # node:test 测试（14 用例）
└── docs/ARCHITECTURE.md    # 本文档
```

## 3. 加载与组合机制（dsh 视角）

```
dsh web
  → 读 ~/.dsh/profiles/web/package.json 的 dsh.profile.bundles
  → 按序应用每个 bundle 的 cordis.patch.yml（dsh-humanizer 在 base/web-app 之后）
  → patch 插入一行：{ id: dsh-humanizer, name: '@dsh-external/dsh-humanizer' }
  → cordis loader import 包主入口（index.mjs）→ 插件协议 { name, inject, Config, apply }
  → client 侧：dsh-client-modules 扫描声明 dsh.client 的包
    → 解析 exports["./client"]（lib/client.js）
    → Node half 把它写入 window.__DSH_BOOT__，serve /plugins/<id>/client.js
    → 浏览器端 __ModuleLoader__.load() 注册 factory → 物化后作为插件 entry 采用
```

- **bundle 识别**：manifest 的 `dsh.bundle.patch` 非空即成为 profile 层（`dsh plugin` reconcile 自动维护 bundles 列表）
- **client 识别**：manifest 的 `dsh.client.platform`（官方字段，含 `inject`/`immediately` 可选）
- **依赖解析**：`@deepseek-ai/dsh-tools`/`cordis` 是 peer，由 dsh 闭包满足；schemastery 是普通依赖

## 4. 运行时行为（一次完整人味化会话）

```
用户：用 humanizer 处理这段文本
  │
  ├─ 常驻引导（systemPrompt.section，order 50）告知：核心理念/十步/铁律/工具
  ├─ 模型进入第 0 步接单卡
  ├─ 第 1 步 十维叙事设计 → 产出工件A
  │     └─ humanize_validate_artifact(工件A, 原文)   ← 程序门禁：不过则打回
  ├─ 第 2 步 功能路径图 → 工件B → 门禁
  ├─ …（每步：工件 → 门禁 → 进下一步）
  ├─ 需要细则时 → humanize_reference("05")  ← 程序从插件包内读 references/ 返回全文
  ├─ 第 6-8 步 三轮改写（材料/叙事/论证 → 信息/句法 → 词汇）
  ├─ 第 9 步 复核 → humanize_guard(原文, 改写稿)  ← 锚点忠实 + 禁止条件
  └─ 第 10 步 交付
```

**工具分工**：
- `humanize_profile(text)`：分布画像（句长/段落/短长句占比/连词密度）+ 内容锚点。诊断信息，非"去修"指令
- `humanize_guard(original, rewritten)`：锚点保真比对 + §18 禁止条件扫描（破折号/半角引号/我是X的/仿佛似乎/不是…而是/引号成对等）。复核阶段
- `humanize_validate_artifact(artifact, source)`：工件质量门禁（拒占位空话/空数组/不实证据/过短判断；英文 token 仅告警）
- `humanize_reference(name)`：按需读取 references/ 章节全文（打通方法论的可达性）

## 5. 与官方规范的对应

| 官方规范 | 本插件 |
|---|---|
| bundle 包：`dsh.bundle.patch` + `cordis.patch.yml` | ✅ |
| client 包：`dsh.client.platform` + `exports["./client"]` | ✅ |
| 插件协议：`name`/`inject`/`Config`/`apply(ctx, config)` | ✅（Config 全带默认值） |
| 工具注册：`ctx.tools.register(defineTool(...))` | ✅（output 必填 + render + JSON 输出） |
| 生命周期：`ctx.effect` 返回 disposer | ✅（引导段 + 工具注册随 fiber dispose） |
| 版本韧性：`./invariant` 配套入口 | ✅（空 installer 惯例） |
| 发布：`files` 白名单 + `publishConfig.access: public` + rc 版本 | ✅ |
| 测试：`node --test` | ✅（14 用例） |

## 6. 已知差距与决策点（诚实清单）

1. **references/ 可达性（已修复）**：早期 system prompt 引导模型"用 read 工具读取 references/"——但 read 读的是工作区，模型无法定位插件包内路径。v0.1.0-rc.1 起由 `humanize_reference` 工具打通。
2. **order 语义（已修复）**：原 `order: 500` 在官方升序拼接语义下是提示词末尾而非"注意力最高处"；默认改为 50（persona 之后、工具引导 100–199 之前）。如部署中其他插件占用 1–49，profile 可用 Config 覆盖。
3. **十步状态机无程序级顺序强制（待决策）**：`humanize_validate_artifact` 是每步门禁，但"必须按 0→10 顺序、不得跳步"目前靠常驻引导的文本约束。若要程序级强制（记录当前步骤、非序调用即拒），需引入 sessionProjections（官方机制，todo 插件范式）——会增加复杂度，是否值得由产品决策。
4. **client 工作台面板渲染未验证（待验证）**：boot 冒烟通过 ≠ 设置页面板真实渲染。机制已对齐官方（__ModuleLoader__ + slots.inject('settings.section')），但需在真实 web UI 打开「设置 → 人味化」确认。
5. **方法论版权（待确认）**：references/ 源自《中文文本人工智能痕迹消除与多重审核对抗完整方法体系》与《青囊雪》迭代经验。以 MIT 开源分发前需确认授权链完整。
6. **dsh-external org 权限（待确认）**：发布目标仓库 `dsh-external/dsh-humanizer` 需 org 成员 push 权限。
