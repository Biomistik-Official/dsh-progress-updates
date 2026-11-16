import { createUserMessage, chunkHasVisibleText } from '@deepseek-ai/dsh-llm'
import { createPlugin } from './src/plugin.js'

export const { name, inject, apply } = createPlugin({ createUserMessage, chunkHasVisibleText })
