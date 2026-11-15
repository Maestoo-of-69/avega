# AVEGA Assistant v3 — «психология ↔ здоровье»: тренды, сила связи, рекомендации, опрос с данными

Plan written by the planning model; code is implemented by a coding agent and re-checked independently.
Goal (product owner): the assistant must embody AVEGA's main idea — find the links between psychological state and health
**for this person**, show **how strong** the effect is (not only that a link exists), say **since which day** something got worse,
and recommend sourced actions. The interview must use the person's data and stay logically consistent with it.

Hard rules (unchanged): no language model, only transparent statistics and rules; no diagnosis; no medication advice;
every recommendation carries a source id from `docs/REFERENCES.md` (or «—»); data are synthetic and labelled so;
"связано / в дни после", never "вызывает" (correlation ≠ causation); RU mode fully Russian, EN mode fully English.
No new medical facts: use only existing `RECS`, `KB`, and reference ids already in REFERENCES.md.

## A. Engine (`engine.js`) — three new pure functions (memoised like `engine()`)

Daily series come from `engine().S[k]` over `engine().days` (already used for correlations). Daily norm of an indicator =
mean and SD of its daily values over **all days before the last 7** (a personal baseline that does not include the week
being judged); needs ≥ 10 values, else `null`. `BAD[k]` gives the "worse" direction. Keys: `stress, mood, energy, sleep, cog, hr`.

### A1. `trend(k)` → `{ n7, m7, mPrev, base:{m,sd,n}, z7, delta, run, since, status }`
- `m7` = mean of the last 7 days (days with data, `n7` ≥ 3 else status `'nodata'`); `mPrev` = mean of the 7 days before.
- `z7 = (m7 − base.m) / base.sd`; `delta = m7 − mPrev`.
- `run` = number of consecutive most-recent days-with-data whose value is on the bad side of the baseline by more than
  0.5 SD (`BAD[k] * (v − base.m) / base.sd > 0.5`); `since` = timestamp of the first day of that run (null if run = 0).
- `status`: `'worse'` if `BAD[k]*z7 > 1`; `'better'` if `BAD[k]*z7 < −1`; else `'norm'`.
  Additionally `dir`: `'rising-bad'` if status is `'norm'` but `BAD[k]*delta > 0.5*base.sd` (getting worse inside the norm), else null.

### A2. `impact(a, b, lag)` → effect size in units of b, `lag` ∈ {0, 1}
- Take pairs (a on day d, b on day d+lag) with both present. Split by a: "bad-a days" = a on its bad side by > 0.5 SD of a's
  full-series SD from a's full-series mean; "ordinary days" = all the rest.
- Return `{ a, b, lag, nBad, nOk, mBad, mOk, diff: mBad − mOk, r }` where `r` = existing same-day / lag-1 Pearson.
- Valid only if `nBad ≥ 5` and `nOk ≥ 5`; else `null`.
- "Noticeable" impact: `|r| ≥ 0.3` **and** `|diff| ≥ 0.3 × SD(b)`; "worsening": `BAD[b] * diff > 0`.

### A3. `psyLinks()` → sorted list of noticeable, worsening impacts over this fixed set of psych ↔ health pairs
- psych → health: (stress|mood|energy) → (sleep lag1, hr lag0, cog lag0, cog lag1, headache lag0, skin lag1)
- health → psych: (sleep) → (stress|mood|energy|cog lag0 — the night before the day; use the existing day alignment of `S.sleep`,
  check in the generator which day a night belongs to and document it in a comment), (co2) → (headache lag0) as a non-psych control row shown separately.
- Sort by |r| desc; keep `dirType: 'psy→health' | 'health→psy'`.
- Symptoms (headache, skin) are 0–3 daily scores over flight days only: for them report `mBad`/`mOk` as "share of days with the symptom" (%, value > 0).

## B. Chat (`chat.js`)

### B1. New intent `week` (meta) — «Как прошла неделя?», «за последнее время», «динамика», «тренд», EN: "week", "lately", "trend", "recently"
Add chip «Как прошла неделя?» to `CH_SUG` (keep the others). Reply blocks, in this order:
1. **«За последние 7 дней»** — one row per indicator from `trend(k)`:
   `Стресс — выше вашей нормы: 4,6 против 3,4 / 10 (+1,2 SD) · хуже нормы с дня 43 (4 дня подряд)`
   or `Стресс — в пределах вашей нормы: 3,5 против 3,4 / 10` (+ «, но растёт вторую неделю» when `dir`), or `лучше вашей нормы`.
   Worse rows first, with the warn style; in-norm rows compact.
2. **«Как это связано у вас»** — up to 4 rows from `psyLinks()`, preferring links whose `a` is an indicator that is currently
   `worse`/`rising-bad`. Wording with effect size and n:
   `После дней с высоким стрессом вы спите в среднем на 0,6 ч меньше: 6,7 против 7,3 ч (12 и 31 день, r = −0,41)`.
   Symptoms: `В дни с высоким стрессом сыпь отмечалась в 3 раза чаще: 18 % против 6 % дней`. If nothing passes: «Заметных связей пока нет.»
