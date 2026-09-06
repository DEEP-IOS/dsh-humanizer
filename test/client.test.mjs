import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

test('browser factory contributes a renderable settings page after its slot owner mounts', () => {
  let registration
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: (value) => { registration = value } } },
  })
  assert.equal(registration.id, 'dsh-humanizer')
  const requested = []
  const plugin = registration.factory((name) => {
    requested.push(name)
    assert.equal(name, 'react')
    return { createElement: (type, props, ...children) => ({ type, props, children }), useState: value => [value, () => {}] }
  })
  let mount
  let entry
  const ctx = { slots: {
    inject: (name, callback) => { assert.equal(name, 'settings.section'); mount = callback },
    register: (options, Component) => {
      entry = { options, view: Component() }
      return () => { entry = undefined }
    },
  } }
  plugin.apply(ctx)
  assert.equal(entry, undefined)
  const dispose = mount()
  assert.equal(entry.options.label(), '人味化')
  assert.match(JSON.stringify(entry.view), /人味写作与润色/)
  assert.match(JSON.stringify(entry.view), /--dsw-alias-label-primary/)
  dispose()
  assert.equal(entry, undefined)
  mount()()
  assert.deepEqual(requested, ['react'])
})

test('client arrival dependencies identify packages, separate from Cordis service injection', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-renderer'))
  assert.ok(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-settings-general'))
  assert.ok(!manifest.dsh.client.inject.includes('slots'))
})

test('request templates can be edited and copied; clipboard failure gives a manual fallback', async () => {
  let registration, Component, cursor = 0, copied = '', denied = false
  const values = []
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: initial => { const slot = cursor++; values[slot] ??= initial; return [values[slot], next => { values[slot] = next }] },
  }
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: x => { registration = x } } },
    navigator: { clipboard: { writeText: async value => { if (denied) throw new Error('denied'); copied = value } } },
  })
  registration.factory(() => React).apply({ slots: {
    inject: (_name, callback) => callback(), register: (_options, component) => { Component = component },
  } })
  const render = () => { cursor = 0; return Component() }
  const find = (tree, predicate) => {
    if (!tree || typeof tree !== 'object') return undefined
    if (!Array.isArray(tree) && predicate(tree)) return tree
    for (const child of Array.isArray(tree) ? tree : tree.children ?? []) { const found = find(child, predicate); if (found) return found }
  }
  let view = render()
  find(view, x => x.type === 'button' && x.children.includes('修正设定')).props.onClick()
  view = render()
  assert.match(find(view, x => x.type === 'textarea').props.value, /修正 humanizer/)
  find(view, x => x.type === 'textarea').props.onChange({ target: { value: '我的作品与任务' } })
  view = render()
  await find(view, x => x.type === 'button' && x.children.includes('复制请求')).props.onClick()
  assert.equal(copied, '我的作品与任务')
  assert.match(JSON.stringify(render()), /已复制/)
  denied = true
  await find(render(), x => x.type === 'button' && x.children.includes('复制请求')).props.onClick()
  assert.match(JSON.stringify(render()), /手动复制/)
})
