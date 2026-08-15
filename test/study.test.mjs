import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildStudyPackage, renderStudyPackage, STUDY_VERSION } from '../lib/study.mjs'
import { listReferences } from '../lib/reference.mjs'

test('STUDY_VERSION 为 semver', () => {
  assert.match(STUDY_VERSION, /^\d+\.\d+\.\d+$/)
})

test('study: fiction/authoring 一次返回全部章节', () => {
  const r = buildStudyPackage('fiction', 'authoring')
  const files = listReferences()
  assert.equal(r.meta.mode, 'authoring')
  assert.equal(r.meta.textType, 'fiction')
  assert.equal(r.meta.chapterCount, files.length)
  assert.equal(r.chapters.length, files.length)
  assert.equal(r.reading_order.length, files.length)
  const names = new Set(r.chapters.map((c) => c.name))
  assert.equal(names.size, files.length, '章节不得重复')
  for (const f of files) assert.ok(names.has(f), `缺少 ${f}`)
})

test('study: article/polishing 顺序与模式契约', () => {
  const r = buildStudyPackage('article', 'polishing')
  assert.equal(r.meta.mode, 'polishing')
  assert.equal(r.meta.textType, 'article')
  const keys = r.reading_order.slice(0, 4).map((x) => x.key)
  assert.deepEqual(keys, ['00', '02', '20', '08'])
  assert.ok(r.mode_contract.includes('认真作者的草稿'))
  assert.ok(r.mode_contract.includes('一字不动'))
})

test('study: mixed 顺序与创作契约', () => {
  const r = buildStudyPackage('mixed', 'authoring')
  assert.equal(r.meta.textType, 'mixed')
  const keys = r.reading_order.slice(0, 4).map((x) => x.key)
  assert.deepEqual(keys, ['00', '02', '20', '05'])
  assert.ok(r.mode_contract.includes('一口气写完'))
  assert.ok(r.mode_contract.includes('然后停'))
})

test('study: 非法输入回落到 mixed/authoring', () => {
  const r = buildStudyPackage('不存在的体裁', '不存在的模式')
  assert.equal(r.meta.textType, 'mixed')
  assert.equal(r.meta.mode, 'authoring')
})

test('study: 全部理论完整返回，不是摘要', () => {
  const r = buildStudyPackage('fiction', 'authoring')
  const joined = r.chapters.map((c) => c.text).join('\n')
  assert.ok(joined.includes('材料有来源'), '应含 02 材料有来源')
  assert.ok(joined.includes('注意力有选择'), '应含 02 注意力有选择')
  assert.ok(joined.includes('判断有代价'), '应含 02 判断有代价')
  assert.ok(joined.includes('配额'), '应含配额原则')
  assert.ok(joined.includes('文笔'), '应含 20 文笔原理')
  assert.ok(joined.includes('温度'), '应含 20 温度原理')
  assert.ok(joined.length > 20000, `完整阅读包应足够完整，实际 ${joined.length} 字符`)
})

test('study: 三篇示范文风格互异且不供模仿', () => {
  const r = buildStudyPackage('mixed', 'authoring')
  assert.equal(r.examples.length, 3)
  const texts = r.examples.map((e) => e.text)
  assert.equal(new Set(texts).size, 3)
  assert.equal(new Set(r.examples.map((e) => e.style)).size, 3)
  for (const e of r.examples) assert.ok(e.text.includes('。'), '示范文应是完整段落')
})

test('study: 无评分、无画像、无配额的禁令存在', () => {
  const r = buildStudyPackage('fiction', 'polishing')
  const joined = [
    ...r.principle,
    ...r.before_writing,
    ...r.while_writing,
    ...r.after_writing,
    ...r.forbidden,
  ].join('\n')
  assert.ok(joined.includes('评分'), '应禁止评分')
  assert.ok(joined.includes('画像'), '应禁止画像')
  assert.ok(joined.includes('配额'), '应禁止配额')
  assert.ok(joined.includes('不产'), '应明确不产出工件')
})

test('renderStudyPackage: 渲染成连续文本，不是 JSON 转义', () => {
  const r = buildStudyPackage('fiction', 'authoring')
  const text = renderStudyPackage(r)
  assert.ok(text.startsWith('# dsh-humanizer 完整阅读包'), '应以阅读包标题开头')
  assert.ok(text.includes('## 章节全文'), '应含章节全文区')
  assert.ok(text.includes('## 示范文'), '应含示范文区')
  assert.ok(!text.includes('\\n'), '不应出现 JSON 转义换行')
  assert.ok(text.length > 20000, `阅读文本应完整，实际 ${text.length} 字符`)
})