3. **«Что стоит сделать»** — action list built by rule: for each `worse` indicator its `RECS[k]`; **plus the lever rule**: if a
   worse (or rising-bad) indicator `b` has a noticeable link `a → b`, add `RECS[a]` first with the explanation line
   «Начните со стресса: у вас он связан со сном» (the lever is the upstream indicator `a`). De-duplicate, max 5, each with its ref.
   When everything is in norm: «Показатели в пределах вашей нормы. Продолжайте текущий режим.» and no action list.
4. Chart-note: synthetic data + «Корреляция не доказывает причинность» + how "bad day" is defined (0.5 SD).
5. `chSources([...])` for the ids used; doctor button `chSendBtn(ctx)` if any indicator is `worse` for run ≥ 3.

### B2. Enrich existing answers (same data, no contradiction with the weekly reply)
- `chInd(k)`: after the current-value row add the trend sentence (as B1.1) and, under «По вашим данным», replace the bare
  lag rows by `impact` rows (effect size wording) where available; keep r. Recommendations shown if current value is bad
  **or** `trend(k).status === 'worse'`.
- `chLinks()`: list from `psyLinks()` with effect sizes, grouped «Психология → здоровье» / «Здоровье → психология»; then the old top-r list as «Другие связи» without duplicates.
- `status` intent («Как я сейчас?»): append a one-line weekly summary + chip «Как прошла неделя?».
- `chCond` (handbook entry answers): for each factor row, when `trend(k).status === 'worse'`, append «· хуже нормы с дня N (M дней)».

### B3. Interview with data (`CH_ASK`, `chDataFlags`, `chEval`, outcome)
- Map entry → indicators: `bhv: [stress, mood]`, `sleep: [sleep, stress]`, `co2: [sleep, stress]` (+ cabin CO₂ today as now),
  `immune: [stress, sleep]`, `cardio: [hr, stress]`, `team: [stress, mood]`, `food: [energy]`. Others: none.
- Outcome gets a block **«Что вижу в ваших данных за 7 дней»** (rows from `trend`) — generalising the existing `sleep3`/`cog1` data rows,
  which stay as they are (tests rely on them).
- **Consistency check (the "logic" the owner asked for):** compare the person's duration answer with the data run of the
  first mapped indicator: if the person says «сегодня» but `run ≥ 3` → row «Вы ответили „сегодня“, а по данным стресс хуже нормы уже 4 дня (с дня 43)»;
  if the person says «больше недели» and the indicator is in norm → row «По данным показатель в пределах вашей нормы — опишите врачу, что именно беспокоит».
  These rows are informational; they never lower a level.
- **Level rule addition (document in this file, section C):** a mapped indicator `worse` with `run ≥ 3` sets level to at least `tell`
  (same spirit as `sleep3`). Never raises to `urgent`.
- Outcome adds «Как это связано у вас» (≤ 2 `psyLinks` rows relevant to the mapped indicators) and the lever recommendation of B1.3 before the handbook actions.
- The doctor summary text (`chSummary`) includes the data rows and consistency rows, in the sender's language.
- Replay must stay deterministic (state is rebuilt from stored entries; nothing new is stored).

### B4. Dashboard assistant card: no change in v3 (avoid breaking tests) except nothing.

## C. Rules table (to be kept in sync with code)
| Rule | Value |
|---|---|
| baseline | all days before the last 7, ≥ 10 days |
| bad day | worse than baseline by > 0.5 SD |
| week worse / better | weekly mean beyond ±1 SD of baseline in the bad / good direction |
| noticeable link | \|r\| ≥ 0.3 and \|diff\| ≥ 0.3 SD(b), both groups ≥ 5 days |
| interview: data → level | mapped indicator worse and run ≥ 3 days ⇒ at least «Сообщите врачу» |
Thresholds are demonstration values, not clinical criteria (state this in the UI note).

### C.1 Clarifications made while implementing (the rules above are unchanged)
- `trend`: `status` is `'nodata'` also when the baseline is missing or has SD 0. «Inside the norm, getting worse» (`dir`) is worded «но хуже, чем неделей раньше» (the first draft «растёт вторую неделю» would claim a two-week run that is not checked).
- `impact` for symptoms: `mBad` / `mOk` are the share of flight days with the symptom; `diff` and SD(b) for the «noticeable» rule are computed on that yes/no value; `r` stays the existing Pearson r of the 0–3 scores. For lag 1 and for the same day, `r` comes from `engine().getLag / get`.
- `psyLinks()` returns the co2 → headache control row too, with `dirType: 'control'`; the weekly reply and the interview skip it, `chLinks` shows it in its own group.
- Alignment of `S.sleep`: a night is counted on the day it ends (sample time = wake-up), so «sleep → stress / mood / energy / cognitive score, lag 0» is «the night before that day».
- Lever rule: the most deviating worse (or rising-bad) indicator is taken first, then the strongest noticeable link into it; **one** lever line (`CH_LEVER_MAX`) with the two first rows of `RECS[a]`; the recommendations of the worse indicators follow, merged one row of each in turn (most deviating first), de-duplicated, max 5 rows. Without the round-robin the lever rows plus the first indicator's rows used up the limit of 5 and hid the most deviating indicator.
- Interview consistency rows: «today» is shown when the duration answer is «сегодня» and the first mapped indicator has `run ≥ 3`; «больше недели» when the answer is the last duration button and that indicator's status is `norm`. The level rule looks at all mapped indicators (`worse` and `run ≥ 3`).
- The doctor button of the weekly reply is the existing `chSendBtn`: it sends the question text of the chat entry, not the weekly summary. (Sending the summary would need a new action; not part of v3.)
- `/tmp/c2.py` expectation «sleep level = tell iff a data flag» was extended by the new data → level rule (a mapped indicator worse for 3+ days also gives «tell»); Daniel's stress episode triggers it.

