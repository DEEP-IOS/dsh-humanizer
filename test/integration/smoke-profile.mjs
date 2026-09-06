// Disposable profile acceptance: install a packed plugin, start Web, remove it,
// then check that the official composed configuration is restored byte-for-byte.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [hostArgument, tarballArgument] = process.argv.slice(2)
if (!hostArgument || !tarballArgument) throw new Error('Usage: smoke-profile.mjs <host-dir> <plugin.tgz>')
const host = resolve(hostArgument)
const tarball = resolve(tarballArgument)
const home = mkdtempSync(join(host, 'humanizer-smoke-'))
const cli = join(host, 'node_modules/@deepseek-ai/dsh/lib/bin.js')
const env = { ...process.env, DSH_HOME: home, npm_config_ignore_scripts: 'true' }
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: host, env, encoding: 'utf8', timeout: 120_000, windowsHide: true })
  assert.equal(result.status, 0, result.error?.message ?? result.stderr + result.stdout)
  return result.stdout
}
function dsh(...args) { return run([cli, ...args]) }
const baseline = dsh('--profile', 'web', '--dump-config')
let server
let exited
let installed = false
let startupOutput = ''
try {
  dsh('plugin', '--profile', 'web', 'add', tarball, '--ignore-scripts')
  installed = true
  const composed = dsh('--profile', 'web', '--dump-config')
  assert.match(composed, /id: dsh-humanizer/)
  const installedDir = join(home, 'profiles/web/node_modules/dsh-humanizer')
  const runtime = run([fileURLToPath(new URL('./smoke-runtime.mjs', import.meta.url)), host, installedDir])
  server = spawn(process.execPath, [cli, 'web', '--no-open', '--host', '127.0.0.1', '--port', '0'], {
    cwd: host, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  })
  exited = new Promise((resolveExit) => server.once('exit', resolveExit))
  const address = await new Promise((resolveAddress, reject) => {
    const timer = setTimeout(() => reject(new Error('Web startup timed out')), 60_000)
    const collect = (chunk) => {
      startupOutput += chunk.toString()
      const match = startupOutput.match(/dsh web: (http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+)/)
      if (match) { clearTimeout(timer); resolveAddress(match[1]) }
    }
    server.stdout.on('data', collect)
    server.stderr.on('data', collect)
    server.once('error', (error) => { clearTimeout(timer); reject(error) })
    server.once('exit', () => { clearTimeout(timer); reject(new Error('Web exited before announcing its address')) })
  })
  const login = await fetch(address, { redirect: 'manual', signal: AbortSignal.timeout(15_000) })
  assert.equal(login.status, 303)
  const cookie = login.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  const response = await fetch(new URL('/', address), { headers: { cookie }, signal: AbortSignal.timeout(15_000) })
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /dsh-humanizer/)
  assert.match(html, /@deepseek-ai\/dsh-client-ui-renderer/)
  assert.doesNotMatch(startupOutput, /failed|cannot find|unknown dependency/i)
  console.log(runtime.trim())
  if (process.argv[4] === '--preview') {
    console.log(`Browser preview: ${address}`)
    console.log('Press Enter to stop the preview and restore the profile.')
    await new Promise(resolveInput => process.stdin.once('data', resolveInput))
    process.stdin.pause()
  }
} finally {
  if (server && server.exitCode === null) { server.kill(); await exited }
  if (installed) dsh('plugin', '--profile', 'web', 'remove', 'dsh-humanizer')
  assert.equal(dsh('--profile', 'web', '--dump-config'), baseline)
  const manifest = JSON.parse(readFileSync(join(home, 'profiles/web/package.json'), 'utf8'))
  assert.ok(!manifest.dsh.profile.bundles.includes('dsh-humanizer'))
}
console.log(JSON.stringify({ profile: 'web', install: 'passed', start: 'passed', uninstall: 'passed', baselineRestored: true, home }))
