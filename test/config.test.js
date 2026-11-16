import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveConfig } from '../src/config.js'

test('defaults', () => {
  assert.deepEqual(resolveConfig(undefined), {
    silentToolCalls: 6, repeatEvery: 6, exclude: [], promptSection: true, todoTool: 'todo_write',
  })
})

test('overrides merge with defaults', () => {
  const c = resolveConfig({ silentToolCalls: 4, exclude: ['read_file'] })
  assert.equal(c.silentToolCalls, 4)
  assert.equal(c.repeatEvery, 6)
  assert.deepEqual(c.exclude, ['read_file'])
})

test('rejects invalid values', () => {
  for (const bad of [{ silentToolCalls: 0 }, { silentToolCalls: 2.5 }, { repeatEvery: '3' },
                     { exclude: 'x' }, { promptSection: 'yes' }, { todoTool: '' }])
    assert.throws(() => resolveConfig(bad), /^Error: progress-updates: /)
})

test('rejects unknown keys', () => {
  assert.throws(() => resolveConfig({ silentToolCall: 3 }), /^Error: progress-updates: unknown config key "silentToolCall"$/)
})
