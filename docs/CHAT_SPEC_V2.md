# AVEGA — chat assistant v2: interview, full-screen, 17-entry handbook, merged Psychology page

Builds on `docs/CHAT_SPEC.md` (v1, implemented in `prototype/chat.js`). Everything in v1 stays valid unless this file changes it. The hard rules of v1 section 1 apply unchanged: **no medical sentence that is not in `KB`, `RECS`, v1 section 5 or this file**; every action carries its source ID or `без источника`; honest fallback; no medication advice; offline; do not break existing pages; Russian source strings with a full English dictionary.

Four work packages, in this order. Build and run the tests after each one.

---

## A. Seven new handbook entries (`KB` in `prototype/engine.js`)

Append these entries to `KB` exactly as written (same object shape as the existing ones). Sources R11–R17 are already in `docs/REFERENCES.md`; read them there. Do not change the ten existing entries. These seven have no synthetic symptom stream and are **not** added to the correlation matrix.

| id | name | sym | when | signs | now (text, ref) | doc | refs |
|---|---|---|---|---|---|---|---|
| `dcs` | Декомпрессионная болезнь | [] | При переходе из корабля в скафандр с более низким давлением, во время выхода в открытый космос. | Страница NASA не перечисляет симптомы у астронавтов. У водолазов описана сильная боль; в тяжёлых случаях — нарушение дыхания и признаки, похожие на инсульт. | «При симптомах во время выхода безопасно, но быстро завершите выход и вернитесь в корабль», R11 · «Перед выходом дышите кислородом по протоколу», R11 | Любые симптомы во время или после выхода в открытый космос — сообщите врачу сразу. | R11 |
| `hypoxia` | Лёгкая гипоксия | [] | Будущие дальние полёты с пониженным давлением в кабине; сейчас — в шлюзе перед выходом. NASA оценивает риск как относительно низкий. | Спутанность сознания, головная боль, ухудшение зрения, проблемы со сном. | «Проверьте показания давления и кислорода в вашем отсеке», — · «Сообщите члену экипажа, отвечающему за медицину», — | Спутанность сознания или ухудшение зрения — сообщите врачу сразу. | R12 |
| `food` | Питание | [] | Весь полёт; труднее всего, когда запасы нельзя пополнить. | NASA называет общие последствия: снижение работоспособности и болезни. Конкретные симптомы в источнике не перечислены. | «Ешьте по плану питания, не пропускайте приёмы пищи», — · «Отметьте в журнале, если еда надоела и вы едите меньше», R13 | Вы едите заметно меньше несколько дней или теряете вес. | R13 |
| `microbe` | Инфекции и микроорганизмы | [] | В любой момент полёта. | Симптомы в источнике не перечислены. Сказано, что астронавты могут заболеть, несмотря на меры предосторожности. | «Сообщите врачу о признаках инфекции», — · «Берите пробы и мазки с поверхностей по плану», R14 | Температура или другие признаки инфекции. | R14 |
| `eva` | Травмы при выходе в открытый космос | [] | Во время выхода в открытый космос и тренировок к нему. | Конкретные травмы в источнике не перечислены. Причины: перепад давления, физическая и умственная нагрузка, тяжёлый скафандр. | «Поддерживайте силу мышц и костей плановыми тренировками», R15 · «О любой травме или боли после выхода сообщите врачу», — | Любая травма или боль после выхода в открытый космос. | R15 |
| `team` | Отношения в экипаже | [] | Растёт с изоляцией, задержкой связи, нехваткой ресурсов и тесным жилым объёмом. | Проблемы с кооперацией, координацией и общением в экипаже, конфликты. | «Используйте навыки командной работы, отработанные до полёта», R16 · «Обратитесь за поддержкой к врачу-психологу на Земле», R16 · «Сделайте 5 минут медленного дыхания», P4 | Конфликт мешает совместной работе или длится больше недели. | R16 |
| `loads` | Посадка и перегрузки | [] | При посадке и при переходах между уровнями гравитации. | Возможна дезориентация. Ослабленные кости и мышцы повышают риск травмы. | «Используйте кресло и привязные ремни по процедуре посадки», R17 · «Не пропускайте тренировки», R5 | Любая травма или боль после посадки. | R17 |

