# dsh-humanizer

[![CI](https://github.com/deepios/dsh-humanizer/actions/workflows/ci.yml/badge.svg)](https://github.com/deepios/dsh-humanizer/actions)
[![npm](https://img.shields.io/npm/v/dsh-humanizer?label=npm)](https://www.npmjs.com/package/dsh-humanizer)

中文文本的深度编辑工作流，跑在 DeepSeek Harness 上。

生成文本的"AI 味"不在词表里，在决策结构里：同样的推理路径、同样的段落开合、同样的情绪载体反复出现。表层换词只会把机器腔换成另一种机器腔。

dsh-humanizer 把这件事拆成两部分。模型执行一套十步工作流：十维叙事审计、十五层语言分析、功能路径诊断、三轮改写、三重审核，方法论全文随包分发，需要哪章读哪章。程序只做三件确定性的事：分布画像、内容忠实守卫、工件质量门禁。程序不判断"像不像人"，只核对"该保留的有没有保留、该填的有没有填满"。

不是 AI 检测器。不输出概率，不识别作者，不要求提交外部检测。

## 安装

```sh
dsh plugin --profile web add dsh-humanizer
```

装完重启 web，bundle 层栈在 boot 时合成。

## 使用

对模型说「用 humanizer 处理这段文本」。工作流常驻 system prompt，模型按十步执行，每一步的工件过 `humanize_validate_artifact` 门禁。

| 工具 | 作用 |
|---|---|
| `humanize_profile(text)` | 分布画像：句长、短长句占比、连词密度、内容锚点 |
| `humanize_guard(original, rewritten)` | 内容忠实守卫：锚点保真 + 禁止条件扫描 |
| `humanize_validate_artifact(artifact, source)` | 工件门禁：拒占位空话、空数组、假证据、短判断 |
| `humanize_reference(name)` | 读取 references/ 章节全文 |

CLI：

```sh
node scripts/guard-humanizer.mjs profile ./文本.md
node scripts/guard-humanizer.mjs guard ./原文.md ./改写稿.md
```

## 方法论

`references/` 随包分发 19 章：工作流、人类作者感、复杂度模型、十五层语言分析、功能路径诊断、十维叙事审计、三重审核、执行表、问题对照库、复核清单。模型按需读取，程序不做配方。

## 开发

```sh
pnpm test
```

## 命名

与 dsh-humanize（RLCR 编码工作流）不是同一个项目。本插件处理的是文本。
