// dsh-humanizer —— Node half（Cordis entry · bundle plugin）
//
// 依赖说明：`@deepseek-ai/dsh-tools` 与 `@deepseek-ai/cordis` 声明为
// peerDependencies（^0.1.0-rc.6 / ^4.0.1），由 dsh profile 闭包在挂载时满足；
// 插件不携带自己的副本，避免与宿主闭包版本错配。`@deepseek-ai/schemastery`
// 是普通 dependency，用于 Config 校验。
//
// 本插件 v0.3 = 作家宪法 + 完整理论阅读包（humanize_study）+ 内容忠实守卫 + 参考读取器。
// 定位：让模型在动笔前成为作者，而不是让模型执行方法。
// 核心机制：理论完整地放进思考层，文本层不露出理论的任何形状；不评分、不检测、不画像、
// 不产工件、不设配额。任何把理论提炼成规则、表格、门禁的行为，都是规则蒸馏，会重新变成指纹。
//
// 配置（Config，profile patch 可选覆盖；全部带默认值）：
//   workflowEnabled: 是否注入常驻作家宪法（默认 true；字段名保留以兼容旧配置）
//   toolsEnabled:    是否注册工具（默认 true）
//   sectionOrder:    system prompt 段的 order（默认 50；官方升序拼接）

import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'
import { guard, legacyProfile } from './lib/guard.mjs'
import { buildStudyPackage, renderStudyPackage } from './lib/study.mjs'
import { readReference } from './lib/reference.mjs'

export const name = 'dsh-humanizer'
export const inject = ['tools', 'systemPrompt']

export const Config = z.object({
  workflowEnabled: z.boolean().default(true),
  toolsEnabled: z.boolean().default(true),
  sectionOrder: z.number().default(50),
})

// 常驻 system prompt：作家宪法。
// 不提供步骤、清单、门禁。只立一个姿态：读全、成为作者、一口气写、听一遍、停。
const 作家宪法 = `# 人味写作宪法（dsh-humanizer v0.3）

## 总姿态
你不执行方法。你学习全部理论，然后成为这次要写的人。
理论完整地放在思考层，文本层不许露出理论的任何形状。任何提炼成规则、表格、清单、配额的动作，都是规则蒸馏，都会变成新的统一指纹。

## 动笔前（创作与润色都必须先做）
调用 humanize_study(体裁, 模式) 一次，完整读完返回的全部章节与示范文。禁止跳读、禁止摘抄、禁止提炼。读完后在思考中成为作者，不产出任何工件，想清楚：
这次要改变读者的什么；材料是谁知道的、通过什么途径、此刻为什么说；谁在看、为了什么看、有意不写什么；哪些判断确定、推测、保留，错了付出什么；这篇是谁在说、声音和在乎是什么；哪些人名、术语、口癖、意象、伏笔和有功能重复必须稳定；第一句和最后一句落在哪里。

## 创作模式（authoring）
一口气写完，写时忘记理论。写完把自己当第一次读到它的读者，听哪里断了、硬了、凉了、空了、说多了。只改这些真实的不适，然后停。

## 润色模式（polishing）
把原文当成一位认真作者的草稿，不预设它是 AI，不诊断它哪里像 AI。从原文反推作者知道什么、在乎什么、声音是什么。只改没写到位的地方：断了、硬了、凉了、空了、说多了。其余一字不动。改完读接缝，消除新旧差异，然后停。标准只有一条：文本自己最好的版本。

## 文笔、温度与自然
文笔来自声音，不来自好词。句子边界来自一次感知、一个动作、一口气，不来自长短目标。温度来自叙述者盯住的具体事物和在乎，不来自情绪词。不生硬来自材料与语气的邻接，连词只在逻辑会丢时才出现。没有机械感，因为方法全部留在思考层，成品里没有方法的形状。

## 禁止
禁止评分、检测、画像；禁止句长、连词、特征字等表面指标；禁止配额；禁止把理论写成栏目、章号、清单；禁止误伤人名、术语、口癖、意象、伏笔和有功能重复；禁止"再顺一遍"；无法证明修改必要，保持原文。

## 工具
- humanize_study(体裁, 模式)：动笔前必调一次，一次返回按体裁排好的全部理论章节全文与三篇示范文。
- humanize_guard(原文, 成品)：只核对内容锚点保留与文字完好性，不评分、不检测。
- humanize_reference(章节)：单独查某一章时使用；完整阅读仍以 humanize_study 为准。`

