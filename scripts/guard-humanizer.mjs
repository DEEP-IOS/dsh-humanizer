#!/usr/bin/env node
// CLI：node scripts/guard-humanizer.mjs profile <文件>    （分布画像）
//       node scripts/guard-humanizer.mjs guard <原文> <改写稿>   （内容忠实守卫）
import { readFileSync } from 'node:fs'
import { profile, guard } from '../lib/guard.mjs'

const args = process.argv.slice(2)
const cmd = args[0]

if (cmd === 'profile') {
  const file = args[1]
  if (!file) {
    console.error('用法: guard-humanizer.mjs profile <文件>')
    process.exit(1)
  }
  const text = readFileSync(file, 'utf8')
  process.stdout.write(JSON.stringify(profile(text), null, 2) + '\n')
} else if (cmd === 'guard') {
  const orig = args[1]
  const rew = args[2]
  if (!orig || !rew) {
    console.error('用法: guard-humanizer.mjs guard <原文文件> <改写稿文件>')
    process.exit(1)
  }
  const r = guard(readFileSync(orig, 'utf8'), readFileSync(rew, 'utf8'))
  process.stdout.write(JSON.stringify(r, null, 2) + '\n')
} else {
  console.error('用法: guard-humanizer.mjs profile <文件> | guard <原文> <改写稿>')
  process.exit(1)
}
