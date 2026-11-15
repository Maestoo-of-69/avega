# AVEGA — chat assistant: implementation spec

Status: spec for implementation. Author of the spec: planning model. Implementer: follow it literally; where the spec is silent, choose the option that invents nothing medical.

## 1. Goal and non-goals

Turn the existing rule-based on-board assistant (`prototype/engine.js`) into a **chat**: the astronaut types a question in free text (Russian or English) and gets an answer assembled **only** from
(a) the on-board handbook `KB` and recommendation table `RECS` in `engine.js`,
(b) this person's own data (`assess()`, `engine()`),
(c) fixed safety texts in this spec.

Hard rules (the reason this product exists):

1. **No generated medical text.** The chat is retrieval + templates, not a language model. It never produces a sentence of medical content that is not already in `KB`, `RECS` or section 5 of this spec. Do not add new medical facts, numbers, doses, drug names or advice. If you think something is missing, leave it out and list it in your final report.
2. **Every action shows its source ID** (`R3`, `S4`…) or the label `без источника`, exactly as `KB`/`RECS` already store it.
3. **If nothing matches, say so.** The fallback answer admits there is no answer in the database. No guessing from partial matches (see scoring threshold).
4. **No medication advice.** Any drug question gets the fixed `NODRUG` line.
5. **Works offline.** No network calls, no `eval`, no external libraries.
6. Do not break existing pages. Do not change `KB`, `RECS`, `assess()` logic or the data generator.
7. Language rule of the project: Russian mode fully Russian, English mode fully English (proper names and abbreviations excepted). Source strings are written in Russian; English comes from the dictionary in `i18n.js`.

## 2. Files

| File | Change |
|---|---|
| `prototype/chat.js` | **new**: all chat logic and rendering |
| `prototype/build_shell.py` | add `chat.js` to the inlined list after `engine.js`, before `ui.js` (line with `('core.js', 'explorer.js', 'i18n.js', 'engine.js', 'ui.js')`) |
| `prototype/ui.js` | Personal Support: new **first** tab `{ id: 'chat', label: 'Чат', blocks: [C('AVEGA Assistant chat', 's12', rChat, ['demo'])] }`; Dashboard assistant card: add a second ghost button linking to `#support-chat` ("Спросить ассистента"); Mission Control → tab «Назначения»: new block `rCrewQuestions` |
| `prototype/i18n.js` | (1) in `localize()` skip text nodes inside `[data-raw]`; (2) one more `Object.assign(ADD_EN, {...})` and `Object.assign(ADD_RU, {...})` **before** `const rxOf` |
| `prototype/shell.css` | chat styles, using existing tokens only (`--blue`, `--pill`, `--border`, `--text2`, `--muted`, `--line`) so light and dark themes both work |
| `docs/SCIENTIFIC_METHODOLOGY.md` | new section "Chat assistant" (how matching works, what it cannot do) |
| `docs/AI_DISCLOSURE.md` | one paragraph: the in-app chat is not an LLM |
| `README.md` | one line in the project map |

Read first: `prototype/engine.js` (whole file), `prototype/boot.js`, `localize`/`tr` in `i18n.js`, `rInbox`/`rNoteForm`/`msgsGet` in `ui.js`, `/tmp/e1.py` (the existing all-pages scan; reuse its harness). Check where `esc` is defined (`core.js`) and whether it is in scope for `chat.js`; if not, define a local escaper.

## 3. Matching pipeline (`chat.js`)

`reply(text, ctx)` → `{ intent, html }`. Steps, in this order:

1. **Normalise**: lower-case, `ё→е`, replace anything that is not a letter/digit with a space, collapse spaces.
2. **Red flags** (section 5.1). If any red-flag stem is present, the red-flag answer is the whole reply. Red flags always win over everything else.
3. **Drug question** flag (stems in 4.3): sets `drug = true`; does not end the pipeline.
4. **Topic scoring**: for every topic in 4.1 and 4.2 count how many distinct stems occur in the text (a stem matches when a word *starts with* it; multi-word stems match as substrings). Keep topics with score ≥ 1, sort by score, take at most **2**.
5. **Meta intents** (4.4) are checked only if step 4 found nothing.
6. **Follow-up**: if nothing matched but the text contains a follow-up stem (`что делать`, `что дальше`, `почему`, `подробнее`, `what to do`, `what next`, `why`, `more`) and `ctx.last` (the previous topic id in this conversation) exists, answer for `ctx.last`.
7. **Fallback** (5.4). If `drug` is true and no topic matched, the reply is the drug answer (5.3) alone.

