// dsh-humanizer 确定性层（零依赖，Node >= 18，ESM）
//
// 定位（v0.3）：**内容忠实守卫 + 旧工具兼容替身**。
//
// v0.3 取消了一切程序化思考校验：写作前的思考是否完整，由 humanize_study 完整阅读
// 与"成为作者"的姿态保证，不由程序检查。程序只保留两件安全的事：
//   1. guard(original, rewritten)：内容锚点保真 + 文字完好性（编码/引号成对）
//      + 段落结构变化提示。不评分、不检测、不画像、不扫描文体。
//   2. legacyProfile(text)：旧 humanize_profile 的兼容替身，只返回内容锚点。
//
// 本文件保留 validateArtifact / validateDecision 仅作库级兼容；v0.3 起它们不再注册为工具。

export const GUARD_VERSION = '0.5.0'

function normalize(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function round2(n) {
  return Math.round(n * 100) / 100
}

// ---- 内容锚点提取（内容忠实的比对基准）----
export function extractAnchors(text) {
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

// ---- 文字完好性扫描（只查编码损坏与引号成对，不查文体）----
function scanIntegrity(text) {
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

  const leftQuote = (text.match(/“/g) || []).length
  const rightQuote = (text.match(/”/g) || []).length
  if (leftQuote !== rightQuote) {
    findings.push({
      type: 'unpaired-quote',
      count: Math.abs(leftQuote - rightQuote),
      hint: `全角引号不成对（左“ ${leftQuote}，右” ${rightQuote}）`,
      excerpts: [],
    })
  }
  return findings
}

// ---- 段落结构变化提示（信息，不是失败条件）----
function countParagraphs(text) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length
}

// ---- 旧工具兼容：只回锚点，不回分布 ----
export function legacyProfile(text) {
  const t = normalize(text)
  return {
    deprecated: true,
    note: 'v0.2 起 humanize_profile 已退役，v0.3 起禁止一切画像与表面指标。现在只返回内容锚点；需要核对内容请用 humanize_guard。',
    anchors: extractAnchors(t),
  }
}

// ---- 内容忠实守卫 ----
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
      note: '内容忠实守卫 + 文字完好性 + 段落变化提示。只核对内容与文字是否损坏，不做 AI 味扫描。锚点"疑似改动/缺失"需人工确认是否属故意改写。',
    },
    charDelta: {
      originalChars: Array.from(o).length,
      rewrittenChars: Array.from(r).length,
      delta: round2(Array.from(r).length - Array.from(o).length),
    },
    paragraphs: {
      originalCount: countParagraphs(o),
      rewrittenCount: countParagraphs(r),
      delta: countParagraphs(r) - countParagraphs(o),
      note: '段落数变化是信息，不是失败条件；若段落被拆合，必须能说出材料或语气上的真实理由（§13 禁止第 8 条）。',
    },
    fidelity: {
      totalAnchors: anchors.length,
      preserved: anchors.length - missing.length,
      missing: missing.map((m) => ({ type: m.type, value: m.value })),
    },
    integrity: scanIntegrity(r),
  }
}

// ---- 工件校验（结构强制：防打卡式/防略读/防敷衍/防英文思考）----
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

// 英文思考告警的例外：原文术语（如 AI）不算英文思考；其余 2+ 字母拉丁 token 告警。
const LEGAL_LATIN_TERMS = new Set(['AI', 'AIGC'])

function collectTexts(value, path, out) {
  if (typeof value === 'string') {
    out.push({ path: path || '(根)', value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectTexts(item, `${path}[${i}]`, out))
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      collectTexts(v, path ? `${path}.${k}` : k, out)
    }
  }
}

// 决策单四栏：这是写作的前置条件，不是文本表面指标，因此允许作为统一约束。
// 它们只决定"材料、注意力、判断"是否做过选择，不决定句长、词表、句式，
// 所以不会形成文本层的新指纹。
const DECISION_SECTIONS = [
  { id: '材料来源', pattern: /材料.*来源|来源.*材料|^来源$/ },
  { id: '注意力选择', pattern: /注意力/ },
  { id: '判断代价', pattern: /判断.*代价|代价/ },
  { id: '保护清单', pattern: /保护/ },
]

function findSectionValues(value, pattern, path, out) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => findSectionValues(item, pattern, `${path}[${i}]`, out))
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const p = path ? `${path}.${k}` : k
      if (pattern.test(k)) out.push({ key: k, path: p, value: v })
      findSectionValues(v, pattern, p, out)
    }
  }
}

