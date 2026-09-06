// Run against an installed official DSH closure and an installed plugin tarball.
// Usage: node test/integration/smoke-runtime.mjs <host-dir> <installed-plugin-dir>
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const [hostDir, pluginDir] = process.argv.slice(2)
if (!hostDir || !pluginDir) throw new Error('Usage: smoke-runtime.mjs <host-dir> <installed-plugin-dir>')
const hostRequire = createRequire(pathToFileURL(join(resolve(hostDir), 'package.json')))
const dshVersion = hostRequire('@deepseek-ai/dsh/package.json').version
for (const name of ['dsh-tools', 'dsh-system-prompt', 'dsh-client-ui-renderer', 'dsh-client-ui-settings-general']) {
  assert.equal(hostRequire(`@deepseek-ai/${name}/package.json`).version, dshVersion, `Mixed DSH closure: ${name}`)
}
const fromHost = (name) => import(pathToFileURL(hostRequire.resolve(name)).href)
const { Context } = await fromHost('@deepseek-ai/cordis')
const { SystemPrompt } = await fromHost('@deepseek-ai/dsh-system-prompt')
const { ToolRuntime, validateJsonSchemaValue } = await fromHost('@deepseek-ai/dsh-tools')
const { WorkerThreadCodeRuntime } = await fromHost('@deepseek-ai/dsh-code-runtime-worker-thread')
const plugin = await import(pathToFileURL(join(resolve(pluginDir), 'index.mjs')).href)
const ctx = new Context()
await ctx.plugin(SystemPrompt, {})
await ctx.plugin(ToolRuntime, { mode: 'native' })
const names = ['humanize_guard', 'humanize_profile', 'humanize_reference', 'humanize_study']
const assemblyHasWorkflow = async () => JSON.stringify(await ctx.systemPrompt.assemble()).includes('dsh-humanizer:workflow')
let calls = 0
async function invoke(name, args) {
  const result = await ctx.tools.execute({
    callId: `humanizer-smoke-${++calls}`, name, arguments: args, signal: new AbortController().signal,
  })
  assert.equal(result.isError, false, JSON.stringify(result))
  return result
}

try {
  for (let cycle = 0; cycle < 2; cycle++) {
    const fork = await ctx.plugin(plugin, {})
    assert.deepEqual(ctx.tools.schemas().map((tool) => tool.name).sort(), names)
    assert.equal(await assemblyHasWorkflow(), true)
    for (const text_type of ['fiction', 'article', 'mixed']) {
      for (const mode of ['authoring', 'polishing']) {
        const result = await invoke('humanize_study', { text_type, mode })
        assert.equal(result.value.meta.chapterCount, 21)
        assert.equal(result.value.meta.mode, mode)
        assert.match(JSON.stringify(result), /20-文笔与温度原理/)
        assert.deepEqual(validateJsonSchemaValue(ctx.tools.get('humanize_study').output.schema, result.value, ''), [])
      }
    }
    const guarded = await invoke('humanize_guard', { original: '预算120元。', rewritten: '预算120元。' })
    assert.ok(guarded.value)
    const ref = await invoke('humanize_reference', { name: '20' })
    assert.match(ref.value.name, /^20-/)
    await invoke('humanize_profile', { text: '预算120元。' })
    const invalid = await ctx.tools.execute({ callId: 'invalid', name: 'humanize_study', arguments: {}, signal: new AbortController().signal })
    assert.equal(invalid.isError, true)
    assert.equal(ctx.tools.get('humanize_guard').isConcurrencySafe({ original: '', rewritten: '' }), true)
    await fork.dispose()
    assert.equal(ctx.tools.schemas().length, 0)
    assert.equal(await assemblyHasWorkflow(), false)
  }
  for (const options of [{ toolsEnabled: false }, { workflowEnabled: false }]) {
    const fork = await ctx.plugin(plugin, options)
    assert.equal(await assemblyHasWorkflow(), false)
    assert.equal(ctx.tools.schemas().length, options.toolsEnabled === false ? 0 : 4)
    await fork.dispose()
  }
  console.log(JSON.stringify({ dsh: dshVersion, calls, lifecycle: 'mount/dispose/remount passed', config: 'passed', tools: 'passed' }))
} finally {
  await ctx.fiber.dispose()
}

const ptc = new Context()
try {
  await ptc.plugin(SystemPrompt, {})
  await ptc.plugin(ToolRuntime, { mode: 'ptc' })
  await ptc.plugin(WorkerThreadCodeRuntime, {})
  await ptc.plugin(plugin, {})
  assert.ok(ptc.tools.schemas().some((tool) => tool.name === 'run_code'))
  assert.match(JSON.stringify(await ptc.systemPrompt.assemble()), /humanize_study/)
  const result = await ptc.tools.execute({
    callId: 'humanizer-ptc', name: 'run_code', signal: new AbortController().signal,
    arguments: {
      description: 'Verify humanizer tools through the official PTC worker',
      code: 'const [study, ref] = await Promise.all([tools.humanize_study({text_type:"fiction",mode:"authoring"}), tools.humanize_reference({name:"20"})]); if (study.meta.chapterCount !== 21 || !ref.name.startsWith("20-")) throw new Error("incomplete reading"); return "humanizer-ptc-passed";',
    },
  })
  assert.equal(result.isError, false, JSON.stringify(result))
  assert.match(JSON.stringify(result.content), /humanizer-ptc-passed/)
  console.log(JSON.stringify({ ptc: 'passed', worker: 'official worker-thread', parallelTools: 2 }))
} finally {
  await ptc.fiber.dispose()
}
