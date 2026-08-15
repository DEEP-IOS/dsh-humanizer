#!/usr/bin/env node
// CLI：
//   node scripts/guard-humanizer.mjs guard <原文文件> <成品文件>            内容忠实守卫
//   node scripts/guard-humanizer.mjs study <fiction|article|mixed> <authoring|polishing>  阅读包冒烟
//
// v0.3 起不再提供 profile 与 validate-decision：画像与思考门禁都是规则蒸馏，已退役。
import { readFileSync } from 'node:fs'
import { guard } from '../lib/guard.mjs'
import { buildStudyPackage } from '../lib/study.mjs'

const args = process.argv.slice(2)
const cmd = args[0]

if (cmd === 'guard') {
  const orig = args[1]
  const rew = args[2]
  if (!orig || !rew) {
    console.error('用法: guard-humanizer.mjs guard <原文文件> <成品文件>')
    process.exit(1)
  }
  const r = guard(readFileSync(orig, 'utf8'), readFileSync(rew, 'utf8'))
  process.stdout.write(JSON.stringify(r, null, 2) + '\n')
} else if (cmd === 'study') {
  const type = args[1] || 'mixed'
  const mode = args[2] || 'authoring'
  const r = buildStudyPackage(type, mode)
  process.stdout.write(JSON.stringify({
    meta: r.meta,
    reading_order: r.reading_order,
    exampleCount: r.examples.length,
  }, null, 2) + '\n')
} else {
  console.error('用法: guard-humanizer.mjs guard <原文文件> <成品文件> | study <fiction|article|mixed> <authoring|polishing>')
  process.exit(1)
}