Each reply bubble carries `data-intent="<id>"` (for two topics: `"co2+sleep"`). Tests rely on it.

## 4. Vocabulary

Stems are prefixes. Keep them in one table at the top of `chat.js`. Russian stems are written after `ё→е`.

### 4.1 Conditions (ids = `KB` ids)

| id | RU stems | EN stems |
|---|---|---|
| `sms` | укачива, тошн, рвот, мутит, морск | nause, vomit, motion sick, queasy |
| `sabp` | спин, поясниц | back pain, backache, lower back, spine |
| `co2` | голов бол, болит голов, головн, мигрен, co2, углекисл, душно | headache, head hurts, migraine, carbon dioxide, stuffy |
| `sans` | (handled as red flag `vision`, see 5.1) | |
| `immune` | сып, герпес, высыпан, простуд, иммун, аллерг, кож | rash, herpes, cold sore, immun, allerg, skin |
| `sleep` | сон, сплю, спал, спать, бессонниц, не высып, недосып, засыпа, просыпа | sleep, insomnia, awake, tired in the morning |
| `bhv` | тревог, тревож, подавлен, груст, одиноч, скуча, раздраж, конфликт, депресс, паник, страшно, плохо на душе, тоск | anxi, depress, lonely, sad, irritab, conflict, panic, homesick, low mood |
| `cardio` | головокруж, кружится голов, давлен, посадк | dizz, lightheaded, blood pressure, landing |
| `bone` | кост, мышц, тренировк, упражнен, сила | bone, muscle, workout, exercise, strength |
| `rad` | радиац, облучен, дозиметр, вспышк | radiat, dosimeter, solar flare |

`головокруж`/`dizz` scores for both `sms` and `cardio`; that is intended (two-topic answer).

### 4.2 Personal indicators (ids = `EKEYS`)

| id | RU stems | EN stems |
|---|---|---|
| `hr` | пульс, сердцебиен, чсс | heart rate, pulse, bpm |
| `stress` | стресс, напряж, нерв | stress, tense, nervous |
| `mood` | настроен | mood |
| `energy` | энерг, устал, сил нет, вял | energy, fatigue, exhausted, tired |
| `cog` | вниман, памят, концентрац, реакц, когнитив, туплю, ошибк | attention, memory, focus, concentrat, reaction, cognitive, mistakes |

Sleep as an indicator is covered by condition `sleep`, whose answer also includes the personal sleep value (see 5.2).

### 4.3 Drug stems

таблет, лекарств, препарат, доз, принять, выпить, обезбол, снотворн, pill, medic, drug, dose, painkiller, ibuprofen, paracetamol, melatonin, sleeping pill

### 4.4 Meta intents

| id | stems | answer |
|---|---|---|
| `status` | как я, мое состояние, мои показатели, что со мной, все ли в порядке, how am i, my status, my data, am i ok | `assistantHTML(true)` reused as is |
| `links` | связ, коррел, влияет, зависит, из-за чего, correlat, linked, affects, depends | personal links (5.5) |
| `doctor` | врач, доктор, мерфи, земл, когда ответ, doctor, murphy, earth, surgeon | delay text (5.6) |
| `about` | кто ты, что ты умеешь, помощь, помоги, откуда ты знаешь, источник, who are you, what can you do, help, source | about text (5.7) |
| `hello` | привет, здравств, добрый, спасибо, hello, hi, thanks, thank you | one-line greeting + suggestion chips |

## 5. Answers

All strings below are the Russian source strings. Each must get an English dictionary entry.

### 5.1 Red flags (fixed texts; `data-intent="red-<id>"`, rendered with a warning style)

