# AVEGA — Data sources and labels

Every number in AVEGA carries one of four labels (shown as badges in the UI).

| Label | Meaning |
|---|---|
| **real** | measured from a real person or taken from a real published dataset. *Nothing is in this category yet.* |
| **demo** | hand-prepared or generated placeholder values (check-ins, cognitive tests) |
| **simulated** | generated to imitate a sensor stream (heart rate, sleep) |
| **soon** | block exists as a layout stub; no data and no calculation |

## Current data streams (all synthetic)

| Stream | Label | Origin | Notes |
|---|---|---|---|
| Heart rate, 1 value/min | simulated | `data/history_data.py` | circadian rhythm, sleep dip, tasks, exercise, sensor gaps; per-person resting level |
| Sleep sessions | simulated | same | length depends on a per-person typical value and the day's stress |
| Mood / stress / energy check-ins | demo | same | 1–10 self-report, 2–3 per day |
| Cognitive test score | demo | same | one composite 0–100 per day |
| Symptom log: headache, back pain, nausea, skin (0–3 per day) | demo | same | invented probabilities; link directions from REFERENCES S1–S5 |
| Cabin CO₂, daily mean | simulated | same | one cabin for the crew, 1.5–5.5 mm Hg; flight days only |
| Personal norms | derived | same | mean ± SD of the person's **own** pre-flight (30 days) data; no population ranges |
| Crew roster and bios | demo | `data/crew.py` | fictional people; ages and roles invented |
| Communication delay | demo | `data/crew.py` | 13 min one way; real range 3–22 min (REFERENCES C1, C2) |

## Crew databases
Each of the four crew members has a separate database (own seed, own profile, so different norms): `data/synthetic/<id>.json`.
The Earth-side doctor account has no data of its own; it sees each crew member's data *as of now − delay*.

## Not collected / not available
Radiation dose, bone density, blood pressure, HRV, SpO₂, temperature: no source yet — shown as stubs, never as numbers.
NASA's own pages (REFERENCES R2, R4, R5) do not name specific instruments for these, so we do not claim any.

## Rules
1. New data → add a row here and a file under `data/real/` or `data/synthetic/`.
2. Synthetic data must never be described as measurements.
3. Missing data is shown as "—", not as zero.
