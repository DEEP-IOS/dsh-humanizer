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
    return { createElement: (type, props, ...children) => ({ type, props, children }) }
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
