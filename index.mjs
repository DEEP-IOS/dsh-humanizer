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
//   sectionOrder:    system prompt 工作流段的 order（默认 50；官方升序拼接：-100 身份/0 persona/100-199 工具引导；越靠前注意力越高）

import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'
import { profile, guard, validateArtifact } from './lib/guard.mjs'
import { readReference } from './lib/reference.mjs'

export const name = 'dsh-humanizer'
export const inject = ['tools', 'systemPrompt']

export const Config = z.object({
  workflowEnabled: z.boolean().default(true),
  toolsEnabled: z.boolean().default(true),
  sectionOrder: z.number().default(50),
})

// 常驻 system prompt 的工作流引导（精简版；完整版在 references/00-工作流.md）
const 工作流引导 = `# 中文文本人味化工作流（dsh-humanizer）

## 核心理念
1. 反套路化、反同质化、反模板化——这是十维叙事设计的本质，不是检查清单。
2. 每个章节的功能要不同（事实/关系/解释/风险轮换，连续两章不重复）；限制简单主谓宾句式与短句碎句使用率。
3. 一次一步——十步状态机，每步只产出一个工件、humanize_validate_artifact 校验通过才进下一步。

## 十步状态机（每步先读对应章节，读完再产出工件）
0 接单卡（读 §06.1/6.2）→ 1 十维叙事设计（读 §09；论证改读 §08）→ 2 功能路径图（读 §05，八类逐形态）→ 3 十五层语言分析（读 §04，逐细分项＋句式使用率）→ 4 认识与来源图（读 §06.4）→ 5 问题清单（读 §06.6，合并 A/B/C/D）→ 6 改写轮1(只改材料/叙事/论证) → 7 改写轮2(只改信息焦点/照应/句法) → 8 改写轮3(只改词汇/搭配/虚词) → 9 复核（读 §15/§17/§13/§18）→ 10 交付。
每步：产出单一工件 → humanize_validate_artifact 校验通过 → 停止 → 报下一步。

## 铁律（违反任何一条 = 任务失败，必须重来）
1. 禁略读：每格填写并引用原文作证据，不得用"已检查/无异常/正常/OK"等空话填格。
2. 禁概括：不得写总评，必须落到具体章节、层、句、原文。
3. 禁打卡式：改写逐条引用工件某一行；复核必调 humanize_validate_artifact。
4. 禁"是/否"式判断：写不出原因等于没判断。
5. 禁英文思考：思考、字段、标签、理由一律中文（原文术语如 E级/S级/AI 除外）。
6. 禁跳章：诊断按 §02→§05→§09/§08→§04 顺序，缺一章不得进改写。
7. 禁整体化判断：逐细分项过一遍，每项写"出现情况与证据 + 为什么(不适用还是漏了)"。
8. 禁配额化（配额＝新指纹）：不得把手法做成每章配额，插件自身也不得沦为固定配方。
9. 禁一次做完：一次只做一步，完成即停，报"第 N 步完成，下一步第 N+1 步"。

## 工具
- humanize_profile(text)：分布画像（句长/短句长句占比/连词密度/内容锚点）。
- humanize_guard(original, rewritten)：内容忠实守卫（锚点比对+禁止条件+破折号/半角引号/我是X的/仿佛似乎/不是…而是）。
- humanize_validate_artifact(artifact, source)：工件校验（拒占位空话/空数组/不实证据/过短判断/英文token）。
- humanize_reference(name)：读取插件 references/ 章节全文（00—18 或关键词）。

## 参考章节索引（用到哪章读哪章，读完再填）
00 工作流（本引导完整版）｜01 体系目标与边界（五目标六不可承诺，执行前总纲）｜02 人类作者感（材料来源/注意力选择/判断代价/声音稳定/重复功能）｜03 复杂度模型（七层＋门控六问）｜04 十五层语言分析（语素→篇章逐细分项）｜05 功能路径诊断（八类路径＋重复判断）｜06 完整诊断流程（任务边界/内部基线/任务图/认识来源图/修复尺度）｜07 改写决策与候选（决策十步＋候选十来源）｜08 文章类方法（论证图/三段式/模板表达/专业文章保护）｜09 十维叙事审计（小说十维＋三十项核心信号）｜10 三重审核与原理层自检（读者/编辑盲审＋最小差异＋留出测试）｜11 执行表（五张可填表）｜12 执行提示全文（可直接交给执行模型的完整提示）｜13 禁止与回退｜14 检测原理（七类信号＋资料边界）｜15 完成判据（13 条）｜16 问题对照库（16 类常见问题）｜17 复核清单（字词/句法/信息/段落/全文五级）｜18 实战迭代经验（章节任务四类轮换/七类高危/脚本核验清单）。

第 0 步先 humanize_reference('12') 读执行提示全文、humanize_reference('11') 读执行表，作为全程依据。`

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

  ctx.tools.register(defineTool({
    name: 'humanize_reference',
    description:
      '读取插件自带的方法论文档（references/ 目录：00-工作流.md 与 01—18 章）。' +
      '工作流需要章节细则时调用：传章节号（如 05、00）或文件名关键词（如 十维）。' +
      '这是方法论的唯一可达通道——插件包内文件无法用工作区 read 工具读取。',
    parameters: {
      name: { type: 'string', required: true, description: '章节标识：章节号（00—18）或文件名关键词' },
    },
    output: jsonOutput,
    execute: async (args) => readReference(String(args.name ?? '')),
  }))
}