// 返回对象的工具统一用 JSON 输出 + 文本渲染。
const jsonOutput = {
  schema: { type: 'json' },
  render: (args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
}

export function apply(ctx, config) {
  const { workflowEnabled, toolsEnabled, sectionOrder } = config

  // 常驻作家宪法（放进 system prompt，注意力最高处）
  if (workflowEnabled) {
    ctx.effect(() => ctx.systemPrompt.section({
      name: 'dsh-humanizer:workflow',
      order: sectionOrder,
      text: 作家宪法,
    }), 'dsh-humanizer.workflow()')
  }

  if (!toolsEnabled) return

  // 完整理论阅读包：一次返回全部章节全文。这是 v0.3 的核心工具。
  ctx.tools.register(defineTool({
    name: 'humanize_study',
    description:
      '动笔前必调一次。按体裁和模式，一次返回 references/ 全部理论章节全文（按阅读顺序排好）' +
      '与三篇风格不同的示范文。模型必须完整读完，禁止跳读、摘抄、提炼；读完后在思考中成为作者，' +
      '然后开始创作或润色。写作时不再调用本工具，也不再引用章节内容。',
    parameters: {
      text_type: {
        type: 'string',
        required: true,
        description: '体裁：fiction（小说/故事/叙事）、article（文章/评论/论证/说明）、mixed（不确定或混合）',
      },
      mode: {
        type: 'string',
        required: true,
        description: '模式：authoring（创作新文本）或 polishing（润色已有文本）',
      },
    },
    output: {
      schema: { type: 'json' },
      render: (args, value) => [{ type: 'text', text: renderStudyPackage(value) }],
    },
    execute: async (args) => buildStudyPackage(args.text_type, args.mode),
  }))

  // 内容忠实守卫：锚点 + 文字完好性 + 段落变化提示，不做文体扫描、不评分。
  ctx.tools.register(defineTool({
    name: 'humanize_guard',
    description:
      '内容忠实守卫：比对原文与成品，检查内容锚点（数字/书名/术语/等级）是否保留，' +
      '检查成品是否有乱码/控制字符、全角引号是否成对，并报告段落数变化（信息，非失败条件）。' +
      '不评分、不检测、不画像、不扫描文体。',
    parameters: {
      original: { type: 'string', required: true, description: '原文或写作前的事实底稿' },
      rewritten: { type: 'string', required: true, description: '成品或润色后的文本' },
    },
    output: jsonOutput,
    execute: async (args) => guard(String(args.original ?? ''), String(args.rewritten ?? '')),
  }))

  ctx.tools.register(defineTool({
    name: 'humanize_reference',
    description:
      '读取插件自带的方法论文档（references/ 目录：00—20 章）。单独查阅某一章时使用。' +
      '注意：动笔前的完整阅读必须用 humanize_study 一次读完；本工具只用于写作后需要单独回查时。' +
      '任何章节读到清单都不得照做，只能作为理解依据。',
    parameters: {
      name: { type: 'string', required: true, description: '章节标识：章节号（00—20）或文件名关键词，或小节（如 04#4.7）' },
    },
    output: jsonOutput,
    execute: async (args) => readReference(String(args.name ?? '')),
  }))

  // 旧工具兼容替身：分布画像已退役，只回内容锚点。
  ctx.tools.register(defineTool({
    name: 'humanize_profile',
    description:
      '已退役的分布画像工具。v0.3 明确禁止一切画像与表面指标，本工具只保留内容锚点提取，' +
      '供旧调用兼容。需要核对内容请用 humanize_guard。',
    parameters: {
      text: { type: 'string', required: true, description: '待提取内容锚点的中文文本' },
    },
    output: jsonOutput,
    execute: async (args) => legacyProfile(String(args.text ?? '')),
  }))
}
