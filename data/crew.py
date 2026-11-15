"""
AVEGA demo crew — FICTIONAL people with SYNTHETIC data (not real astronauts, not real measurements).

Four crew members (2 women, 2 men) + one Earth-based flight surgeon / psychologist. Every crew member has
their own seed and their own physiological / psychological profile, so each one gets a different
database and different PERSONAL norms. Ages, heights and every number below are invented for the demo.
"""
from __future__ import annotations

DELAY_MIN = 13   # demo one-way Mars<->Earth delay; the real one varies ~3-22 min (see docs/REFERENCES.md)

# rest = resting HR (bpm) · sleep = typical nightly sleep (h) · stress0 = typical stress (1-10) · mood/energy = typical level
# cog = typical cognitive score · bump = flight day of a simulated "rough patch" · last_sleep = last night (min)
CREW = [
    dict(id="alex", name="Alex Carter", first="Alex", sex="M", age=41, role="Командир", seed=20260929,
         rest=61.5, sleep=7.25, sl0=7.2, stress0=3.2, mood=7.2, energy=6.6, cog=83, bump=20, last_sleep=444, ex_p=0.9),
    dict(id="mira", name="Mira Okafor", first="Mira", sex="F", age=36, role="Бортинженер", seed=71033417,
         rest=57.0, sleep=7.65, sl0=7.6, stress0=3.0, mood=7.7, energy=7.1, cog=86, bump=12, last_sleep=462, ex_p=0.95),
    dict(id="daniel", name="Daniel Reyes", first="Daniel", sex="M", age=46, role="Специалист миссии", seed=30518842,
         rest=66.0, sleep=6.8, sl0=6.8, stress0=3.9, mood=6.7, energy=6.0, cog=79, bump=33, last_sleep=396, ex_p=0.8),
    dict(id="yuki", name="Yuki Tanaka", first="Yuki", sex="F", age=33, role="Научный специалист", seed=88217465,
         rest=60.0, sleep=7.0, sl0=7.0, stress0=4.2, mood=6.9, energy=6.5, cog=88, bump=26, last_sleep=420, ex_p=0.9),
]
DOCTOR = dict(id="murphy", name="Dr. Eileen Murphy", first="Eileen", role="Лётный врач и психолог", where="Земля · Центр управления (демо)")
BY_ID = {p["id"]: p for p in CREW}
