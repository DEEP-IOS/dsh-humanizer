import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listReferences, readReference } from '../lib/reference.mjs'

test('listReferences: 返回 00—20 共 21 个章节', () => {
  const files = listReferences()
  assert.ok(files.length >= 21, `实际 ${files.length} 个`)
  assert.ok(files.includes('00-工作流.md'), '应含 00-工作流.md')
  assert.ok(files.includes('19-后处理禁令.md'), '应含 19-后处理禁令.md')
  assert.ok(files.includes('20-文笔与温度原理.md'), '应含 20-文笔与温度原理.md')
})

test('readReference: 章节号精确读取', () => {
  const r = readReference('00')
  assert.equal(r.name, '00-工作流.md')
  assert.ok(r.text.length > 100)
})

test('readReference: 00 已重写为写作与润色总协议', () => {
  const r = readReference('00')
  assert.ok(r.text.includes('成为作者'), '00 应包含成为作者')
  assert.ok(r.text.includes('humanize_study'), '00 应指向 humanize_study')
  assert.ok(r.text.includes('退役'), '00 应记录旧机制退役')
})

test('readReference: 19 记录后处理禁令', () => {
  const r = readReference('19')
  assert.ok(r.text.includes('后处理'), '19 应说明后处理禁令')
})

test('readReference: 20 记录文笔与温度原理', () => {
  const r = readReference('20')
  assert.ok(r.text.includes('文笔'), '20 应说明文笔原理')
  assert.ok(r.text.includes('温度'), '20 应说明温度原理')
})

test('readReference: 文件名精确读取', () => {
  const r = readReference('05-功能路径诊断')
  assert.equal(r.name, '05-功能路径诊断.md')
})

test('readReference: 关键词唯一匹配', () => {
  const r = readReference('十维')
  assert.ok(r.name.includes('十维'))
  assert.ok(r.text.length > 0)
})

test('readReference: 空查询返回清单', () => {
  const r = readReference('')
  assert.ok(Array.isArray(r.available))
  assert.ok(r.available.length >= 21)
})

test('readReference: 未找到返回错误与清单', () => {
  const r = readReference('不存在的章节xyz')
  assert.ok(r.error, '应返回 error')
  assert.ok(Array.isArray(r.available))
})

test('readReference: 小节读取（章节号#节号）', () => {
  const x = readReference('04#4.7')
  assert.ok(x.section.includes('4.7'))
  assert.ok(x.text.length > 100)
})

test('readReference: 小节关键词读取', () => {
  const x = readReference('04 特殊句式')
  assert.ok(x.section.includes('特殊句式'))
  assert.ok(x.text.length > 100)
})

test('readReference: 小节未找到返回错误与清单', () => {
  const x = readReference('04#不存在的节xyz')
  assert.ok(x.error)
  assert.ok(Array.isArray(x.available))
})
