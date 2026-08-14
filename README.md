# dsh-humanizer
[![CI](https://github.com/deepios/dsh-humanizer/actions/workflows/ci.yml/badge.svg)](https://github.com/deepios/dsh-humanizer/actions)
[![npm](https://img.shields.io/npm/v/dsh-humanizer?label=npm)](https://www.npmjs.com/package/dsh-humanizer)

> 中文文本人味化 —— DeepSeek Harness（DSH）bundle 插件。

把 AI 味重、模板化、机器腔的中文文本，从**深层**改得更自然、更像人写，且内容不跑偏、每处修改可复核。

## 核心立场

- **不是"换词"，不是"正则去 AI 味"**：AI 痕迹的主体是文本决策结构里残留的模型默认概率路径。表层换词无效甚至反效果。
- **反套路化、反同质化、反模板化**：这是十维叙事设计的本质。每个章节的功能要不同，限制简单主谓宾句式与短句碎句使用率。
- **一次一步**：十步状态机，每步产出单一工件、程序校验通过才进下一步。
- **模型做人味，程序守内容**：深层改写由模型执行；确定性层只做**内容忠实守卫 + 分布画像 + 工件校验**。
- **编辑辅助，非 AI 检测器**：不输出概率、不声称识别作者、不要求提交外部检测。

## 组成

| 部分 | 作用 |
|---|---|
| `index.mjs` | Node half：注册三个确定性工具 + 一段**常驻 system prompt 工作流引导**（`ctx.systemPrompt.section`） |
| `references/` | 方法论全文（00-工作流 + 01—18 章），插件数据文件，模型按需用 `read` 读取 |
| `lib/guard.mjs` | 零依赖确定性层：分布画像（含短句/长句占比）、内容锚点、内容守卫、工件校验、§18 脚本核验清单 |
| `lib/client.js` | Client half：设置页「人味化」工作台面板（十步状态机 + 核心理念引导） |

## 三个工具

- `humanize_profile(text)`：分布画像（句长/段落/短句长句占比/连词密度）+ 内容锚点；
- `humanize_guard(original, rewritten)`：内容忠实守卫（锚点比对 + 禁止条件 + §18 脚本清单：破折号/半角引号/"我是X的"/仿佛似乎/不是…而是/引号成对）；
- `humanize_validate_artifact(artifact, source)`：工件校验（拒绝占位空话/空数组/不实证据/过短判断/英文 token）。

## 方法来源

方法为自有研究体系（十七章方法论 + 一章实战迭代经验），全文随包分发于 references/。**去除了"提交外部检测/以某家检测器为黑盒目标"的操作**——原理内化，但插件不要求、也不针对任何检测器。

## 安装

```sh
# registry（发布后，推荐）
dsh plugin --profile web add dsh-humanizer

# 本地开发（在包目录内执行，生成 link: 依赖）
dsh plugin --profile web add .

# git 源
dsh plugin --profile web add "github:deepios/dsh-humanizer#<ref>"
```

装完**重启 web**（bundle 层栈在 boot 合成；Node half 改动需重启，ESM 缓存）。

## 使用

对模型说「用 humanizer 处理这段文本」。模型会按十步状态机执行，用三个工具把关；「设置 → 人味化」里有工作台面板作为引导。

CLI：

```sh
node scripts/guard-humanizer.mjs profile ./文本.md
node scripts/guard-humanizer.mjs guard ./原文.md ./改写稿.md
```

## 命名说明

与 dsh-humanize **不是同一个项目**：那个是 RLCR 编码工作流。本插件做的是**文本**人味化。

## 状态

- [x] 十步状态机工作流（常驻 system prompt 引导，反套路叙事设计）
- [x] 十八章节全文（17 章方法论 + 1 章实战经验，`references/`）
- [x] 三个确定性工具（画像 / 内容守卫 / 工件校验）
- [x] Client half（设置页工作台面板）
- [x] 安装验证（本地 profile 挂载冒烟通过：`npx @deepseek-ai/dsh web` 正常启动）
- [x] 发布（npm 已发布 0.1.0-rc.1，tag next/latest）