// 配额化声明：决策单里出现"每章一处X / 全文只准一次 / 句长占比目标"，本身就是
// v4 失败的原因（配额＝新指纹）。程序直接判失败。
const QUOTA_PATTERNS = [
  { name: '每单元配额', re: /每[章篇段落节][^。\n]{0,20}(一处|一次|一条|一个)/g },
  { name: '全文限次', re: /(全文|全卷|整篇)[^。\n]{0,15}(只准|只允许|仅允许|最多)[^。\n]{0,10}(一次|一处|一条)/g },
  { name: '表面指标目标', re: /(句长|长句|短句|连词|破折号|特征字|占比|标准差)[^。\n]{0,12}(≥|≤|=\s*\d|\d+\s*%|\d+\s*(次|处))/g },
]

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

// ---- 写作决策单校验 ----
export function validateDecision(decision, source) {
  const sourceText = normalize(source ?? '')
  const report = {
    ok: true,
    sections: {},
    missingSections: [],
    emptySections: [],
    placeholder: [],
    unverifiedEvidence: [],
    quotaViolations: [],
    englishTokens: [],
    note: '决策单四栏（材料来源/注意力选择/判断代价/保护清单）必须逐栏真填满；出现配额化声明直接失败。证据校验只在提供原文时进行。',
  }

  if (decision === null || decision === undefined || typeof decision !== 'object' || Array.isArray(decision)) {
    report.ok = false
    report.missingSections = DECISION_SECTIONS.map((s) => s.id)
    report.note = '决策单必须是包含四栏的对象。'
    return report
  }

  for (const section of DECISION_SECTIONS) {
    const hits = []
    findSectionValues(decision, section.pattern, '', hits)
    const problems = []
    let substantive = false

    if (hits.length === 0) {
      report.missingSections.push(section.id)
      report.sections[section.id] = '缺失'
      report.ok = false
      continue
    }

    for (const hit of hits) {
      const v = hit.value
      if (v === null || v === undefined) {
        problems.push(`${hit.path} 为空`)
        continue
      }
      if (Array.isArray(v)) {
        if (v.length === 0) {
          problems.push(`${hit.path} 为空数组`)
          continue
        }
        const texts = []
        collectTexts(v, hit.path, texts)
        for (const t of texts) {
          const s = t.value.trim()
          if (s.length === 0 || isPlaceholder(s)) {
            problems.push(`${t.path} 为空或占位空话`)
          } else if (s.length < 2) {
            problems.push(`${t.path} 过短，疑似敷衍`)
          } else {
            substantive = true
          }
        }
      } else if (typeof v === 'string') {
        const s = v.trim()
        if (s.length === 0 || isPlaceholder(s)) {
          problems.push(`${hit.path} 为空或占位空话`)
        } else if (s.length < 2) {
          problems.push(`${hit.path} 过短，疑似敷衍`)
        } else {
          substantive = true
        }
      } else if (typeof v === 'object') {
        const entries = Object.entries(v)
        if (entries.length === 0) {
          problems.push(`${hit.path} 为空对象`)
        } else {
          const texts = []
          collectTexts(v, hit.path, texts)
          for (const t of texts) {
            const s = t.value.trim()
            if (s.length === 0 || isPlaceholder(s)) {
              problems.push(`${t.path} 为空或占位空话`)
            } else if (s.length < 2) {
              problems.push(`${t.path} 过短，疑似敷衍`)
            } else {
              substantive = true
            }
          }
        }
      }
    }

    if (!substantive || problems.length > 0) {
      report.emptySections.push({ section: section.id, problems })
      report.sections[section.id] = problems.length ? `存在问题：${problems.join('；')}` : '无实质内容'
      report.ok = false
    } else {
      report.sections[section.id] = '已真填满'
    }
  }

  const allTexts = []
  collectTexts(decision, '', allTexts)
  for (const t of allTexts) {
    const s = t.value.trim()
    const key = (t.path.split('.').pop() || '').split('[')[0] || ''
    if (isEvidenceKey(key) && sourceText && s.length > 0) {
      const core = stripEvidencePrefix(s)
      if (core.length > 0 && !sourceText.includes(core)) {
        report.unverifiedEvidence.push({ path: t.path, reason: '证据未在原文中找到', value: s.slice(0, 40) })
        report.ok = false
      }
    }
    const latin = (s.match(/[A-Za-z]{2,}/g) || []).filter((tok) => !LEGAL_LATIN_TERMS.has(tok))
    if (latin.length > 0) {
      report.englishTokens.push({ path: t.path, value: s.slice(0, 40), tokens: latin.slice(0, 5) })
    }
  }

  const joined = allTexts.map((t) => t.value).join('\n')
  for (const q of QUOTA_PATTERNS) {
    const matches = [...joined.matchAll(q.re)]
    if (matches.length > 0) {
      report.quotaViolations.push({
        name: q.name,
        count: matches.length,
        reason: '决策单出现配额化声明；配额＝新指纹，必须删除后重填',
        excerpts: matches.slice(0, 5).map((m) => m[0]),
      })
      report.ok = false
    }
  }

  return report
}
