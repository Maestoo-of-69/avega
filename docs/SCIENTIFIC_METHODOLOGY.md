# Scientific methodology

## Principle
Compare each person with **themselves**. No population reference ranges are used for judgement.

## Personal norms
- Window: 30 simulated pre-flight days (Earth) per person; real pre-flight data will replace them later.
- Heart rate: hour-of-day norm (mean ± SD of that hour's means over the window) and a daily norm.
- Check-ins (mood, stress, energy), cognitive test, sleep: event norm and daily norm (mean ± SD).
- Deviation = (value − norm mean) / norm SD ("z"). **Outside the usual range = |z| > 1.** This is a display threshold chosen for the demo,
  *not* a clinical threshold.

## Direction (better / worse)
- Mood, energy, cognitive score: higher is better. Stress: lower is better → status "better / worse than your norm".
- Heart rate and sleep: reported only as above / below the person's norm, with no judgement (no clinical context).

## Dynamics
Last 7 days vs the previous 7 days, per indicator: "improving / worsening / stable" (change < 0.25 SD counts as stable);
for heart rate and sleep: "moving toward / away from your norm".

## Earth-side doctor view
The doctor sees each crew member's latest values *as of now − communication delay* (demo: 13 min). Real delay: 3–22 min (REFERENCES C1, C2).

## Correlations (per person)
Pearson r between daily means of heart rate, sleep, stress, mood, energy and cognitive score, over pre-flight + flight days; same day and one-day lag
(X today → Y tomorrow). Labels: weak |r| < 0.3, noticeable 0.3–0.5, strong ≥ 0.5 (demo labels). No multiple-comparison correction. Correlation is not causation.
Because the data are synthetic and the generator links stress, sleep, mood, energy, heart rate and cognition, the matrix validates the method, not a finding.

## On-board assistant (`prototype/engine.js`)
Rule-based and transparent — **not** a language model. Works without Earth (communication delay, REFERENCES C1–C2).
1. Finding = latest value more than 1 SD from the personal norm in the unfavourable direction (≥ 2 SD = strong).
2. Personal links = this person's lag-1 correlations (|r| ≥ 0.3) showing what usually worsens the next day.
3. Actions = fixed list of non-drug measures, each tagged with its source ID or "no source".
4. Escalation = 3+ findings or any strong one → advise sending a summary to the flight surgeon.
It never diagnoses, never suggests medication (P1) and never replaces the doctor.

## Offline handbook and symptom log
`KB` in `prototype/engine.js`: 10 space-specific conditions (motion sickness, adaptation back pain, CO₂ headache, SANS, immune/virus reactivation, sleep loss,
psychological state, cardiovascular/landing, bone & muscle, radiation). Each entry: when it occurs, signs, non-drug actions with source IDs, and "tell the doctor if".
Medication is never suggested — only "per onboard protocol and the doctor". The crew member can tick today's symptoms; ticks and the synthetic symptom log feed the assistant.
Synthetic symptom probabilities are invented; only the direction of links follows sources (CO₂/short sleep/stress → headache, S4; stress → skin symptoms, S5; early-flight
back pain and nausea, S1–S3).

## Chat assistant (`prototype/chat.js`)
A chat front end on top of the on-board assistant. **Not a language model**: retrieval and fixed templates only, no network, no generated text (see `docs/CHAT_SPEC.md`).
How a question is answered, in this order:
1. Normalise the text (lower case, ё→е, punctuation removed). Russian and English keywords are always both active, so the language switch does not change matching.
2. **Red flags** (self-harm, chest pain, fainting, vision change, difficulty breathing): a fixed text with a source label or "no source", a button to send the question to the doctor as urgent, and the communication delay. Always wins over everything else.
3. **Drug question** flag: any such question gets the fixed line "medicines only per onboard protocol and the doctor"; the chat never names a drug or a dose.
4. **Topic scoring**: each handbook entry (`KB`) and each personal indicator has a table of keyword stems; a topic scores the number of its distinct stems found in the text. The best two topics are answered; no stem, no topic (there is no fuzzy or partial matching).
5. Meta questions (status, links, doctor, about, greeting), then a follow-up ("what next", "why") that reuses the previous topic, then the **fallback**: "there is no answer in my database", plus the list of what the chat does know.
What an answer contains: the handbook entry unchanged (when, signs, actions with source IDs, "tell the doctor if", source titles) and, for conditions that cited sources link to a measurable factor, the person's current value against their own norm (|z| ≤ 1 = within the norm) and, for CO₂ headache and skin symptoms, the person's own correlation r with that factor when |r| ≥ 0.3. The factor lists (`CH_FACT`) follow the cited sources (S1, S4, S5, R10, P1, P2, R3) and are not extended. Indicator answers (heart rate, stress, mood, energy, cognition) show value, personal norm, deviation and the lag-1 links already used by the assistant; actions from `RECS` appear only when the value is unfavourable beyond 1 SD (heart rate is never judged better or worse, as above).
What it cannot do: understand paraphrases or typos outside the keyword tables, answer anything not in `KB`/`RECS`/the spec, make a diagnosis, or advise on medication. A keyword match is not understanding: a question that merely contains a keyword gets that topic's handbook entry. Data in the prototype are synthetic; the personal block shows how the method works, not a medical conclusion.
Storage: only the user's own texts (last 30) are kept in the browser (`avega-chat-<person>`); answers are rebuilt on every render, so they follow the current language and data. A question sent to the doctor is appended to `avega-msgs` and shown to the flight surgeon in Mission Control → Assignments tab.

### Chat v2: interview, handbook of 17 entries, full screen (`docs/CHAT_SPEC_V2.md`)
**Handbook.** `KB` now has 17 entries, one for each HRP risk that describes a condition a crew member can report (REFERENCES R1, R11–R17); the HRP risk "inadequate systems operations support" is a human–system design risk and has no entry, so the chat answers it with the fallback. The seven new entries have no symptom stream and are not correlated with anything.
**Interview.** When a question matches a condition entry (or a vague complaint such as "I feel bad" is answered through a first question with 14 buttons), the assistant asks one plain question at a time: how much it interferes (the same 1–3 scale as the symptom log), how long ago it started, and then a few yes / no / don't know questions. Every one of those questions restates the entry's own "tell the doctor if" text (`doc` field, which cites R2–R17, S1, S4, S5, R10, P1, P2, N6); none was added by us. Which questions an entry asks is fixed in the table `CH_ASK`.
**How the level is derived.** Three levels, first rule that applies: *Urgent* if any urgent flag is answered "yes" or the severity is 3; *Tell the doctor* if any "tell the doctor" flag is "yes", the duration reaches the entry's threshold (where the entry's text names one), a data flag fires, or "don't know" was given to an urgent flag; otherwise *Watch*. Which flags are urgent is fixed by the spec (mark U in `CH_ASK`): chest pain, heart skipping and fainting, thoughts of self-harm, confusion and worse vision in hypoxia, symptoms around a spacewalk — their entry texts say "tell the doctor at once" — and, by the spec's choice, a vision problem with a headache (that entry's text names vision problems but does not say "at once"). For sleep loss two flags are filled from the person's own data and shown as such: each of the last three sleep sessions more than 1 SD below the personal norm; the latest cognitive score more than 1 SD below the personal norm (demo thresholds, the same 1 SD rule as `assess()`).
**This is not clinical triage and not a diagnosis.** It is a fixed rule over the answers; thresholds are demo rules, not validated criteria; "don't know" never lowers a level. The outcome always says so, shows the handbook entry unchanged (with source IDs) and offers a plain-text summary that the person can send to the flight surgeon (it contains only the question wording and the person's answers).
**State.** The conversation is stored as entries `{text, answer code}` (last 30). The interview state is recomputed by replaying them, so a reload or a language switch gives the same dialogue; typed words that equal a button (yes / no / don't know, mild / moderate / severe) count as that answer, any other text or any red-flag word ends the interview.
**Full screen.** The chat opens full screen by default (`avega-chat-full`); Esc or the collapse button returns to the in-page card and the choice is remembered.

### Chat v3: week, strength of links, lever, interview with data (`docs/CHAT_SPEC_V3.md`)
All of it is transparent statistics over the daily series of `engine()`; still no language model, no diagnosis, no medication advice.
**Weekly trend** (`trend(k)` in `engine.js`). The personal baseline of an indicator is the mean and SD of its daily values over all days before the last 7 (at least 10 values; the pre-flight days count). The week is the mean of the last 7 days (at least 3 days with data). A week is *worse* or *better* when the weekly mean is more than 1 SD of that baseline on the unfavourable or favourable side, otherwise *within the norm*. A *bad day* is a day more than 0.5 SD on the unfavourable side; `run` is the number of consecutive most recent days with data that were bad days, `since` is the first of them. Inside the norm, a weekly mean that is worse than the previous week by more than 0.5 SD is shown as «within the norm, but worse than the week before».
**Strength of a link** (`impact(a, b, lag)`, `psyLinks()`). Days of the first indicator are split into bad days (0.5 SD rule above, with the mean and SD of that indicator over the whole series) and all other days; the answer is the mean of the second indicator (the same day, or the next day for lag 1) in the two groups and their difference, with the number of days in each group and the existing Pearson r. A link is *noticeable* when both groups have at least 5 days, |r| ≥ 0.3 and the difference is at least 0.3 SD of the second indicator; only links in which the second indicator gets *worse* are shown. For symptoms (headache, rash; 0–3 per flight day) the means are the share of flight days with the symptom and the difference and SD are taken on that yes/no value, while r stays the existing Pearson r on the 0–3 scores. The fixed set of pairs is: stress / mood / energy → sleep (next night), heart rate, cognitive score (same day and next day), headache, rash (next day); sleep → stress, mood, energy, cognitive score. A night is counted on the day it ends, so «sleep → mood, same day» means the night before that day. Cabin CO₂ → headache is a control row, shown separately and not used in the weekly reply or the interview. Wording is «related to» and «on the days after», never «causes»: this is correlation in synthetic data.
**Lever rule.** If an indicator that is worse (or getting worse inside the norm) has a noticeable link from an upstream indicator, the answer says «start with the upstream indicator» and shows its two first recommendations from the existing table `RECS`, then the recommendations of the worse indicators (most deviating first, one row of each in turn), at most 5 in all. Every row keeps its source id or «no source»; no recommendation was added.
**Interview.** Each handbook entry that has a personal data counterpart (behaviour: stress, mood; sleep and CO₂: sleep, stress; immune: stress, sleep; heart: pulse, stress; crew: stress, mood; food: energy) shows the weekly rows of those indicators. Two informational rows compare the answer with the data: «today» while the first indicator has been worse for 3+ days, and «more than a week» while it is within the norm; they never lower a level. A mapped indicator that is *worse* with `run` ≥ 3 raises the level to at least *Tell the doctor*, never to *Urgent*. Thresholds are demonstration values, not clinical criteria.

### Demo episode (Daniel)
With the original synthetic data nobody in the crew had a weekly stress mean beyond 1 SD of their baseline, so the weekly trend, the consistency rows and the data → level rule had nothing to show. `data/history_data.py` therefore adds one **labelled, invented** episode for Daniel Reyes only (`DEMO_EPISODES`, also written to `meta.demo_episode` of his data): his latent stress is raised by 2.4 points over the last 6 days (half-size on the first day). It is applied after all random numbers of the stream have been drawn, so no other number of any other person changes (the data of Alex, Mira and Yuki are byte-identical to before). Heart rate, mood, energy and cognitive scores follow through the generator's own links to the stress level; sleep does not, because in the generator sleep is not a function of stress. The episode demonstrates the method; it is not a finding about people.

### Page «Psychology & Cognition»
The former pages Psychology and Cognitive Tests are one page with an overview tab. The overview shows, per indicator (mood, stress, energy, cognitive score), the latest value, the person's own norm (mean ± SD of the same event norm that `assess()` uses), the deviation in SD and the History-page wording (better than / within / worse than the norm); and the pairwise same-day correlations of these four indicators and sleep from `engine()`, with the existing strength labels and caveat. It computes nothing new. Old `#cognitive…` links still open the right tab.

## Limitations
- All data are synthetic; patterns (e.g. a "rough patch" around a chosen day) are programmed, not discovered.
- No composite readiness score yet. Space-specific conditions (SANS, motion sickness, immune, radiation) have no data, so no correlations with them.
- Radiation, bone, blood pressure are not modelled (REFERENCES R2, R4, R5 name no instruments or limits).
