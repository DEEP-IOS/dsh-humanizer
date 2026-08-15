// dsh-humanizer 理论阅读包组装器（零依赖，Node >= 18，ESM）
//
// v0.3 的核心机制：不让模型"执行规则"，而是让模型在动笔前把 references/ 里的
// 全部理论读进上下文，在思考中成为作者，然后把理论忘记。本模块只做一件事：
// 按体裁和模式，把全部章节排成一条阅读路径，连同示范文一次返回。
//
// 为什么一次返回全文而不是给摘要：任何摘要、提炼、规则列表都是对理论的降维，
// 降维后的规则会重新变成可检测的配方。完整阅读，才可能让理论参与生成而不露形。

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const STUDY_VERSION = '0.3.0'

const REF_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'references')

function listReferenceFiles() {
  return readdirSync(REF_DIR).filter((f) => f.endsWith('.md')).sort()
}

function readChapter(file) {
  return readFileSync(join(REF_DIR, file), 'utf8')
}

// 阅读顺序不是执行步骤：它只是"先建立作者观，再进入语言与叙事知识，最后看失败证据"
// 的认知路径。全部章节都必须完整读完，一章不跳。
const ORDER_KEYS = {
  fiction: [
    '00', '02', '20', '09', '05', '06', '04', '07', '03', '01',
    '10', '14', '13', '16', '17', '11', '12', '15', '18', '19', '08',
  ],
  article: [
    '00', '02', '20', '08', '05', '06', '04', '07', '03', '01',
    '10', '14', '13', '16', '17', '11', '12', '15', '18', '19', '09',
  ],
  mixed: [
    '00', '02', '20', '05', '06', '04', '07', '03', '08', '09',
    '01', '10', '14', '13', '16', '17', '11', '12', '15', '18', '19',
  ],
}

const READING_REASONS = {
  '00': '先确立总姿态：读全、成为作者、一口气写、听一遍、停',
  '02': '理论总纲：材料有来源、注意力有选择、判断有代价、声音稳定、重复有功能',
  '20': '文笔与温度从哪来：声音、句界、在乎、邻接、无痕',
  '09': '小说的叙事知识：十维不是清单，是理解故事从哪里长出来',
  '08': '文章的论证知识：材料、证据强度、结论边界',
  '05': '功能路径：同一路径会穿不同的衣服，改的是材料关系不是词',
  '06': '文本内部基线与认识来源图：先知道谁在说、谁不知道',
  '04': '十五层语言分析：从语素到篇章的完整语言资源，按需理解，不逐层打卡',
  '07': '决策顺序与候选来源：写不出时换组织来源，不是换词',
  '03': '复杂度门控：一切复杂必须来自真实需求',
  '01': '五个目标与六条边界：知道自己不承诺什么',
  '10': '三重审核与留出测试：怎么听、怎么改、什么时候停',
  '14': '七类检测原理：理解对手，但不把它当目标',
  '13': '十二类禁止：所有"为了像人而做"的动作都禁止',
  '16': '问题对照库：每类问题的误判条件，先问是不是误判',
  '17': '五级复核：写完只听一次时用的内部尺度',
  '11': '写作前思考单：只存在思考里，不产出、不引用',
  '12': '执行提示全文：与常驻引导一致',
  '15': '完成判据：写完听一遍，能停才算完成',
  '18': '实战失败证据：配额为什么是新指纹',
  '19': '后处理禁令：为什么润色必须走内源标准',
}