Add to `REFS` in `chat.js`: R11 NASA HRP — decompression sickness · R12 NASA HRP — hypoxia · R13 NASA HRP — food and nutrition · R14 NASA HRP — host–microorganism interactions · R15 NASA HRP — spacewalk (EVA) injury · R16 NASA HRP — teamwork · R17 NASA HRP — dynamic loads.

New stems (v1 section 4.1 format):

| id | RU | EN |
|---|---|---|
| `dcs` | декомпресс, кессон, после выхода, суставы после | decompress, the bends, after spacewalk, after eva |
| `hypoxia` | гипокс, кислород, нехватк воздух | hypox, oxygen, thin air |
| `food` | еда, еды, питан, аппетит, не хочу есть, вес, худе, голод | food, appetite, nutrition, weight, hungry, eating |
| `microbe` | инфекц, температур, жар, лихорад, микроб, заболел, простуд | infect, fever, temperature, microb, germ, caught a cold |
| `eva` | выход в открыт, скафандр, внекорабел | spacewalk, eva, spacesuit |
| `team` | экипаж, команд, коллег, ссор, конфликт, не ладим | crew, team, crewmate, argument, conflict, get along |
| `loads` | перегруз, приземлен, посадк | g load, landing, touchdown |

Move `простуд` from `immune` to `microbe`, `конфликт`/`conflict` from `bhv` to `team`, and `посадк`/`landing` from `cardio` to `loads`. New red flag `confusion` (stems: спутан, путаются мысли, не соображаю, confus, disoriented, cant think) → renders the `hypoxia` entry with first line «Спутанность сознания — повод сообщить врачу сразу.», refs R12, urgent button.

`FACT` additions: `team: ['mood','stress']`, `hypoxia: ['sleep','cog']`, others `[]`.

---

## B. Interview mode (`prototype/chat.js`)

Purpose: a person with no medical training describes a problem in a few taps, and the assistant returns a clear level of action plus a summary the doctor can read. The assistant asks; the person mostly presses buttons. Questions use plain words, one question per bubble, 2–4 answer buttons, always including «Не знаю» where a yes/no is asked, and a small link «Пропустить вопросы» that jumps straight to the v1 answer.

### B.1 When an interview starts

- A condition topic from the table below is matched (top-scoring topic) → interview for it. If a second topic matched, its normal v1 answer is appended after the outcome.
- **Vague opening**: no topic matched but the text contains one of: плохо, нехорошо, болит, боль, больно, что-то не так, заболел, заболела, плохо себя чувств, не по себе, feel bad, unwell, sick, pain, hurts, something is wrong, not feeling well → ask Q0.
- Indicators, meta intents, red flags, drug-only and fallback behave as in v1 (no interview).

Q0 «Что беспокоит больше всего?» — buttons → target:
Голова → `co2` · Глаза или зрение → red `vision` · Тошнота, укачивание → `sms` · Головокружение → `cardio` · Спина → `sabp` · Кожа, сыпь → `immune` · Сон → `sleep` · Настроение, тревога → `bhv` · Отношения в экипаже → `team` · Сердце или грудь → red `chest` · Дыхание → red `breath` · Аппетит, еда → `food` · Температура, простуда → `microbe` · Другое → v1 fallback.

### B.2 Question sequence for a condition

1. **Q1 severity** «Насколько сильно это мешает?» — «Слабо: работать не мешает» (1) · «Средне: мешает, но работать могу» (2) · «Сильно: не могу работать или спать» (3). Same 1–3 scale as the symptom log (`SEV`).
2. **Q2 duration** «Как давно это началось?» — «Сегодня» (0) · «2–3 дня» (1) · «Больше трёх дней» (2) · «Больше недели» (3).
3. **Flags** from the `ASK` table, one question each, answers «Да» / «Нет» / «Не знаю».

Skip Q1/Q2 where the table says so.

### B.3 `ASK` table

Every flag is a restatement of that entry's `doc` field ("tell the doctor if"). `U` = urgent, `T` = tell the doctor. `dur≥n` = duration answer at or above n counts as a `T` flag. Do not add flags.

