export const promptSection = (todoTool) => `## Progress updates

The user watches you work and cannot see your tool calls. Keep them informed:

1. For any task that takes 3 or more steps, call \`${todoTool}\` with a short plan before you start. Keep the item you are working on \`in_progress\`. Mark an item \`completed\` as soon as it is done, and add or rewrite items when the plan changes.
2. After each meaningful step, write the user 1-2 plain sentences: what you just did or found, and what you will do next. These updates are part of the answer the user asked for; they are not preamble, courtesy, or filler.
3. Never work through more than a handful of tool calls without a visible line of text.
4. Simple questions answered in one step need no plan and no updates.
5. Write updates in the user's language.`

const REMINDERS = Object.freeze({
  plan: 'You have made {n} tool calls without a plan or a word to the user. Call `{tool}` now with a short plan for this task (one item in_progress), write the user one or two sentences on what you have done so far and what comes next, then continue the work.',
  update: 'You have made {n} tool calls without updating the user. Update the plan with `{tool}` (mark finished items completed), write the user one or two sentences on what you have done and what comes next, then continue the work.',
})

export function reminderText(kind, silent, todoTool) {
  return REMINDERS[kind].replaceAll('{n}', String(silent)).replaceAll('{tool}', todoTool)
}
