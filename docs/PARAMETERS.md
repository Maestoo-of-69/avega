# AVEGA — parameter catalogue (psychological, behavioural, physiological)

Status: **in** = in the prototype (synthetic data) · **planned** = justified by a source, not implemented · IDs refer to `docs/REFERENCES.md`.
Nothing here is a diagnostic criterion.

## A. Psychological self-report
| Parameter | How | Status | Source |
|---|---|---|---|
| Mood | 1–10, 2×/day | in | N2, N3 |
| Stress | 1–10, 2×/day | in | N5, N6 |
| Energy / fatigue | 1–10, 2×/day | in | N5 |
| Positive / negative affect | short scale | planned | N2, N6 |
| Depressive symptoms | validated scale (e.g. CES-D named in N5) | planned | N3, N5 |
| Anxiety | validated scale (to choose) | planned | R3 |
| General well-being | questionnaire (GHQ named in N5) | planned | N5 |
| Perceived sleep quality | monthly / daily log | planned | N1, N2, N4 |
| Sleepiness / alertness | brief survey with cognitive test | planned | P3 |
| Workload | self-rating | planned | P2 |
| Loneliness / homesickness, monotony | self-rating | planned | R3 |
| Pain / physical discomfort (0–10, location) | self-rating | planned | — (team idea; no agency source yet) |
| Personality (Big Five, pre-flight only) | 120-item survey | planned | N4 |

## B. Team and social
| Parameter | Status | Source |
|---|---|---|
| Team cohesion and performance | planned | N2, K2 |
| Conflict / tension with crew or ground | planned | R1 (teamwork risk) |
| Crew living / habitability rating | planned | N2 |
| Contact with family (frequency, satisfaction) | planned | R3, J2 |
| Physical proximity (time spent together) | planned | N3 |

## C. Cognitive
| Parameter | Status | Source |
|---|---|---|
| Composite cognitive score | in (demo) | P3 |
| Vigilant attention (PVT-B reaction time, lapses) | planned | P3 |
| Working memory, spatial orientation, emotion recognition, risk decision-making | planned | P3, N1 |

## D. Behavioural / objective
| Parameter | Status | Source |
|---|---|---|
| Sleep duration and timing | in (simulated) | P1, N2 |
| Sleep regularity / circadian shift | planned | P2 |
| Activity level (actigraphy), sedentary time | planned | P2, N1 |
| Light exposure | planned | N1, P2 |
| Exercise sessions done / missed | planned | R7 |
| Journal use, check-in completion | planned | R3 |

## E. Physiological
| Parameter | Status | Source |
|---|---|---|
| Heart rate (per minute) | in (simulated) | K1 |
| HRV | planned (needs beat intervals) | P5 |
| Breathing rate, SpO₂, skin temperature, blood-pressure estimate | planned | K1 (Bio-Monitor) |
| Salivary cortisol rhythm | planned (lab sample) | J1 |
| Radiation dose | planned (dosimeter) | R2, K1 (Radi-N2) |
| Bone density | pre/post-flight only | R4 |

## F. Space-specific symptoms and environment
| Parameter | How | Status | Source |
|---|---|---|---|
| Headache | 0–3 daily | in (synthetic log + user tick) | S4 |
| Back pain | 0–3 daily | in (synthetic, early flight) | S1 |
| Nausea / motion sickness | 0–3 daily | in (synthetic, first days) | R8, S2, S3 |
| Skin: rash, cold sore | 0–3 daily | in (synthetic, rare) | R10, S5 |
| Vision change, dizziness, poor sleep, low mood | user tick in handbook | in (user log only) | R9, R5, P1, R3 |
| Cabin CO₂ (mm Hg, daily mean) | environment sensor | in (simulated) | S4 |
| Retinal imaging result | scheduled exam | planned | R9 |
| Salivary cortisol, viral shedding | lab sample | planned | S5, S6, J1 |

### Handbook entries without a tracked symptom (chat v2)
Seven further handbook entries (`KB` in `prototype/engine.js`, sources R11–R17) cover the remaining NASA HRP risks: decompression sickness (`dcs`), mild hypoxia (`hypoxia`), food and nutrition (`food`),
infections and microorganisms (`microbe`), spacewalk (EVA) injury (`eva`), crew relationships (`team`), landing and dynamic loads (`loads`). They have **no synthetic symptom stream** (`sym: []`), are **not** ticked in the symptom log
and are **not** in the correlation matrix. In the chat they show only a person's current values of the indicators their sources link to them (`team`: mood, stress; `hypoxia`: sleep, cognitive score; the others none).
The interview (`docs/CHAT_SPEC_V2.md`) asks about the entries that have a "tell the doctor if" text; nothing about them is measured.

## What is correlated today
Heart rate, sleep, stress, mood, energy, cognitive score, **headache, skin symptoms, cabin CO₂** (daily values, per person; same-day and one-day lag).
Nausea and back pain are logged but left out of the matrix (events only in the first flight days).
