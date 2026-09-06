import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { MemoryStore, sessionIdentity, renderMemoryContext } from './memory.mjs'
import { prepareReading } from './prepare.mjs'

const text = (description, required = false) => ({ type: 'string', description, ...(required ? { required: true } : {}) })
const output = { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] }

export function installWorkbench(ctx, config) {
  const path = join(resolveDshHome(), 'plugins', 'dsh-humanizer', 'memory.sqlite')
  let store
  const open = () => store ??= new MemoryStore(path)
  ctx.effect(() => () => { store?.close(); store = undefined }, 'dsh-humanizer.memory.close()')
  const bound = exec => {
    const identity = sessionIdentity(exec.agent)
    const binding = open().binding(identity)
    if (!binding) throw new Error('Call humanize_prepare with the work name first; projects lists existing works')
    return { identity, binding }
  }
  if (config.memoryEnabled) {
    ctx.effect(() => ctx.systemPrompt.context({
      name: 'dsh-humanizer:memory', order: config.sectionOrder + 1,
      text: ({ agent }) => {
        if (!agent || (!store && !existsSync(path))) return ''
        try {
          const identity = sessionIdentity(agent)
          const binding = open().binding(identity)
          if (!binding) return ''
          return renderMemoryContext(binding, open().recall(identity.workspace, binding.project, `${binding.task} ${binding.next_action}`, 9000))
        } catch {
          return 'Humanizer memory is unavailable for this session. Do not pretend to remember. Use humanize_memory to diagnose before relying on earlier facts.'
        }
      },
    }), 'dsh-humanizer.memory.context()')
  }
  ctx.tools.register(defineTool({
    name: 'humanize_prepare', isConcurrencySafe: () => false,
    description: 'Start/resume a named work: restore local source-attributed memory and task handoff, save the current task, and read relevant FULL theory chapters. Ask for a work name only when ambiguous. No manuscript files are read. With memory disabled, returns reading only.',
    parameters: {
      project: text('Stable work name; use the same name to resume, different names for separate novels/articles', true),
      task: text('Current public writing objective, including relevant entity names; no private reasoning', true),
      text_type: text('fiction, article or mixed'), mode: text('authoring or polishing'),
      focus: text('Optional comma-separated voice, continuity, flow, dialogue, evidence, polishing'),
    }, output,
    execute: async (args, exec) => {
      const reading = prepareReading(args.text_type, args.mode, args.focus)
      if (!config.memoryEnabled) return { memoryEnabled: false, reading }
      const identity = sessionIdentity(exec.agent)
      const binding = open().prepare(identity, args.project, args.task)
      return { memoryEnabled: true, task: binding, memory: open().recall(identity.workspace, binding.project, args.task), reading }
    },
  }))
  if (!config.memoryEnabled) return
  ctx.tools.register(defineTool({
    name: 'humanize_memory', isConcurrencySafe: args => ['recall', 'inspect', 'history', 'projects'].includes(args.action),
    description: 'Local evidence-bearing graph. recall searches entity names and one-hop relations; inspect retrieves one full key; projects lists works in this workspace. remember retains conflicting versions; revise explicitly reconciles a key after inspection. Forget only on user request, with observed revision. All writes require a verbatim quote and its supplied source text; that proves quote matching, not truth. Reuse the same key for a fact, use distinct keys for different story times/stages. No automatic semantic contradiction detection across keys. History returns latest 100 versions.',
    parameters: {
      action: text('projects, recall, inspect, history, remember, revise or forget', true),
      query: text('Relevant entity names; empty recalls all within budget'), key: text('Stable fact key, e.g. chen.eye-color.chapter1.canon'),
      subject: text('Graph source entity, e.g. 陈默'), relation: text('Edge relation, e.g. 师父'), target: text('Graph target entity or property value'),
      kind: text('fact, voice, preference, thread, event or decision'),
      stage: text('canon only for accepted text; draft (default) for drafts; proposal for plans'),
      basis: text('stated for explicitly stated material, inferred for interpretation'), when: text('Optional story time/chapter; does not imply chronological sorting'),
      source: text('Source label, e.g. 用户设定 or 第三章定稿'), quote: text('Verbatim supporting quote, at most 1200 chars'), source_text: text('Text containing the quote, at most 200000 chars; only quote and hash are stored'),
      pinned: { type: 'boolean', description: 'Always eligible for recall; use sparingly for author voice and hard constraints' },
      expected_revision: { type: 'number', description: 'Observed current key revision; required by revise and forget' },
    }, output,
    execute: async (args, exec) => {
      const identity = sessionIdentity(exec.agent)
      if (args.action === 'projects') return { projects: open().projects(identity.workspace) }
      const { binding } = bound(exec)
      const { workspace } = identity
      const { project } = binding
      switch (args.action) {
        case 'recall': return { task: binding, memory: open().recall(workspace, project, args.query) }
        case 'inspect': return { record: open().current(workspace, project, args.key ?? '') }
        case 'history': return { versions: open().history(workspace, project, args.key) }
        case 'remember': return open().write(workspace, project, args)
        case 'revise': return open().write(workspace, project, args, true)
        case 'forget': return open().forget(workspace, project, args.key, args.expected_revision)
        default: throw new Error('Unknown memory action')
      }
    },
  }))
  ctx.tools.register(defineTool({
    name: 'humanize_checkpoint', isConcurrencySafe: () => false,
    description: 'Save a brief inspectable handoff after substantial writing or before pausing: delivered result, next task, unresolved questions. No hidden chain-of-thought or invented facts. Recall returns the current checkpoint revision. This does not mark drafts as canon.',
    parameters: {
      summary: text('Public work summary, at most 1600 chars', true), next_action: text('Next action, at most 800 chars'),
      unresolved: text('Open questions, at most 800 chars'), status: text('active or complete'),
      expected_revision: { type: 'number', required: true, description: 'Current task revision returned by prepare/recall/checkpoint' },
    }, output,
    execute: async (args, exec) => open().checkpoint(bound(exec).identity, args),
  }))
}
