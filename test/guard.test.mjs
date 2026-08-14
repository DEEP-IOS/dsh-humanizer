import { test } from 'node:test'
import assert from 'node:assert/strict'
import { profile, guard, validateArtifact, GUARD_VERSION } from '../lib/guard.mjs'

test('GUARD_VERSION 为 semver', () => {
  assert.match(GUARD_VERSION, /^\d+\.\d+\.\d+$/)
})

test('profile: 空文本返回零值指标与空锚点', () => {
  const r = profile('')
  assert.equal(r.metrics.chars, 0)
  assert.equal(r.metrics.sentences, 0)
  assert.deepEqual(r.anchors, [])
})

test('profile: 基本指标（段落/句子/占比）', () => {
  const text = '这是第一句话。这是第二句话，稍微长一点点。\n\n第二段只有一句。'
  const r = profile(text)
  assert.ok(r.metrics.chars > 0)
  assert.equal(r.metrics.paragraphs, 2)
  assert.equal(r.metrics.sentences, 3)
  assert.ok(r.metrics.shortSentenceRatio >= 0)
  assert.ok(r.metrics.longSentenceRatio >= 0)
})

test('profile: 内容锚点提取（数字/等级/拉丁/书名号）', () => {
  const text = '第三章出现 1234 元，规格 A级，接口 JSON，参考《人味化手册》。'
  const r = profile(text)
  const values = r.anchors.map((a) => a.value)
  assert.ok(values.includes('1234'), `anchors 应含 1234，实际 ${JSON.stringify(values)}`)
  assert.ok(values.some((v) => v.includes('A级')), 'anchors 应含 A级')
  assert.ok(values.includes('JSON'), 'anchors 应含 JSON')
  assert.ok(values.some((v) => v.includes('《人味化手册》')), 'anchors 应含书名号术语')
})

test('profile: 连词密度计数', () => {
  const r = profile('首先……其次……最后……')
  assert.ok(r.metrics.connectorDensityPer1k > 0)
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

test('guard: 禁止条件（破折号/半角引号/连续重复标点）', () => {
  const r = guard('原文。', '他——愣住了！！！说"好吧"。')
  const types = r.forbidden.map((f) => f.type)
  assert.ok(types.includes('em-dash'), '应命中破折号')
  assert.ok(types.includes('halfwidth-quote'), '应命中半角引号')
  assert.ok(types.includes('repeated-punctuation'), '应命中连续重复标点')
})

test('guard: 引号不成对', () => {
  const r = guard('原文。', '他说“你好。')
  assert.ok(r.forbidden.some((f) => f.type === 'unpaired-quote'))
})

test('validateArtifact: 占位空话判失败', () => {
  const r = validateArtifact({ 判断: '已检查' }, '原文内容')
  assert.equal(r.ok, false)
  assert.ok(r.emptyOrPlaceholder.length > 0)
})

test('validateArtifact: 空数组判失败', () => {
  const r = validateArtifact({ items: [] }, '')
  assert.equal(r.ok, false)
})

test('validateArtifact: 过短判断判失败', () => {
  const r = validateArtifact({ 判断: '好' }, '')
  assert.equal(r.ok, false)
  assert.ok(r.shortReason.length > 0)
})

test('validateArtifact: 证据不在原文判失败', () => {
  const r = validateArtifact({ 证据: '完全不存在的一句话' }, '原文是另一句话。')
  assert.equal(r.ok, false)
  assert.ok(r.unverifiedEvidence.length > 0)
})

test('validateArtifact: 英文术语 AI/AIGC 不告警，普通英文告警', () => {
  const legal = validateArtifact({ 判断: '此处用了 AI 与 AIGC 两个术语' }, '')
  assert.equal(legal.ok, true)
  assert.equal(legal.englishTokens.length, 0)
  const illegal = validateArtifact({ 判断: '此处用了 English token 混入' }, '')
  assert.ok(illegal.englishTokens.length > 0)
})

test('guard: 心理套路扩展（我先前/本来/当时＋以为/想着）', () => {
  const r = guard('原文。', '我先前还想着，这事就算过去了。我本来以为他会回来。')
  assert.ok(r.forbidden.some((f) => f.type === 'psych-proxy'))
})

test('validateArtifact: 完整工件通过', () => {
  const source = '他推开门，风卷着雪灌进来。桌上的灯晃了一下。'
  const artifact = {
    判断: '用动作承接场景转换，无AI味',
    理由: '开门与风雪的物件呼应形成自然过渡，替代了心理代理句式',
    证据: '他推开门，风卷着雪灌进来',
  }
  const r = validateArtifact(artifact, source)
  assert.equal(r.ok, true)
  assert.equal(r.emptyOrPlaceholder.length, 0)
  assert.equal(r.unverifiedEvidence.length, 0)
})



test('profile: 逐段画像（segments + §18 特征字计数）', () => {
  const text = '他推开门。风卷着雪灌进来。\n\n他说，好像心里有点慌，忽然之间，仿佛什么都不记得了。'
  const r = profile(text)
  assert.equal(r.segments.length, 2)
  assert.equal(r.segments[0].features['像'], 0)
  assert.equal(r.segments[1].features['像'], 1)
  assert.equal(r.segments[1].features['忽然'], 1)
  assert.equal(r.segments[1].features['心里'], 1)
  assert.equal(r.segments[1].features['仿佛'], 1)
})
