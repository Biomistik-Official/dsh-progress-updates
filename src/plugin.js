import { resolveConfig } from './config.js'
import { createTracker } from './tracker.js'
import { promptSection, reminderText } from './messages.js'

export function createPlugin({ createUserMessage, chunkHasVisibleText }) {
  function apply(ctx, rawConfig) {
    const config = resolveConfig(rawConfig)
    const tracker = createTracker(config)

    if (config.promptSection) {
      ctx.systemPrompt.section({
        name: 'progress-updates:policy',
        order: 9500,
        text: promptSection(config.todoTool),
        interpolate: false,
      })
    }

    ctx.on('agent/pre-step', ({ agent, messages }, next) => {
      const isSubagent = ctx.sessions.get(agent.id)?.header?.origin === 'subagent'
      if (!isSubagent && messages.some((m) => m.source?.kind === 'user')) tracker.userMessage(agent)
      return next()
    })

    ctx.on('agent/assistant-stream', ({ agent, frame }) => {
      if (frame.type === 'chunk' && chunkHasVisibleText(frame.chunk)) tracker.visibleText(agent)
    })

    ctx.on('tools/post-execute', async (exec, _result, next) => {
      if (!exec.agent) return next()
      const hit = tracker.toolCall(exec.agent, exec.name)
      const downstream = await next()
      if (hit === null) return downstream
      const reminder = createUserMessage({
        content: [{ type: 'text', text: reminderText(hit.kind, hit.silent, config.todoTool) }],
        source: {
          kind: 'progress-updates',
          form: 'notice',
          summary: `${hit.kind} after ${hit.silent} silent calls`,
        },
      })
      return { ...downstream, additionalContexts: [reminder, ...(downstream.additionalContexts ?? [])] }
    })
  }

  return { name: 'progress-updates', inject: ['systemPrompt', 'sessions'], apply }
}
