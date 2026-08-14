// dsh-humanizer —— Node half（Cordis entry · bundle plugin）
//
// 依赖说明：`@deepseek-ai/dsh-tools` 与 `@deepseek-ai/cordis` 声明为
// peerDependencies（^0.1.0-rc.6 / ^4.0.1），由 dsh profile 闭包在挂载时满足；
// 插件不携带自己的副本，避免与宿主闭包版本错配。`@deepseek-ai/schemastery`
// 是普通 dependency，用于 Config 校验。
//
// 本插件 = 三个确定性工具 + 一段常驻 system prompt 工作流引导 + 浏览器半区。
// 定位：编辑辅助，非 AI 检测器，不要求提交外部检测。
//
// 配置（Config，profile patch 可选覆盖；全部带默认值）：
//   workflowEnabled: 是否注入常驻工作流引导（默认 true）
//   toolsEnabled:    是否注册三个确定性工具（默认 true）
//   sectionOrder:    system prompt 工作流段的 order（默认 500，注意力高位）

import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'
import { profile, guard, validateArtifact } from './lib/guard.mjs'

export const name = 'dsh-humanizer'
export const inject = ['tools', 'systemPrompt']

export const Config = z.object({
  workflowEnabled: z.boolean().default(true),
  toolsEnabled: z.boolean().default(true),
  sectionOrder: z.number().default(500),
})

// 常驻 system prompt 的工作流引导（精简版；完整版在 references/00-工作流.md）
const 工作流引导 = `# 中文文本人味化工作流（dsh-humanizer）

## 核心理念
1. 反套路化、反同质化、反模板化——这是十维叙事设计的本质，不是检查清单。
2. 每个章节的功能要不同（事实/关系/解释/风险轮换，连续两章不重复）；限制简单主谓宾句式与短句碎句使用率。
3. 一次一步——十步状态机，每步只产出一个工件、humanize_validate_artifact 校验通过才进下一步。

## 十步状态机
0 接单卡 → 1 十维叙事设计 → 2 功能路径图 → 3 十五层语言分析 → 4 认识来源图 → 5 问题清单 → 6 改写轮1(材料/叙事/论证) → 7 改写轮2(信息/句法) → 8 改写轮3(词汇) → 9 复核 → 10 交付。

## 铁律
禁止略读/概括/打卡式/是-否判断/整体化判断/配额化(配额=新指纹)/英文思考/一次做完。诊断逐细分项，每项写"出现情况与证据 + 为什么(不适用还是漏了)"，证据必须逐字出自原文。改写分三轮自深而浅，每处过修复尺度/候选来源/复杂度门控/理由类别/内容无损。

## 工具
- humanize_profile(text)：分布画像（句长/短句长句占比/连词密度/内容锚点）。
- humanize_guard(original, rewritten)：内容忠实守卫（锚点比对+禁止条件+破折号/半角引号/我是X的/仿佛似乎/不是…而是）。
- humanize_validate_artifact(artifact, source)：工件校验（拒占位空话/空数组/不实证据/过短判断/英文token）。

## 详细方法
十维细分项、十五层细分项、七类高危模式、复核清单等，在插件 references/ 目录（00-工作流.md 与 01—18 章），需要时用 read 工具读取对应文件。`

// 返回对象的工具统一用 JSON 输出 + 文本渲染。
const jsonOutput = {
  schema: { type: 'json' },
  render: (args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
}

export function apply(ctx, config) {
  const { workflowEnabled, toolsEnabled, sectionOrder } = config

  // 常驻工作流引导（放进 system prompt，注意力最高处）
  if (workflowEnabled) {
    ctx.effect(() => ctx.systemPrompt.section({
      name: 'dsh-humanizer:workflow',
      order: sectionOrder,
      text: 工作流引导,
    }), 'dsh-humanizer.workflow()')
  }

  if (!toolsEnabled) return

  ctx.tools.register(defineTool({
    name: 'humanize_profile',
    description:
      '对中文文本做分布异质性画像：句长/段落分布、短句与长句占比、连词密度、' +
      '以及可提取的内容锚点（数字/书名号/引号术语/等级/拉丁token）。' +
      '供人味化诊断阶段参考——是画像信息，不是"去修这些命中"的指令。',
    parameters: {
      text: { type: 'string', required: true, description: '待画像的中文文本' },
    },
    output: jsonOutput,
    execute: async (args) => profile(String(args.text ?? '')),
  }))

  ctx.tools.register(defineTool({
    name: 'humanize_guard',
    description:
      '内容忠实守卫：比对原文与改写稿，检查内容锚点（数字/书名/术语/等级）是否保留，' +
      '并扫描改写稿是否引入乱码、连续重复标点、连续重复字、机械语气词堆砌、破折号、' +
      '半角引号、"我是X的"、仿佛/似乎、不是…而是等禁止条件。用于人味化改写的复核阶段。',
    parameters: {
      original: { type: 'string', required: true, description: '改写前的原文' },
      rewritten: { type: 'string', required: true, description: '改写后的文本' },
    },
    output: jsonOutput,
    execute: async (args) => guard(String(args.original ?? ''), String(args.rewritten ?? '')),
  }))

  ctx.tools.register(defineTool({
    name: 'humanize_validate_artifact',
    description:
      '程序校验人味化诊断工件是否真填满：拒绝"已检查/无异常/正常/OK/无影响/合理"等占位空话，' +
      '拒绝空数组空对象，拒绝过短的判断/理由，校验"证据"字段是否真出自原文，并告警工件中的' +
      '英文 token（疑似英文思考）。用于强制工作流每一步的步间门禁——校验不通过不得进入下一步。',
    parameters: {
      artifact: { type: 'json', required: true, description: '诊断工件（JSON 对象）' },
      source: { type: 'string', description: '待处理原文（用于校验"证据"字段是否真出自原文；可选）' },
    },
    output: jsonOutput,
    execute: async (args) => validateArtifact(args.artifact, String(args.source ?? '')),
  }))
}
