// dsh-humanizer 确定性层（零依赖，Node >= 18，ESM）
//
// 定位（v0.3 重构）：**内容忠实守卫 + 分布异质性画像**，不是"AI 味检测器"。
//
// 为什么不再做"AI 味正则检测"：检测器测的是词元概率分布 / 预测偏好 / 多尺度
// 节律 / 重写距离（这些对正则完全不可见）；而把"正则命中列表"回喂给模型"去修"
// 只会逼模型做机械替换，产出更机械、更带机器指纹的东西——反效果。
//
// 所以本层只做三件程序真正擅长、且不会机械化的确定性工作：
//   1. profile(text)：分布异质性画像（句长/段落分布/连词密度）+ 内容锚点提取，
//      供"诊断阶段"参考——是**信息**，不是"去修这些命中"的指令。
//   2. guard(original, rewritten)：内容忠实守卫——锚点（数字/书名/术语/等级）
//      是否保留 + 禁止条件（乱码/连续重复标点/连续重复字/机械语气词堆砌）扫描。
//   3. 字数/结构变化。
//
// "人味"的深层工作（十维叙事审计 / 功能路径 / 15 层分布）全部由模型结合
// humanizer skill 完成，不由正则完成。

export const GUARD_VERSION = '0.3.0'

function normalize(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function round2(n) {
  return Math.round(n * 100) / 100
}

// ---- 分布异质性画像 ----
function computeMetrics(text) {
  const chars = Array.from(text).length
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const sentences = text.split(/[。！？!?；;\n]+/).map((s) => s.trim()).filter(Boolean)

  const sentenceLengths = sentences.map((s) => Array.from(s).length)
  const avgSentenceLen = sentenceLengths.length
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    : 0
  const sentenceVar =
    sentenceLengths.length > 1
      ? sentenceLengths.reduce((a, b) => a + (b - avgSentenceLen) ** 2, 0) /
        (sentenceLengths.length - 1)
      : 0

  const paraLengths = paragraphs.map((p) => Array.from(p).length)
  const avgParaLen = paraLengths.length
    ? paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length
    : 0
  const paraVar =
    paraLengths.length > 1
      ? paraLengths.reduce((a, b) => a + (b - avgParaLen) ** 2, 0) /
        (paraLengths.length - 1)
      : 0

  // 连词密度（信息，非"去修"）
  const connectors = ['首先', '其次', '此外', '与此同时', '然而', '因此', '综上', '最后', '一方面', '另一方面']
  let connectorCount = 0
  for (const c of connectors) {
    let idx = text.indexOf(c)
    while (idx !== -1) {
      connectorCount += 1
      idx = text.indexOf(c, idx + Array.from(c).length)
    }
  }

  // 短句/长句占比（§18 限制短句碎句使用率；信息，非"去修"）
  const totalSentences = sentenceLengths.length
  const shortCount = sentenceLengths.filter((n) => n <= 8).length
  const longCount = sentenceLengths.filter((n) => n >= 30).length

  return {
    chars,
    paragraphs: paragraphs.length,
    sentences: totalSentences,
    avgSentenceLen: round2(avgSentenceLen),
    sentenceLenStdDev: round2(Math.sqrt(sentenceVar)),
    avgParaLen: round2(avgParaLen),
    paraLenStdDev: round2(Math.sqrt(paraVar)),
    shortSentenceRatio: totalSentences ? round2((shortCount / totalSentences) * 100) : 0,
    longSentenceRatio: totalSentences ? round2((longCount / totalSentences) * 100) : 0,
    connectorDensityPer1k: round2((connectorCount / Math.max(chars, 1)) * 1000),
    note: '分布指标是画像信息，用于诊断"分布是否集中在单一选择/短句是否过多"；不是"去修这些命中"的指令。',
  }
}

// ---- 逐段分布画像（§18 第 6 条"逐章"诊断粒度；只画像，不判定）----
// 按空行切段；每段给出句长分布 + §18 特征字计数（破折号/像/忽然/心里/仿佛/似乎）。
// 特征字是裸计数（含复合词），仅供模型对照 §18 阈值自行判断，本层不下结论。
const SEGMENT_FEATURES = {
  emDash: /——|—/g,
  halfwidthQuote: /"/g,
  像: /像/g,
  忽然: /忽然/g,
  心里: /心里/g,
  仿佛: /仿佛/g,
  似乎: /似乎/g,
}

function computeSegments(text) {
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  return paragraphs.map((p, i) => {
    const chars = Array.from(p).length
    const sentences = p.split(/[。！？!?；;\n]+/).map((s) => s.trim()).filter(Boolean)
    const lens = sentences.map((s) => Array.from(s).length)
    const features = {}
    for (const [k, re] of Object.entries(SEGMENT_FEATURES)) {
      features[k] = (p.match(re) || []).length
    }
    return {
      index: i + 1,
      chars,
      sentences: lens.length,
      avgSentenceLen: lens.length ? round2(lens.reduce((a, b) => a + b, 0) / lens.length) : 0,
      shortCount: lens.filter((n) => n <= 8).length,
      longCount: lens.filter((n) => n >= 30).length,
      features,
    }
  })
}
// ---- 内容锚点提取（内容忠实的比对基准）----
function extractAnchors(text) {
  const anchors = []
  const push = (type, value) => {
    if (value && value.trim()) anchors.push({ type, value: value.trim() })
  }

  // 顺序 = 重要性：数字/百分比 → 等级 → 拉丁 token → 书名号 → 短引号术语。
  // 对话长引号是"待改写内容"，不是"必须逐字保留"的锚点，故只收短且不含句末标点的引号。
  for (const m of text.matchAll(/\d+(?:[.,，]\d+)*(?:%|％)?/g)) push('number', m[0])
  for (const m of text.matchAll(/[A-Za-z]\s*级/g)) push('grade', m[0])
  for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9_-]{1,20}/g)) push('latin', m[0])
  for (const m of text.matchAll(/《[^》\n]{1,40}》/g)) push('book', m[0])
  for (const m of text.matchAll(/“[^”\n]{1,16}”/g)) {
    if (!/[。！？!?；;]/.test(m[0])) push('quoted', m[0])
  }

  // 去重 + 限数量
  const seen = new Set()
  const deduped = []
  for (const a of anchors) {
    if (a.value.length <= 40 && !seen.has(a.value)) {
      seen.add(a.value)
      deduped.push(a)
      if (deduped.length >= 200) break
    }
  }
  return deduped
}