| id | stems | text |
|---|---|---|
| `selfharm` | суицид, покончить с, убить себя, не хочу жить, причинить себе вред, навредить себе, suicid, kill myself, end my life, hurt myself, self harm, dont want to live | «Сообщите об этом командиру или члену экипажа, отвечающему за медицину, прямо сейчас и не оставайтесь в одиночестве. Отправьте сообщение врачу с пометкой "срочно". Я — справочная программа и не могу заменить человека в такой ситуации.» Source label: `R3` (the handbook entry `bhv`, field `doc`, already says such thoughts mean "tell the doctor immediately") for the "tell the doctor" part; `без источника` for the rest. |
| `chest` | боль в груд, болит в груд, давит в груд, перебои сердц, сердце останавл, chest pain, palpitation, heart skips | «Боль в груди, перебои сердца и обморок — повод сообщить врачу сразу (справочник, раздел "Сердце, сосуды и посадка").» + «Прекратите нагрузку и сообщите члену экипажа, отвечающему за медицину.» (`без источника`). Refs `R5`. |
| `faint` | обморок, потерял сознан, потеряла сознан, теряю сознан, fainted, passed out, lost consciousness | same text and refs as `chest` |
| `vision` | зрен, вижу хуже, размыт, двоится, плохо вижу, vision, blurr, double vision, cant see | render the `KB` entry `sans` (5.2 layout) with the first line «Любое изменение зрения — повод сообщить врачу сразу.» Refs `R9`. |
| `breath` | задыхаюсь, не могу дышать, трудно дышать, одышк, cant breathe, short of breath, breathless | «В моей базе нет раздела о затруднённом дыхании. Сообщите члену экипажа, отвечающему за медицину, и врачу прямо сейчас.» (`без источника`) |

Every red-flag answer ends with the button «Отправить врачу как срочное» (section 6) and the line «Ответ с Земли придёт не раньше чем через N мин (демо)» where N = `2 * CREWDATA.delay_min`.

### 5.2 Condition answer (for a `KB` entry `c`)

Layout, top to bottom:

1. Heading: `c.name`, with `c.refs` as a small label.
2. «Что известно»: `c.when` + `c.signs`.
3. «Что видно в ваших данных» — the personal block. This is the correlation with psychological and environmental factors, and it is the part a general chatbot cannot do. For each factor in `FACT[c.id]`:
   - current value and its position against the personal norm, taken from `assess().cur[k]` (value, z): «Сон: 5,9 ч · −1,4 SD к вашей норме»; within ±1 SD → «в пределах вашей нормы». For `co2` show only today's value from `assess().co2` (there is no personal norm for it).
   - if the condition has a tracked symptom (`SYMOF = { co2: 'headache', immune: 'skin' }`) and `engine().get(SYMOF[c.id], k)` has `|r| ≥ 0.3`, add: «По вашим данным этот симптом и показатель связаны: r = +0,41». Below that threshold print nothing about the link (do not write "no link").
   - `FACT = { co2: ['co2','sleep','stress'], immune: ['stress','sleep'], sleep: ['sleep','stress','cog'], bhv: ['mood','stress','sleep','energy'], sabp: ['sleep'], cardio: ['hr'], sms: [], bone: [], rad: [], sans: [] }`. The factor lists come from what the cited sources link to each condition (see `docs/REFERENCES.md` S1, S4, S5, R10, P1, P2, R3). Do not extend them.
   - if the list is empty: «Для этого состояния в приложении нет связанных показателей.»
   - always end the block with the small note «Данные в прототипе синтетические; связь показывает работу метода, а не медицинский вывод.»
