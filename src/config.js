const DEFAULTS = Object.freeze({
  silentToolCalls: 6,
  repeatEvery: 6,
  exclude: Object.freeze([]),
  promptSection: true,
  todoTool: 'todo_write',
})

const fail = (msg) => {
  throw new Error(`progress-updates: ${msg}`)
}

const isPositiveInt = (v) => Number.isInteger(v) && v >= 1

export function resolveConfig(raw) {
  if (raw === undefined) raw = {}
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) fail('config must be an object')

  for (const key of Object.keys(raw)) {
    if (!Object.hasOwn(DEFAULTS, key)) fail(`unknown config key "${key}"`)
  }

  const pick = (key) => (raw[key] === undefined ? DEFAULTS[key] : raw[key])
  const silentToolCalls = pick('silentToolCalls')
  const repeatEvery = pick('repeatEvery')
  const exclude = pick('exclude')
  const promptSection = pick('promptSection')
  const todoTool = pick('todoTool')

  if (!isPositiveInt(silentToolCalls)) fail('silentToolCalls must be an integer >= 1')
  if (!isPositiveInt(repeatEvery)) fail('repeatEvery must be an integer >= 1')
  if (!Array.isArray(exclude) || !exclude.every((s) => typeof s === 'string')) {
    fail('exclude must be an array of strings')
  }
  if (typeof promptSection !== 'boolean') fail('promptSection must be a boolean')
  if (typeof todoTool !== 'string' || todoTool.trim() === '') fail('todoTool must be a non-empty string')

  return Object.freeze({
    silentToolCalls,
    repeatEvery,
    exclude: Object.freeze([...exclude]),
    promptSection,
    todoTool,
  })
}