// ---- 禁止条件扫描（§13：不通过病句/乱码/随机标点/机械口语装人）----
function scanForbidden(text) {
  const findings = []
  const scan = (type, re, hint) => {
    const matches = [...text.matchAll(re)]
    if (matches.length > 0) {
      findings.push({
        type,
        count: matches.length,
        hint,
        excerpts: matches.slice(0, 5).map((m) => m[0]),
      })
    }
  }
  scan('replacement-or-control-char', /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '乱码/替换字符/控制字符，疑似编码损坏')
  scan('repeated-punctuation', /[。！？…!?，,；;：:.]{3,}/g, '连续重复标点（3+），疑似为制造"不工整"而堆砌')
  scan('repeated-char', /(.)\1{4,}/g, '同一字符连续 5+ 次，疑似机械重复')
  scan('interjection-pile', /[啊哈嗯哦呀诶哎哟嘿]{3,}/g, '机械语气词堆砌（3+），疑似口语注水')

  // §18 实战验证的禁止条件（脚本核验清单；阈值是项目级经验，仅作核验信号，非"去修"指令）
  scan('em-dash', /——|—/g, '破折号——（§18 清单第1条核验信号；项目级规范为 0，通用场景作参考，对话打断用动作/短句承接）')
  scan('halfwidth-quote', /"/g, '半角引号"（§18 清单第2条核验信号；项目级规范为 0，对话统一用全角""）')
  scan('self-naming-emotion', /我是[^，。！？]{1,8}的/g, '"我是X的"命名情绪句式（§18 清单第3条核验信号；项目级规范为 0，情绪改用动作/停顿/物件承载）')
  scan('psych-proxy', /我这才(?:明白|知道)|我先前(?:以为|还想着|想着)|我本来(?:以为|想着)|我当时(?:以为|觉得|想着)|我才明白|才想明白|意识到/g, '心理代理套路（§18 清单第4条：我这才明白/知道、我先前/本来/当时＋以为/想着，认知改用物件或行为自证）')
  scan('vague-simile', /仿佛|似乎/g, '仿佛/似乎（§18 清单第5条：宜白描，确有需要才留个别）')
  scan('negation-reversal', /不是.{0,6}而是/g, '不是…而是（§18 清单第5条：全卷宜≤1）')

  const leftQuote = (text.match(/“/g) || []).length
  const rightQuote = (text.match(/”/g) || []).length
  if (leftQuote !== rightQuote) {
    findings.push({ type: 'unpaired-quote', count: Math.abs(leftQuote - rightQuote), hint: `全角引号不成对（左“ ${leftQuote}，右” ${rightQuote}）`, excerpts: [] })
  }
  return findings
}

// ---- 工件校验（结构强制：防打卡式/防略读/防概括/防"是/否"式敷衍/防英文思考）----
// 占位空话：模型试图用"已检查/无异常/正常/OK/无影响/合理"等蒙混过关时，直接判失败。
const PLACEHOLDER_PATTERNS = [
  /^无异常$/, /^已检查$/, /^正常$/, /^无明显问题$/, /^符合$/, /^无需修改$/,
  /^无问题$/, /^良好$/, /^尚可$/, /^略$/, /^暂无$/, /^无明显$/, /^不明显$/,
  /^无痕$/, /^没问题$/, /^无$/, /^好$/, /^ok$/i, /^none$/i, /^n\/a$/i,
  /^—$/, /^-$/, /^√$/, /^✓$/, /^\.+$/,
  // 判断/理由字段的敷衍答案（"是/否"式塌缩）
  /^是$/, /^否$/, /^是\/否$/, /^无影响$/, /^不影响$/, /^没有影响$/, /^不变$/,
  /^保持不变$/, /^未改动$/, /^未改$/, /^合理$/, /^正确$/, /^合适$/, /^恰当$/,
  /^符合语境$/, /^无需改$/, /^无需调整$/, /^基本符合$/, /^基本合理$/, /^大体符合$/,
]

function isPlaceholder(value) {
  const s = String(value).trim()
  if (s.length === 0) return true
  return PLACEHOLDER_PATTERNS.some((re) => re.test(s))
}

function stripEvidencePrefix(s) {
  return s.replace(/^(原文[：:]?|原文|证据[：:]?|例如[：:]?|如[：:]?|例[：:]?|【[^】]*】)\s*/, '')
}

function isEvidenceKey(key) {
  return /证据|原文|引用/.test(key)
}

function isReasoningKey(key) {
  return /判断|理由|说明|原因|理解/.test(key)
}

// 铁律 5 例外：原文术语（如 AI）不算英文思考；其余 2+ 字母拉丁 token 告警"疑似英文思考"
const LEGAL_LATIN_TERMS = new Set(['AI', 'AIGC'])

export function validateArtifact(artifact, source) {
  const report = {
    ok: true,
    totalFields: 0,
    emptyOrPlaceholder: [],
    unverifiedEvidence: [],
    shortReason: [],
    englishTokens: [],
    note: '程序校验：占位空话/证据不实/判断过短 = 失败；英文 token 仅告警，需确认是否原文术语。',
  }
  const sourceText = normalize(source ?? '')

  const walk = (obj, path) => {
    if (obj === null || obj === undefined) {
      report.emptyOrPlaceholder.push({ path: path || '(根)', reason: '值为空', value: '' })
      report.ok = false
      return
    }
    if (typeof obj === 'string') {
      report.totalFields += 1
      const s = obj.trim()
      if (isPlaceholder(s)) {
        report.emptyOrPlaceholder.push({ path: path || '(根)', reason: '空或占位空话', value: s.slice(0, 20) })
        report.ok = false
      }
      const key = (path.split('.').pop() || '').split('[')[0] || ''
      if (isReasoningKey(key) && s.length > 0 && s.length < 8) {
        report.shortReason.push({ path: path || '(根)', reason: '判断/理由过短，疑似敷衍', value: s.slice(0, 20) })
        report.ok = false
      }
      if (isEvidenceKey(key) && sourceText && s.length > 0) {
        const core = stripEvidencePrefix(s)
        if (core.length > 0 && !sourceText.includes(core)) {
          report.unverifiedEvidence.push({ path: path || '(根)', reason: '证据未在原文中找到', value: s.slice(0, 40) })
          report.ok = false
        }
      }
      const latin = (s.match(/[A-Za-z]{2,}/g) || []).filter((t) => !LEGAL_LATIN_TERMS.has(t))
      if (latin.length > 0) {
        report.englishTokens.push({ path: path || '(根)', value: s.slice(0, 40), tokens: latin.slice(0, 5) })
      }
      return
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        report.emptyOrPlaceholder.push({ path: path || '(根)', reason: '数组为空', value: '[]' })
        report.ok = false
      }
      obj.forEach((item, i) => walk(item, `${path}[${i}]`))
      return
    }
    if (typeof obj === 'object') {
      const entries = Object.entries(obj)
      if (entries.length === 0) {
        report.emptyOrPlaceholder.push({ path: path || '(根)', reason: '对象为空', value: '{}' })
        report.ok = false
      }
      for (const [k, v] of entries) walk(v, path ? `${path}.${k}` : k)
      return
    }
    // 其他类型（number/boolean）不计入文本字段
  }

  walk(artifact, '')
  return report
}