| id | Q1/Q2 | flags |
|---|---|---|
| `sms` | both; dur≥2 | T «Рвота повторяется?» · T «Не удаётся пить?» |
| `sabp` | both | T «Боль мешает сну или работе?» · T «Боль отдаёт в ногу?» · T «Есть онемение?» |
| `co2` | both; dur≥1 | T «Боль необычная, не похожа на прежние?» · U «Есть нарушение зрения?» |
| `immune` | both | T «Сыпь болезненная и идёт полосой?» · T «Есть температура?» · T «Высыпания около глаза?» |
| `sleep` | Q2 only | no questions; two flags are filled **from data** and shown as «Вижу по вашим данным»: T when each of the last 3 sleep sessions has z < −1 against the personal norm; T when the latest cognitive score has z < −1 |
| `bhv` | both; dur≥3 | U «Были ли мысли причинить себе вред?» — on «Да» the outcome is the v1 red-flag `selfharm` reply |
| `cardio` | both | U «Была боль в груди?» · U «Были перебои сердца?» · U «Был обморок?» |
| `bone` | Q1 only | T «Есть травма или боль при нагрузке?» · T «Не получается выполнять план тренировок?» |
| `dcs` | none | U «Вы недавно выходили в открытый космос или сейчас в скафандре?» |
| `hypoxia` | Q1 only | U «Есть спутанность мыслей?» · U «Ухудшилось зрение?» |
| `food` | Q2 only | T «Вы едите заметно меньше несколько дней?» · T «Вы теряете вес?» |
| `microbe` | both | T «Есть температура?» |
| `eva` | Q1 only | T «Есть травма или боль после выхода?» |
| `team` | Q2 only; dur≥3 | T «Конфликт мешает совместной работе?» |
| `rad`, `loads`, `sans` | no interview | v1 answer (`sans` stays a red flag) |

### B.4 Outcome

Level (first that applies):

1. **Срочно — «Сообщите врачу и члену экипажа, отвечающему за медицину, сейчас»**: any `U` flag answered «Да», or severity 3.
2. **Сообщить врачу — «Отправьте сводку врачу в ближайший сеанс связи»**: any `T` flag «Да», a `dur≥n` hit, a data flag, or «Не знаю» on a `U` flag.
3. **Наблюдать — «Можно начать с мер из справочника и наблюдать»**: otherwise.

Outcome bubble, top to bottom (`data-intent="<id>"`, plus `data-level="urgent|tell|watch"`):

1. Level chip and the one-line instruction above.
2. «Сводка опроса»: what (entry name), severity in words, since when, each flag with the answer, in plain words. This is what gets sent to the doctor.
3. v1 condition answer blocks: «Что известно», «Что видно в ваших данных», «Что можно сделать сейчас», «Сообщите врачу, если», sources.
4. Note (always): «Уровень определён по простым правилам из справочника. Это не диагноз и не клиническая сортировка.»
5. Buttons: «Отправить сводку врачу» (sends the summary text; `urgent: true` at level 1) · «Записать в журнал симптомов» (only where `c.sym.length`) · «Ответить заново».

At level 1 for `bhv` self-harm «Да» use the v1 `selfharm` text instead of the generic line.

### B.5 State

The stored conversation becomes an array of entries `{ t: <text shown>, a: <answer code or null> }` (migrate old plain-string entries). The interview state is **recomputed by replaying** the entries, never stored separately, so reload and language switch reproduce the same dialogue. A button press stores the button's Russian source label as `t` (rendered through the dictionary, not `data-raw`) and its code as `a`. Typed text during an interview: if it matches a button of the current question by stem (да/yes, нет/no, не знаю/dont know, слабо/mild, средне/moderate, сильно/severe) treat it as that answer; otherwise the interview is abandoned and the text is processed as a new message.

Only the newest unanswered question shows buttons; earlier ones show the chosen answer as a user bubble.

---

## C. Full-screen chat

- The chat card gets a header button «На весь экран» / «Свернуть» (icon + text). Full-screen = the chat covers the whole viewport (`position: fixed; inset: 0`, above the sidebar and the demo footer), with its own header: title, account name, language-independent close button, «Очистить диалог». `Esc` leaves full-screen. Background page must not scroll underneath.
- In full-screen the message list takes all remaining height; the input row stays at the bottom; content column max-width about 860 px, centred.
- Preference stored in `avega-chat-full` (`1`/`0`), **default `1`**: opening the Chat tab or pressing «Спросить ассистента» on the Dashboard opens full-screen. «Свернуть» returns to the in-page card and is remembered.
- Not full-screen: the card fills the available height of the main area so the input is visible without scrolling the page.
- Works at 390 px width (buttons wrap, no horizontal scroll) and in both themes.
- The all-pages scan must not get stuck behind the overlay: leaving the Chat tab closes the overlay.

