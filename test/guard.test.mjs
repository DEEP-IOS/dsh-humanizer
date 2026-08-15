import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guard, legacyProfile, validateArtifact, validateDecision, GUARD_VERSION } from '../lib/guard.mjs'

test('GUARD_VERSION 为 semver', () => {
  assert.match(GUARD_VERSION, /^\d+\.\d+\.\d+$/)
})

test('guard: 锚点全部保留', () => {
  const r = guard('价格 1234 元，共 5 个。', '价格 1234 元，一共 5 个。')
  assert.equal(r.fidelity.totalAnchors, 2)
  assert.equal(r.fidelity.missing.length, 0)
})

test('guard: 锚点丢失被报告', () => {
  const r = guard('版本 3.2.1，共 5 个。', '版本已更新。')
  assert.ok(r.fidelity.missing.length > 0)
  assert.equal(r.fidelity.missing.length + r.fidelity.preserved, r.fidelity.totalAnchors)
})

test('guard: 引号不成对', () => {
  const r = guard('原文。', '他说“你好。')
  assert.ok(r.integrity.some((f) => f.type === 'unpaired-quote'))
})

test('guard: 乱码控制字符被报告', () => {
  const r = guard('原文。', '他说�好的。')
  assert.ok(r.integrity.some((f) => f.type === 'replacement-or-control-char'))
})

test('guard: 不扫描文体信号（破折号/半角引号/仿佛/心理代理不报）', () => {
  const r = guard('原文。', '他——愣住了说"好吧"，仿佛明白了什么。我这才明白，不是失败而是教训。')
  const types = r.integrity.map((f) => f.type)
  assert.ok(!types.includes('em-dash'), '破折号不应是守卫对象')
  assert.ok(!types.includes('halfwidth-quote'), '半角引号不应是守卫对象')
  assert.ok(!types.includes('vague-simile'), '仿佛/似乎不应是守卫对象')
  assert.ok(!types.includes('psych-proxy'), '心理代理不应是守卫对象')
  assert.ok(!types.includes('negation-reversal'), '不是…而是不应是守卫对象')
})

test('guard: 段落数变化是信息不是失败', () => {
  const r = guard('第一段。\n\n第二段。', '第一段。')
  assert.equal(r.paragraphs.originalCount, 2)
  assert.equal(r.paragraphs.rewrittenCount, 1)
  assert.equal(r.paragraphs.delta, -1)
})

test('legacyProfile: 已退役，只回锚点不回分布', () => {
  const r = legacyProfile('第三章出现 1234 元，规格 A级，接口 JSON，参考《人味化手册》。')
  assert.equal(r.deprecated, true)
  const values = r.anchors.map((a) => a.value)
  assert.ok(values.includes('1234'), '锚点应含 1234')
  assert.ok(values.some((v) => v.includes('A级')), '锚点应含 A级')
  assert.ok(values.includes('JSON'), '锚点应含 JSON')
  assert.ok(values.some((v) => v.includes('《人味化手册》')), '锚点应含书名号术语')
  assert.equal(r.metrics, undefined, '不得返回分布指标')
  assert.equal(r.segments, undefined, '不得返回逐段特征计数')
})

// 以下两个函数 v0.3 起不再注册为工具，仅保留库级兼容。
test('legacy validateArtifact: 占位空话判失败', () => {
  const r = validateArtifact({ 判断: '已检查' }, '原文内容')
  assert.equal(r.ok, false)
  assert.ok(r.emptyOrPlaceholder.length > 0)
})

test('legacy validateDecision: 四栏齐全通过，缺栏失败', () => {
  const decision = {
    材料来源: '账本信息来自梁问峰的旧账，阿衡只看到最后一页。',
    注意力选择: '观察者阿衡只注意账本最后一页。',
    判断代价: '赖账只是推测，猜错会失去铺子。',
    保护清单: ['梁问峰', '斩杀线', '三年前'],
  }
  const ok = validateDecision(decision, '')
  assert.equal(ok.ok, true)
  const missing = { ...decision }
  delete missing.保护清单
  assert.equal(validateDecision(missing, '').ok, false)
})
