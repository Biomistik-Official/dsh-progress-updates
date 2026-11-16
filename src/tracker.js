export function createTracker(config) {
  const states = new WeakMap()

  const userMessage = (agent) => {
    const st = states.get(agent)
    if (st) st.silent = 0
    else states.set(agent, { silent: 0, sawTodo: false })
  }

  const visibleText = (agent) => {
    const st = states.get(agent)
    if (st) st.silent = 0
  }

  const toolCall = (agent, toolName) => {
    const st = states.get(agent)
    if (!st) return null

    if (toolName === config.todoTool) {
      st.sawTodo = true
      st.silent = 0
      return null
    }
    if (config.exclude.includes(toolName)) return null

    st.silent += 1
    const { silentToolCalls, repeatEvery } = config
    if (st.silent >= silentToolCalls && (st.silent - silentToolCalls) % repeatEvery === 0) {
      return { kind: st.sawTodo ? 'update' : 'plan', silent: st.silent }
    }
    return null
  }

  return Object.freeze({ userMessage, visibleText, toolCall })
}
