# dsh-progress-updates

**English** | [Русский](#русский)

A plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) that makes the agent work like a person, not a black box. Instead of going silent for an hour and dumping the result at the end, the model:

- writes a short plan with `todo_write` before multi-step tasks (DSH shows it as the **Todos** bar above the composer);
- marks steps as done while it works;
- posts a 1–2 sentence update after each meaningful step: what it did and what comes next.

If the model still goes quiet for several tool calls in a row, the plugin gives it a gentle reminder.

```
Cloned the repository. Now reading the docs and entry points to understand the architecture.
  > Reading files
Structure is clear: 13 Python packages plus resource folders. Updating the plan…
  > Updated plan, ran commands
[ Todos  3 completed · 1 in progress · 2 pending ]
```

## How it works

1. **System prompt section.** Asks the model to plan tasks of 3+ steps with `todo_write`, to keep the current item `in_progress`, and to write short updates. Single-step questions get no plan and no updates.
2. **Silence counter.** Counts tool calls made without any visible text to the user. After `silentToolCalls` silent calls it appends a reminder to the context (source `progress-updates`), then repeats it every `repeatEvery` calls. Without a plan, the reminder asks for one; with a plan, it asks to update it.
3. **Reset.** The counter resets when the model writes visible text, calls `todo_write`, or the user sends a message.
4. **Subagents are ignored.** Only the agent you talk to is tracked.

The plugin never blocks or rewrites tool calls. It only adds context, following the pattern of DSH's built-in `dsh-repeat-tool-reminder`.

## Install

Requires DSH `0.2.x` (tested on `0.2.2-rc.1`) and `pnpm` (`npm install -g pnpm`).

### Web / other profiles

```sh
dsh plugin --profile web add github:Biomistik-Official/dsh-progress-updates
```

Restart DSH.

### DSH Desktop

The `desktop` profile is managed by the app, and `dsh plugin` refuses it, so install by hand:

1. Close DeepSeek Harness.
2. Open `~/.dsh/profiles/desktop/package.json` (on Windows: `C:\Users\<you>\.dsh\profiles\desktop\package.json`) and make a backup copy.
3. Add the dependency and the bundle:

   ```jsonc
   {
     "dsh": {
       "profile": {
         "bundles": [
           // ...existing bundles...
           "dsh-progress-updates"
         ]
       }
     },
     "dependencies": {
       // ...existing dependencies...
       "dsh-progress-updates": "github:Biomistik-Official/dsh-progress-updates"
     }
   }
   ```

4. Run `pnpm install` in `~/.dsh/profiles/desktop`.
5. Start DeepSeek Harness again.

### From a local clone (for development)

```sh
git clone https://github.com/Biomistik-Official/dsh-progress-updates.git
```

Use `"link:/absolute/path/to/dsh-progress-updates"` instead of the `github:` spec above. Changes then apply after a DSH restart.

### Check that it works

Give the agent a multi-step task, for example *"Study this repository and list its packages with their purpose."* You should see the **Todos** bar and short updates between tool calls. A simple question like *"what is 2+2"* should come back without a plan.

## Configuration

All fields are optional. Put them in your profile's `cordis.patch.yml`:

```yaml
- id: progress-updates
  name: dsh-progress-updates
  config:
    silentToolCalls: 4
    repeatEvery: 4
    exclude: [read_file]
```

| Field | Default | Meaning |
| --- | --- | --- |
| `silentToolCalls` | `6` | Silent tool calls allowed before the first reminder (integer ≥ 1) |
| `repeatEvery` | `6` | Further silent calls between repeated reminders (integer ≥ 1) |
| `exclude` | `[]` | Tool names that are not counted (exact names, no wildcards) |
| `promptSection` | `true` | Whether to add the progress-updates section to the system prompt |
| `todoTool` | `todo_write` | Name of the plan tool, used in the prompt and the reminders |

Invalid values or unknown keys fail at load with a `progress-updates: …` error. Either omit `config:` or make it an object.

## Limitations

- The state lives in memory only. After a DSH restart, tracking resumes with your next message.
- If another prompt plugin in your profile tells the model to be extremely terse, updates may get rarer. Lower `silentToolCalls` so reminders kick in sooner.
- DSH is a developer preview, so its plugin APIs may change between versions.

