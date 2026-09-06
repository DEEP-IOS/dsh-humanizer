// dsh-humanizer references/ 读取器（零依赖，Node >= 18，ESM）
//
// 定位：打通方法论的可达性——references/ 是插件包内数据文件，模型无法用
// 工作区 read 工具定位（npm 安装后位于 profile 闭包内）；本模块由
// humanize_reference 工具调用，从插件自身目录读取并返回章节全文或小节。

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const REF_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'references')
let referenceFiles
const chapterTexts = new Map()

/** 返回 references/ 下全部章节文件名（升序）。 */
export function listReferences() {
  referenceFiles ??= readdirSync(REF_DIR).filter((f) => f.endsWith('.md')).sort()
  return [...referenceFiles]
}

/** 仅读取包内已列出的章节；缓存不可变全文，更新插件后重启生效。 */
export function readReferenceChapter(file) {
  if (!listReferences().includes(file)) throw new Error(`未找到章节 ${file}`)
  if (!chapterTexts.has(file)) chapterTexts.set(file, readFileSync(join(REF_DIR, file), 'utf8'))
  return chapterTexts.get(file)
}

/** 按一/二/三级 markdown 标题切分章节，返回 { title, body } 列表。 */
function splitSections(text) {
  const lines = text.split('\n')
  const sections = []
  let current = { title: '(引言)', body: [] }
  for (const line of lines) {
    const h = line.match(/^##\s+(.+)$/)
    if (h) {
      if (current.body.length) sections.push(current)
      current = { title: h[1].trim(), body: [] }
    } else {
      current.body.push(line)
    }
  }
  if (current.body.length) sections.push(current)
  return sections.map((s) => ({ title: s.title, body: s.body.join('\n').trim() }))
}

/**
 * 读取章节全文或小节。
 * - "05" / "00-工作流"：章节号或文件名，返回全文
 * - "04#4.7" / "04 特殊句式"：章节号 + 节号/节标题关键词，返回该小节
 * - "十维"：文件名关键词，唯一匹配返回全文
 * @param {string} query
 */
export function readReference(query) {
  const files = listReferences()
  const q = String(query ?? '').trim()
  if (!q) {
    return { available: files, note: '未指定章节；传 00—20（如 "05"、"00-工作流"），或 "04#4.7" 读小节。' }
  }

  // 小节读取："04#4.7" / "04 特殊句式"
  const secMatch = q.match(/^(\d{2})[#\s]+(.+)$/)
  if (secMatch) {
    const chap = secMatch[1]
    const sec = secMatch[2]
    const file = files.find((f) => f.startsWith(`${chap}-`) || f === `${chap}.md`)
    if (!file) return { error: `未找到章节 ${chap}`, available: files }
    const text = readReferenceChapter(file)
    const sections = splitSections(text)
    const found =
      sections.find((s) => s.title === sec || s.title.startsWith(sec)) ||
      sections.find((s) => s.title.includes(sec))
    if (found) return { name: file, section: found.title, text: found.body }
    return { error: `未找到 "${sec}" 于 ${file}`, available: sections.map((s) => s.title) }
  }

  const exact = files.find((f) => f === `${q}.md` || f.startsWith(`${q}-`))
  if (exact) return { name: exact, text: readReferenceChapter(exact) }
  const matched = files.filter((f) => f.includes(q))
  if (matched.length === 1) return { name: matched[0], text: readReferenceChapter(matched[0]) }
  if (matched.length > 1) return { available: matched, note: `"${q}" 匹配多个章节，请精确到 00—20。` }
  return { error: `未找到 "${q}"`, available: files }
}