### C.2 Revision after review (supersedes the lever and wording notes of C.1 where they differ)
- **Two thresholds, two words.** The week is judged by 1 SD («вашей нормы»); a day counts as a bad day at 0.5 SD, and the run is worded **«хуже обычного с дня N (M дней подряд)»** / "worse than usual since day N", never «хуже нормы». Chart-note: «Хуже обычного» — a day worse than your norm by more than 0.5 SD. Handbook factor row, when the latest value is within the norm but the week is worse: «последний чек-ин в пределах вашей нормы · среднее за 7 дней выше нормы, хуже обычного с дня N (M дней)». Consistency row: «…по данным стресс хуже обычного уже 6 дней (с дня 42)».
- **Lever rule.** hot(k) = status `worse` or `dir` `rising-bad`. A lever exists only for a noticeable worsening link a→b where BOTH a and b are hot (b among the mapped indicators in the interview); pick the most deviating a (BAD·z7), tie → larger |r|. Text «Начните со стресса: у вас он связан с пульсом» + first two `RECS[a]`. No such link but a hot indicator: no «Начните с…», instead «Главное сейчас — стресс: он хуже обычного 6 дней подряд» for the most deviating hot indicator, followed by its `RECS`. Nothing hot: no block. «Как это связано у вас» orders links: a and b hot, then a hot, then the rest.
- **Doctor button of the weekly reply** sends a plain-text weekly summary (header, the worse rows with since-day, synthetic-data note; no level) with key `week:<day>` so the «sent» state survives replay. Label «Отправить недельную сводку врачу».

## D. Demo data
If no crew member shows a `worse` stress week with `run ≥ 3`, add ONE labelled demo episode in `data/history_data.py`
for Daniel only (stress latent +1.6 over the last 6 days, decaying in — so sleep/HR follow through the generator's own
links). Keep every other person's data byte-identical (use a separate RNG draw order: do not consume extra random numbers).
Document it in `docs/SCIENTIFIC_METHODOLOGY.md`. If a natural episode already exists, change nothing.

## E. i18n
New sentences with numbers: build with `LR(ru, en)` (defined in radiation.js; move it to i18n.js so chat.js can rely on it).
Indicator names inside sentences: `elab(k)` is English-source and localised by `tr`/`localize` — verify both languages render
correctly; add case forms where Russian grammar needs them (e.g. «высоким стрессом», «коротким сном») via a small table.
The `/tmp/e1.py` scan and `/tmp/c1.py` language checks must stay clean.

## F. Acceptance tests (agent writes `/tmp/t1.py`, Playwright, like `/tmp/v2.py`)
1. For each of the 4 crew accounts, RU and EN: «Как прошла неделя?» renders 6 indicator rows; no page errors; no Cyrillic in EN (except names), no English sentences in RU.
2. Numbers in the weekly reply equal an independent recomputation inside the test (evaluate the daily series in the page or recompute from the embedded JSON): `m7`, baseline mean, run length, since-day — for stress and sleep at least.
3. Every `psyLinks` row shown has nBad ≥ 5, nOk ≥ 5, |r| ≥ 0.3; `diff` sign matches the wording (меньше/больше, чаще/реже).
4. Every recommendation row has a ref chip; no drug words.
5. Interview `bhv` for the member with the stress episode: answering «сегодня» yields the consistency row and level ≥ tell; replay after reload gives identical HTML.
6. Old suites stay green: `/tmp/c1.py` 67/67, `/tmp/c2.py` 298/298, `/tmp/v1.py` 8/8, `/tmp/v2.py` 15/15 (c2 and e1 are slow: run in background and poll).

**Result (implementation).** Before the episode nobody had a `worse` stress week (all four z7 between −0.32 and +0.11). The episode was added for Daniel as specified, except that the amplitude is **+2.4**, not +1.6: with +1.6 the weekly status was `worse` but the single check-in of the last (partial) day rounded to 4, below the bad-day line, so `run` was 0 and the «today» consistency row and the data → level rule could not fire. The data of the other three are byte-identical (compared script block by script block). Sleep does not follow the episode, because the generator does not link sleep to stress; heart rate, mood, energy and cognitive scores do.