4. «Что можно сделать сейчас»: `c.now`, same markup as in `rHandbook` (reuse the `.reco-list` markup with `.ref`).
5. «Сообщите врачу, если: » + `c.doc`.
6. Sources line: for every ID in `c.refs`, the ID and its short title from the `REFS` table (section 7).
7. Buttons: «Отметить в журнале симптомов» (only when `c.sym.length`; adds `c.sym[0]` to today's ticks through the same storage `rHandbook` uses — `symKey()`, then `ASSESS = null`; never auto-tick), «Отправить вопрос врачу» (section 6).

For the `sleep` condition, the personal block replaces a separate indicator answer.
With two matched topics render two answers one after another inside one bubble.
If `drug` is true, add the `NODRUG` line as a highlighted row at the end.

### 5.3 Drug-only answer (`data-intent="drug"`)

«Я не подсказываю лекарства и дозы. Лекарства — только по бортовому медицинскому протоколу и указанию врача.» (`без источника`) + «Напишите, что именно беспокоит: я покажу, что можно сделать без лекарств.» + button «Отправить вопрос врачу».

### 5.4 Fallback (`data-intent="none"`)

«В моей базе нет ответа на этот вопрос, а выдумывать я не буду.» + «Я знаю: » + clickable chips of all 10 `KB` names and the 6 indicators + button «Отправить вопрос врачу».

### 5.5 Indicator answer (`hr`, `stress`, `mood`, `energy`, `cog`) and `links`

- Line 1: `elab(k)`, current value, unit, personal norm (mean ± SD from `normFor`, the same way `assess()` gets it), z in SD, and the verdict (`FIND[k]` when unfavourable beyond 1 SD, otherwise «в пределах вашей нормы»; a favourable deviation is reported as «лучше вашей нормы»).
- «По вашим данным»: lag-1 links involving `k` with `|r| ≥ 0.3` from `engine()` in both directions («после дня с низким показателем X на следующий день обычно хуже Y», reuse the wording already used in `assistantHTML` for links). `hr` has no lag links (hourly vs daily, same reason as in `assess()`): print «Для пульса связи по дням не считаются.»
- «Что можно сделать сейчас»: `RECS[k]` — shown **only if** the value is unfavourable beyond 1 SD; otherwise «Особых действий не требуется.»
- `links` intent with no indicator named: list the 5 strongest same-day pairs with `|r| ≥ 0.3` from `engine().same` for this person, then the standard correlation caveat already present in `rCorrExplain`.

### 5.6 `doctor`

«Врач на Земле — <doctor name>. Сообщение идёт N мин в одну сторону (демо; реальный диапазон Земля–Марс 3–22 мин), ответ придёт не раньше чем через 2N мин. Пока ответа нет, я подскажу, что можно сделать по бортовому справочнику.» Refs `C1`, `C2`. + button «Отправить вопрос врачу».

### 5.7 `about`

«Я — бортовой помощник AVEGA. Я работаю без связи с Землёй и отвечаю только по бортовому справочнику и вашим личным данным. У каждого совета указан номер источника; если источника нет, я это пишу. Я не языковая модель: я не сочиняю ответы, не ставлю диагноз и не назначаю лекарства. Если ответа в базе нет, я так и скажу и предложу отправить вопрос врачу.» + the number of handbook entries and of distinct source IDs, both **computed** from `KB`/`RECS` at run time (do not hard-code).

## 6. Conversation, storage, doctor hand-off

- Storage key `avega-chat-<VIEW>`: JSON array of the **user's texts only** (max 30, oldest dropped). Replies are regenerated on every render, so they follow the current language and current data. `ctx.last` is recomputed while replaying.
- UI: scrollable message list (assistant left, user right), a row of suggestion chips above the input (`Как я сейчас?`, `Болит голова`, `Плохо сплю`, `Тревожно`, `От чего зависит мой сон?`, `Когда ответит врач?`), a text input (`maxlength 300`), a send button, and «Очистить диалог». Enter sends. After sending, scroll to the newest message. Empty conversation shows the `about` text as the first assistant bubble.
- User text is rendered with HTML escaping inside an element with `data-raw`, and `localize()` must skip `[data-raw]` so the user's own words are never run through the translation dictionary.
- «Отправить вопрос врачу»: appends `{ from: VIEW, to: 'murphy', text: <the user's question>, urgent: <true for red flags>, at: <locale date-time> }` to the existing `avega-msgs` list, then replaces the button with «Отправлено врачу. Ответ не раньше чем через 2N мин (демо).» Existing readers filter `from === 'murphy'`; confirm that and keep them working.
- Doctor account (`IS_DOC`): no input. Show «Чат доступен астронавту на борту. Вопросы экипажа — в разделе Mission Control → Назначения.» New block `rCrewQuestions` in Mission Control → «Назначения»: list of messages with `to === 'murphy'` (name, time, escaped text in `data-raw`, chip «срочно» when `urgent`), newest first; empty state «Вопросов от экипажа пока нет.»

## 7. `REFS` table (short titles, same in both languages)

R2 NASA HRP — radiation risk · R3 NASA HRP — behavioral conditions · R4 NASA HRP — bone changes · R5 NASA HRP — cardiovascular adaptations · R6 NASA HRP — sleep and schedules · R7 NASA HRP — fitness · R8 NASA — sensorimotor and vestibular function · R9 NASA — SANS · R10 NASA — immune system responses · S1 Kerstman et al. 2012 — space adaptation back pain · S2 Khalid et al. 2023 — space motion sickness review · S3 NASA NTRS 19830021722 — space motion sickness · S4 Law et al. 2014 — CO₂ and headaches on the ISS · S5 Rooney et al. 2019 — herpes virus reactivation · S6 Mehta et al. 2017 — virus reactivation on the ISS · P1 Barger et al. 2014 — sleep deficiency in astronauts · P2 Basner et al. 2013 — Mars 520-day simulation · P3 Cognition test battery (Basner et al.) · P4 Goessl et al. 2017 — HRV biofeedback meta-analysis · N6 NASA NTRS 20260002661 — behavioural health in isolation · C1 NASA Science — Perseverance communications · C2 NASA NTRS — communication delays for Mars missions

Check each title against `docs/REFERENCES.md` before using it; if one differs, the file wins. An ID missing from this table is shown as the bare ID.

## 8. i18n

- Every Russian string added must have an English entry in the new `Object.assign(ADD_EN, {...})`. English card title `AVEGA Assistant chat` needs an `ADD_RU` entry («Чат с ассистентом AVEGA»).
- The translator is fragment-based with word boundaries. Keep each sentence one whole string where possible; put numbers and names in separate elements (`<span>`/`<b>`) instead of concatenating them into the middle of a translatable sentence. A dictionary key must not end with `(`.
- `KB` and `RECS` strings are already translated; reuse them unchanged.

## 9. Tests (must all pass before you report)

1. `python3 prototype/build_shell.py` builds without errors.
2. `/tmp/e1.py` (all 5 accounts × pages × RU/EN): no console errors, no Cyrillic in EN mode outside `[data-raw]`, no untranslated Latin UI text in RU mode. Extend it to open `#support-chat`.
3. New `/tmp/c1.py` (same harness): for account `alex`, type each query and assert the `data-intent` of the last assistant bubble:

| query | expected |
|---|---|
| У меня болит голова | `co2` |
| болит голова и плохо сплю | `co2+sleep` (order by score, either order accepted) |
| меня тошнит | `sms` |
| кружится голова | contains `cardio` |
| сыпь на губах | `immune` |
| мне тревожно и одиноко | `bhv` |
| боль в груди | `red-chest` |
| я не хочу жить | `red-selfharm` |
| стало хуже зрение | `red-vision` |
| какую таблетку выпить | `drug` |
| какую таблетку выпить от головы | `co2` and the reply contains the `NODRUG` text |
| как я сейчас | `status` |
| от чего зависит мой сон | `sleep` |
| когда ответит врач | `doctor` |
| кто ты | `about` |
| какая столица Франции | `none` |
| I have a headache (EN mode) | `co2` |
| I can't sleep (EN mode) | `sleep` |
| chest pain (EN mode) | `red-chest` |
| what is the capital of France (EN mode) | `none` |

   Also assert: the user's text appears unchanged in both languages; after a page reload the conversation is restored; «Отправить вопрос врачу» makes the question appear in the doctor account under Mission Control → «Назначения»; «Очистить диалог» empties the list; switching to another crew account shows a separate conversation.
4. Take one screenshot of the chat in the dark theme and one in the light theme and look at them: no overflow, no overlapping, readable contrast.

## 10. Report back

List: files changed; test results (counts); anything in this spec you could not do or decided differently, and why; any place where you were tempted to add medical content that is not in `KB`/`RECS`/section 5 (do not add it — list it). Do not publish the artifact; the build output `prototype/avega_shell.html` is enough.