// 三篇示范文：只示范"文本背后站着一个具体的人"是什么感觉。
// 它们风格互不相同，不供模仿任何句式、结构或比例。
const EXAMPLES = [
  {
    style: '第一人称、近距离、对话少、动作与物件多',
    text: '厨房灯坏了三天。她没修，也没说。晚饭端上来的时候，他在灯影里夹菜，筷子在盘沿磕了一下。她听见自己说，明天我去换。其实她只是想，这盏灯要是再坏下去，他们谁也不用看清谁了。',
    note: '不分析它哪里好。读的时候只感受：句子的边界、人的位置、没有说出来的东西。',
  },
  {
    style: '第三人称、外部视角、环境不替人物说话',
    text: '雨一停，渡口的人就少了。老陈把船绳又绕了一圈，才问，走不走。那人蹲在石阶上啃饼，没抬头。饼渣掉进青石缝里，几只蚂蚁已经等在那儿。',
    note: '不分析它哪里好。读的时候只感受：对话的节奏、注意力的选择、结尾停在哪里。',
  },
  {
    style: '议论、判断有保留、材料先于结论',
    text: '这份报告的可信度不在结论，在它自己承认的三处空白：样本没有覆盖小城市，问卷收回率不到六成，负责访谈的人同时是利益相关方。所以它只支持一个判断：趋势存在，幅度不确定。',
    note: '不分析它哪里好。读的时候只感受：证据的强度、结论的边界、作者不肯多迈的那一步。',
  },
]

function resolveOrder(orderKeys, files) {
  const ordered = []
  const used = new Set()
  for (const key of orderKeys) {
    const file = files.find((f) => f.startsWith(`${key}-`) || f === `${key}.md`)
    if (file && !used.has(file)) {
      used.add(file)
      ordered.push({ key, file, reason: READING_REASONS[key] || '完整读，不提炼' })
    }
  }
  // 保险：任何没排进路径的章节按文件名补在最后，确保一次返回全部。
  for (const file of files) {
    if (!used.has(file)) {
      used.add(file)
      const key = file.slice(0, 2)
      ordered.push({ key, file, reason: READING_REASONS[key] || '完整读，不提炼' })
    }
  }
  return ordered
}

function normalizeMode(mode) {
  const m = String(mode ?? '').trim().toLowerCase()
  if (m === 'polishing' || m === 'polish') return 'polishing'
  return 'authoring'
}

function normalizeTextType(textType) {
  const t = String(textType ?? '').trim().toLowerCase()
  if (t.includes('article') || t.includes('essay') || t.includes('评论') || t.includes('文章') || t.includes('论证') || t.includes('说明')) return 'article'
  if (t.includes('fiction') || t.includes('novel') || t.includes('story') || t.includes('小说') || t.includes('故事') || t.includes('叙事')) return 'fiction'
  return 'mixed'
}