// ---- 对外导出 ----
export function profile(text) {
  const t = normalize(text)
  return {
    meta: {
      tool: 'dsh-humanizer profile',
      version: GUARD_VERSION,
      note: '全文分布画像 + 逐段分布 + 内容锚点；供人味化诊断阶段参考，非"去修"指令。',
    },
    metrics: computeMetrics(t),
    segments: computeSegments(t),
    anchors: extractAnchors(t),
  }
}

export function guard(original, rewritten) {
  const o = normalize(original)
  const r = normalize(rewritten)
  const anchors = extractAnchors(o)
  const compared = anchors.map((a) => ({ ...a, preserved: r.includes(a.value) }))
  const missing = compared.filter((a) => !a.preserved)

  return {
    meta: {
      tool: 'dsh-humanizer guard',
      version: GUARD_VERSION,
      note: '内容忠实守卫 + 禁止条件扫描；锚点"疑似改动/缺失"需人工确认是否属故意改写。',
    },
    charDelta: {
      originalChars: Array.from(o).length,
      rewrittenChars: Array.from(r).length,
      delta: round2(Array.from(r).length - Array.from(o).length),
    },
    fidelity: {
      totalAnchors: anchors.length,
      preserved: anchors.length - missing.length,
      missing: missing.map((m) => ({ type: m.type, value: m.value })),
    },
    forbidden: scanForbidden(r),
  }
}