## Development

```sh
npm test
```

The pure logic in `src/` has no DSH imports and is tested with `node:test` (Node 22+). `index.js` injects `createUserMessage` and `chunkHasVisibleText` from `@deepseek-ai/dsh-llm`, which DSH provides at runtime.

## License

MIT

---

## Русский

Плагин для [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH). С ним агент работает как человек, а не как чёрный ящик: раньше было «дал задачу и час ждёшь результат», теперь модель:

- перед многошаговой задачей составляет короткий план через `todo_write` (DSH показывает его панелью **«Дела»** над полем ввода);
- отмечает выполненные шаги по ходу работы;
- после каждого значимого шага пишет 1–2 предложения: что сделано и что дальше.

Если модель всё же молчит несколько вызовов инструментов подряд, плагин мягко ей об этом напоминает.

### Как работает

1. **Раздел в системном промпте.** Просит модель составлять план `todo_write` для задач из 3 шагов и больше, держать текущий шаг в `in_progress` и писать короткие апдейты. Простые вопросы обходятся без плана.
2. **Счётчик молчания.** Плагин считает вызовы инструментов без видимого текста для вас. После `silentToolCalls` таких вызовов он добавляет модели напоминание: «составь план», если плана ещё нет, или «обнови план и напиши апдейт», если план уже есть. Дальше напоминание повторяется каждые `repeatEvery` вызовов.
3. **Сброс.** Счётчик обнуляется, когда модель пишет текст, вызывает `todo_write` или вы отправляете сообщение.
4. **Сабагенты не отслеживаются.** Плагин следит только за агентом, с которым вы общаетесь.

Плагин ничего не блокирует и не переписывает, он только добавляет контекст.

### Установка

Нужны DSH `0.2.x` (проверено на `0.2.2-rc.1`) и `pnpm` (`npm install -g pnpm`).

**Веб-профиль и другие профили:**

```sh
dsh plugin --profile web add github:Biomistik-Official/dsh-progress-updates
```

После этого перезапустите DSH.

**DSH Desktop.** Профилем `desktop` управляет само приложение, команда `dsh plugin` его не принимает, поэтому установка ручная:

1. Закройте DeepSeek Harness.
2. Откройте `C:\Users\<вы>\.dsh\profiles\desktop\package.json` и сделайте резервную копию.
3. Добавьте `"dsh-progress-updates"` в конец списка `dsh.profile.bundles`, а в `dependencies` — строку `"dsh-progress-updates": "github:Biomistik-Official/dsh-progress-updates"` (пример выше, в английской части).
4. Выполните `pnpm install` в папке `~/.dsh/profiles/desktop`.
5. Запустите DeepSeek Harness.

**Проверка.** Дайте агенту многошаговую задачу, например «изучи этот репозиторий и составь список его пакетов с назначением». Должны появиться панель «Дела» и короткие апдейты между шагами. На простой вопрос («сколько будет 2+2») модель должна ответить без плана.

### Настройки

Все поля необязательны и задаются в `cordis.patch.yml` профиля (пример выше):

| Поле | По умолчанию | Что значит |
| --- | --- | --- |
| `silentToolCalls` | `6` | Сколько вызовов подряд без текста допускается до первого напоминания |
| `repeatEvery` | `6` | Через сколько ещё таких вызовов повторять напоминание |
| `exclude` | `[]` | Какие инструменты не считать (точные имена, без масок) |
| `promptSection` | `true` | Добавлять ли раздел про апдейты в системный промпт |
| `todoTool` | `todo_write` | Имя инструмента плана |

Если значение неверное или ключ неизвестен, DSH при загрузке выдаст ошибку `progress-updates: …`.

### Ограничения

- Состояние хранится только в памяти. После перезапуска DSH отслеживание начинается с вашего следующего сообщения.
- Если у вас стоит промпт-плагин, который требует от модели предельной краткости, апдейтов может стать меньше. Тогда уменьшите `silentToolCalls`.
- DSH пока в developer preview, API плагинов может меняться между версиями.

### Лицензия

MIT