export function buildStudyPackage(textType = 'mixed', mode = 'authoring') {
  const type = normalizeTextType(textType)
  const m = normalizeMode(mode)
  const files = listReferenceFiles()
  const order = resolveOrder(ORDER_KEYS[type], files)

  const chapters = order.map(({ file }) => ({ name: file, text: readChapter(file) }))

  const modeContract = m === 'authoring'
    ? '创作模式：读完以后，你不是执行者，是作者。动笔前在思考中成为这次要写的人，一口气写完；写时不再检查理论；写完把自己当第一次读到它的读者，听一遍，只改真实的不适，然后停。'
    : '润色模式：把原文当成一位认真作者的草稿，不预设它是 AI。先在思考中从原文反推这位作者知道什么、在乎什么、声音是什么，然后只改没写到位的地方：断了、硬了、凉了、空了、说多了。其余一字不动。改完读接缝，消除新旧差异，然后停。外部清单、评分、检测一律不得进入。'

  return {
    meta: {
      tool: 'dsh-humanizer study',
      version: STUDY_VERSION,
      textType: type,
      mode: m,
      chapterCount: chapters.length,
      note: '一次返回 references/ 全部章节全文。读全，不提炼，不摘抄，不跳读。',
    },
    principle: [
      '理论完整地放在思考层，文本层不许露出理论的任何形状。',
      '你不执行方法，你成为作者。写作时把理论忘掉，读者才看不见理论。',
      '文笔来自声音，句界来自感知与呼吸，温度来自在乎，自然来自材料邻接，机械感的反面是看不见工序。',
    ],
    reading_order: order.map(({ key, file, reason }) => ({ key, file, reason })),
    mode_contract: modeContract,
    before_writing: [
      '在思考中回答，不产出任何工件、表格、栏目：这次要写什么，要改变读者的什么。',
      '材料：谁知道的、通过什么途径、此刻为什么说、可能只知道多少；推断不写成事实。',
      '注意力：谁在看、为了什么看、有意不写什么；开头由当前目的决定。',
      '判断：哪些确定、哪些推测、哪些保留；判断错了付出什么；允许局部结论与未决材料。',
      '声音：这篇是谁在说，词汇层级、句流、冷热、幽默、停顿、隐瞒方式是什么。',
      '重复与保护：哪些人名、术语、口癖、意象、伏笔和有功能句式必须稳定。',
      '第一句想落在什么位置，最后一句想让读者停在什么感觉上。',
      '这些内容只用于让自己进入状态，完成后不再引用，也不写进正文。',
    ],
    while_writing: [
      '一口气写，不边写边对照理论。',
      '句子边界只有三个来源：一次感知、一个动作、一口气。不为长短交替而切，不为变化而拆。',
      '温度不靠写"温暖、感动、心酸"，靠叙述者盯住的具体事物、在乎和不肯说的话。',
      '转折靠材料与语气的邻接自然发生；连词只在逻辑真的会丢时才出现。',
      '写到卡住，回到材料、注意力或判断，不要换句式。',
    ],
    after_writing: [
      '把自己当第一次读这篇东西的读者，听哪里断了、硬了、凉了、空了、说多了。',
      '只改这些真实的不适。没有不适，就交付，不要"再顺一遍"。',
      '不评分，不检测，不画像，不按任何清单复查。',
    ],
    forbidden: [
      '不把理论提炼成几条规则，不画执行表，不逐条打勾。',
      '不把章号、栏目名、方法术语写进正文或思考记录。',
      '不做句长、连词、特征字、段落数等表面指标目标。',
      '不做"每章一处X""全文只准一次Y"等配额。',
      '不误伤人名、术语、口癖、意象、伏笔与有功能重复。',
      '无法证明修改必要，保持原文。',
    ],
    chapters,
    examples: EXAMPLES,
    final_note: '读完全部章节并完成思考层准备后，才开始写或改。此后不再调用本章节文本，也不再回看方法；写作时你只是作者。',
  }
}

// 把阅读包渲染成一段连续文本给模型读。避免 JSON 转义膨胀，也避免模型把
// 阅读包当成数据结构去"填表"：它就是一本书，读完即可。
export function renderStudyPackage(pkg) {
  const lines = []
  lines.push(`# dsh-humanizer 完整阅读包（${pkg.meta.textType} / ${pkg.meta.mode}）`)
  lines.push(pkg.meta.note)
  lines.push('')
  lines.push('## 总原则')
  for (const p of pkg.principle) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## 模式契约')
  lines.push(pkg.mode_contract)
  lines.push('')
  lines.push('## 动笔前（只在思考中，不产出）')
  for (const p of pkg.before_writing) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## 写作中')
  for (const p of pkg.while_writing) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## 写完后')
  for (const p of pkg.after_writing) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## 禁止')
  for (const p of pkg.forbidden) lines.push(`- ${p}`)
  lines.push('')
  lines.push('## 阅读顺序（全部读完，一章不跳）')
  pkg.reading_order.forEach((o, i) => lines.push(`${i + 1}. ${o.file} —— ${o.reason}`))
  lines.push('')
  lines.push('## 章节全文')
  for (const c of pkg.chapters) {
    lines.push('')
    lines.push(`# --- 阅读：${c.name} ---`)
    lines.push('')
    lines.push(c.text)
  }
  lines.push('')
  lines.push('## 示范文（只感受背后有人，不模仿任何句式与结构）')
  pkg.examples.forEach((e, i) => {
    lines.push('')
    lines.push(`### 示范 ${i + 1}：${e.style}`)
    lines.push('')
    lines.push(e.text)
    lines.push('')
    lines.push(e.note)
  })
  lines.push('')
  lines.push('## 读完以后')
  lines.push(pkg.final_note)
  return lines.join('\n')
}
