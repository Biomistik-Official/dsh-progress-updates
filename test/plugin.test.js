import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPlugin } from '../src/plugin.js'

const { name, inject, apply } = createPlugin({
  createUserMessage: (m) => ({ ...m, role: 'user' }),
  chunkHasVisibleText: (c) => c.visible === true,
})
const cfg = { silentToolCalls: 2, repeatEvery: 2 }

let sections, handlers, ctx, sessionsById
beforeEach(() => {
  sections = []
  handlers = {}
  sessionsById = {}
  ctx = {
    systemPrompt: { section: (s) => sections.push(s) },
    sessions: { get: (id) => sessionsById[id] },
    on: (ev, fn) => { handlers[ev] = fn },
  }
})

const userStep = (agent) =>
  handlers['agent/pre-step']({ agent, messages: [{ source: { kind: 'user' } }] }, async () => 'ok')

test('exposes name and inject', () => {
  assert.equal(name, 'progress-updates')
  assert.deepEqual(inject, ['systemPrompt', 'sessions'])
})

test('registers prompt section and listeners', () => {
  apply(ctx, {})
  assert.equal(sections[0].name, 'progress-updates:policy'); assert.equal(sections[0].order, 9500)
  assert.ok(handlers['agent/pre-step'] && handlers['agent/assistant-stream'] && handlers['tools/post-execute'])
})

test('promptSection:false skips the section', () => {
  apply(ctx, { promptSection: false }); assert.equal(sections.length, 0)
})

test('reminder is appended to downstream contexts at threshold', async () => {
  apply(ctx, cfg); const agent = { id: 'a1' }
  await userStep(agent)
  const next = async () => ({ kind: 'continue', additionalContexts: [{ x: 1 }] })
  const first = await handlers['tools/post-execute']({ agent, name: 'bash' }, {}, next)
  assert.deepEqual(first.additionalContexts, [{ x: 1 }])
  const second = await handlers['tools/post-execute']({ agent, name: 'bash' }, {}, next)
  assert.equal(second.kind, 'continue'); assert.equal(second.additionalContexts.length, 2)
  assert.equal(second.additionalContexts[0].source.kind, 'progress-updates')
  assert.match(second.additionalContexts[0].content[0].text, /todo_write/)
})

test('block decisions keep kind and feedback', async () => {
  apply(ctx, cfg); const agent = { id: 'a1' }
  await userStep(agent)
  const next = async () => ({ kind: 'block', feedback: 'no' })
  await handlers['tools/post-execute']({ agent, name: 'bash' }, {}, next)
  const second = await handlers['tools/post-execute']({ agent, name: 'bash' }, {}, next)
  assert.equal(second.kind, 'block'); assert.equal(second.feedback, 'no')
  assert.equal(second.additionalContexts.length, 1)
  assert.equal(second.additionalContexts[0].source.kind, 'progress-updates')
})

test('visible text chunk resets the counter', async () => {
  apply(ctx, cfg); const agent = { id: 'a1' }
  await userStep(agent)
  const next = async () => ({ kind: 'continue' })
  const a = await handlers['tools/post-execute']({ agent, name: 'bash' }, {}, next)
  handlers['agent/assistant-stream']({ agent, frame: { type: 'chunk', chunk: { visible: true } } })
  const b = await handlers['tools/post-execute']({ agent, name: 'bash' }, {}, next)
  assert.equal(a.additionalContexts, undefined)
  assert.equal(b.additionalContexts, undefined)
})

test('calls without agent pass through', async () => {
  apply(ctx, cfg)
  const result = { kind: 'continue', additionalContexts: [{ x: 1 }] }
  const out = await handlers['tools/post-execute']({ name: 'bash' }, {}, async () => result)
  assert.equal(out, result)
})

const silentCalls = async (agent, n) => {
  const next = async () => ({ kind: 'continue' })
  const outs = []
  for (let i = 0; i < n; i++) outs.push(await handlers['tools/post-execute']({ agent, name: 'bash' }, {}, next))
  return outs
}

test('subagent session is never tracked', async () => {
  apply(ctx, cfg); const agent = { id: 'sub1' }
  sessionsById.sub1 = { header: { origin: 'subagent' } }
  await userStep(agent)
  for (const out of await silentCalls(agent, 5)) assert.equal(out.additionalContexts, undefined)
})

test('non-user message kind does not start tracking', async () => {
  apply(ctx, cfg); const agent = { id: 'a1' }
  await handlers['agent/pre-step']({ agent, messages: [{ source: { kind: 'schedule' } }] }, async () => 'ok')
  for (const out of await silentCalls(agent, 5)) assert.equal(out.additionalContexts, undefined)
})

test('missing session still tracks a user-messaged agent', async () => {
  apply(ctx, cfg); const agent = { id: 'ghost' }
  await userStep(agent)
  const outs = await silentCalls(agent, 2)
  assert.equal(outs[1].additionalContexts.length, 1)
})

test('custom todoTool appears in prompt and reminder', async () => {
  apply(ctx, { ...cfg, todoTool: 'plan_write' }); const agent = { id: 'a1' }
  assert.match(sections[0].text, /plan_write/); assert.doesNotMatch(sections[0].text, /todo_write/)
  await userStep(agent)
  const outs = await silentCalls(agent, 2)
  const text = outs[1].additionalContexts[0].content[0].text
  assert.match(text, /plan_write/); assert.doesNotMatch(text, /todo_write/)
})
