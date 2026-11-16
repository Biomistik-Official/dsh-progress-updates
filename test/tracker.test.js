import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveConfig } from '../src/config.js'
import { createTracker } from '../src/tracker.js'
import { promptSection, reminderText } from '../src/messages.js'

const k = r => r && r.kind
const cfg = resolveConfig({ silentToolCalls: 3, repeatEvery: 2 })

test('untracked agent never gets reminders', () => {
  const t = createTracker(cfg); const a = {}
  for (let i = 0; i < 10; i++) assert.equal(t.toolCall(a, 'bash'), null)
})

test('fires at threshold then every repeatEvery', () => {
  const t = createTracker(cfg); const a = {}; t.userMessage(a)
  const res = Array.from({ length: 8 }, () => t.toolCall(a, 'bash'))
  assert.deepEqual(res.map(k), [null, null, 'plan', null, 'plan', null, 'plan', null])
  assert.equal(res[4].silent, 5)
})

test('todo_write resets and switches to update', () => {
  const t = createTracker(cfg); const a = {}; t.userMessage(a)
  t.toolCall(a, 'bash'); t.toolCall(a, 'bash'); t.toolCall(a, 'todo_write')
  assert.deepEqual([t.toolCall(a, 'bash'), t.toolCall(a, 'bash'), t.toolCall(a, 'bash')].map(k),
                   [null, null, 'update'])
})

test('visible text resets the counter', () => {
  const t = createTracker(cfg); const a = {}; t.userMessage(a)
  t.toolCall(a, 'bash'); t.toolCall(a, 'bash'); t.visibleText(a)
  assert.equal(t.toolCall(a, 'bash'), null)
})

test('excluded tools neither count nor reset', () => {
  const t = createTracker(resolveConfig({ silentToolCalls: 2, exclude: ['read_file'] }))
  const a = {}; t.userMessage(a)
  t.toolCall(a, 'bash'); assert.equal(t.toolCall(a, 'read_file'), null)
  assert.equal(k(t.toolCall(a, 'bash')), 'plan')
})

test('user message resets silence but keeps the plan flag', () => {
  const t = createTracker(cfg); const a = {}; t.userMessage(a); t.toolCall(a, 'todo_write')
  t.toolCall(a, 'bash'); t.toolCall(a, 'bash')
  t.userMessage(a); t.toolCall(a, 'bash'); t.toolCall(a, 'bash')
  assert.equal(k(t.toolCall(a, 'bash')), 'update')
})

test('agents are independent', () => {
  const t = createTracker(cfg); const a = {}, b = {}; t.userMessage(a); t.userMessage(b)
  t.toolCall(a, 'bash'); t.toolCall(a, 'bash')
  assert.equal(t.toolCall(b, 'bash'), null); assert.equal(k(t.toolCall(a, 'bash')), 'plan')
})

test('reminder texts', () => {
  assert.match(reminderText('plan', 6, 'todo_write'), /todo_write/)
  assert.match(reminderText('update', 6, 'todo_write'), /6 tool calls/)
  assert.match(promptSection('todo_write'), /todo_write/)
  assert.match(promptSection('todo_write'), /Keep the item you are working on `in_progress`\./)
  for (const text of [reminderText('plan', 6, 'plan_write'), reminderText('update', 6, 'plan_write'), promptSection('plan_write')]) {
    assert.match(text, /plan_write/); assert.doesNotMatch(text, /todo_write/)
  }
})