---

## D. Merge Psychology and Cognitive Tests into one page

- One page, id `psychology`, name `Psychology & Cognition` (RU «Психология и когнитивные тесты»), icon `brain`, same nav group. Remove the `cognitive` nav item.
- Tabs: a new first tab «Обзор», then all existing tabs of both pages, unchanged, psychology first. If two tabs would share an id or a label, prefix the cognitive ones.
- «Обзор» (new block `rMindOverview`): one row per indicator — mood, stress, energy, cognitive score — with latest value, personal norm, deviation in SD and the same wording/colours the History page uses for better/worse; then a small table of the pairwise same-day correlations among these four plus sleep from `engine().get()`, showing `r` and the existing strength label, with the existing correlation caveat text. No new claims: only numbers already computed by `engine()` and `assess()`.
- `#cognitive` and every old `#cognitive-<tab>` hash must still open the right tab (alias). Update internal links that pointed to the old page.
- The doctor account sees the same merged page for the selected astronaut.

---

## E. Tests

Keep `/tmp/c1.py` and `/tmp/e1.py` green (update them for the storage shape and the merged page). Add `/tmp/c2.py`:

1. **Coverage of all 17 handbook entries.** For each entry: one RU and one EN query that must reach it (`data-intent`), e.g. `dcs`: «декомпрессионная болезнь» / "decompression sickness"; `hypoxia`: «не хватает кислорода» / "hypoxia"; `food`: «пропал аппетит» / "no appetite"; `microbe`: «у меня температура» / "I have a fever"; `eva`: «травма после выхода в открытый космос» → accept `eva` or `dcs` first; `team`: «поссорился с коллегой» / "argument with a crewmate"; `loads`: «перегрузки при посадке» / "landing loads"; plus the ten v1 entries.
2. **Coverage of the 17 HRP risks.** A table in the test mapping each HRP risk title (list in `docs/REFERENCES.md`, R1) to a handbook id; assert each id exists in `KB`. "Inadequate systems operations support" maps to none and must give the fallback — assert that too.
3. **Interview paths**, for every entry that has one: (a) all mild / «Сегодня» / every flag «Нет» → `data-level="watch"`; (b) first flag «Да» → `tell` or `urgent` according to its mark; (c) severity 3 → `urgent`; (d) «Пропустить вопросы» → v1 answer without a level. For `sleep` assert the data flags are shown and consistent with the data of at least two different crew accounts.
4. Vague opening «мне плохо» → Q0; each Q0 button reaches its target.
5. Typed answers («да», "no") advance the interview; unrelated text abandons it.
6. Reload in the middle of an interview resumes at the same question; switching language mid-interview shows the same question in the other language.
7. «Отправить сводку врачу» → the summary appears in the doctor account, urgent chip at level 1.
8. Full-screen: default on; covers the viewport; `Esc` and «Свернуть» close it and the choice survives reload; no horizontal overflow at 1440, 1000 and 390 px in both themes.
9. Merged page: old `#cognitive` hashes open the right tab; nav has no separate Cognitive item; `rMindOverview` numbers equal the ones on History for the same person.
10. Language scan of every interview question, every outcome level and all 17 entries in both languages, 4 crew accounts.

Look at screenshots: full-screen chat mid-interview and at an outcome (dark and light), the merged page overview.

## F. Docs

- `docs/SCIENTIFIC_METHODOLOGY.md`: extend the chat section — interview, how the level is derived from the `doc` criteria, that it is not clinical triage; merged page.
- `docs/PARAMETERS.md`: note the seven entries without tracked symptoms.
- New `docs/ROADMAP.md` with exactly these planned items, marked "not implemented": (1) correlation of chat-reported symptoms and interview answers with psychological indicators over time; (2) a weekly short creative game that yields psychological indicators (design and scientific basis to be chosen from published instruments before building); (3) validated mood/anxiety scales; (4) HRV; (5) radiation dose; (6) prevention suggestions based on a person's own lead–lag links once real data exist.
- `README.md`: project map line for the new docs.

## G. Report back

Same format as v1 section 10: files changed; test counts; every deviation with its reason; anything left out because it would need new medical content; problems noticed in existing code; what was run versus only written. Do not publish.
