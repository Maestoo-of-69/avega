"""
DEMO HISTORY — synthetic data only (NOT real astronaut measurements).

Produces one deterministic dataset that the History page renders:

  hr        per-MINUTE heart rate (simulated wearable stream, with sensor gaps)
  checkins  self-report check-ins (mood / stress / energy, 1-10)
  tests     cognitive test results (0-100 composite)
  sleep     nightly sleep sessions
  norms     the person's OWN norms, learned from a calibration window
            (first BASELINE_DAYS days). No population reference ranges are used.

When real data arrives, replace `build_history()`; the JSON contract that the
front-end reads (see `history.js`) stays the same.
"""
from __future__ import annotations

import functools
import json
import math
import random
import statistics
from datetime import datetime, time, timezone

from . import demo_data as D
from . import crew as CR

UTC = timezone.utc
SEED = 20260929

# Metric registry — shared with the front-end (labels, units, chart limits).
METRICS = [
    dict(key="hr", label="Heart rate", unit="bpm", kind="continuous", decimals=0,
         color="#ef5b6f", bounds=[30, 200], min_span=20,
         source="Wearable sensor · simulated"),
    dict(key="mood", label="Mood", unit="/ 10", kind="event", decimals=1,
         color="#2b8ff0", bounds=[0, 10], min_span=2,
         source="Check-in self-report · demo"),
    dict(key="stress", label="Stress", unit="/ 10", kind="event", decimals=1,
         color="#27c3dd", bounds=[0, 10], min_span=2,
         source="Check-in self-report · demo"),
    dict(key="energy", label="Energy", unit="/ 10", kind="event", decimals=1,
         color="#4cc26a", bounds=[0, 10], min_span=2,
         source="Check-in self-report · demo"),
    dict(key="sleep", label="Sleep", unit="h", kind="event", decimals=1,
         color="#6a77f0", bounds=[0, 14], min_span=3,
         source="Sleep tracking · simulated"),
    dict(key="cog", label="Cognitive", unit="pts", kind="event", decimals=1,
         color="#f2b81d", bounds=[0, 100], min_span=15,
         source="Cognitive test · demo"),
]


# LABELLED DEMO EPISODE (docs/SCIENTIFIC_METHODOLOGY.md, "Demo episode"): without it nobody in the crew has a week that is worse than the
# personal norm, and the weekly trend / interview-consistency features of the assistant would have nothing to show. It is added to ONE
# person's latent stress only, AFTER all random numbers of the stream are drawn, so no other number of any other person changes.
DEMO_EPISODES = {"daniel": dict(days=6, amplitude=2.4, onset=[0.5, 1, 1, 1, 1, 1],
                                label="Demo episode: latent stress +2.4 over the last 6 days, onset on the first day half-size (invented, for the demo)")}


def _clip(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _norm(xs: list[float]) -> dict | None:
    """Mean / sample SD of a person's own values (None if too few)."""
    if len(xs) < 3:
        return None
    return {"m": round(statistics.fmean(xs), 3),
            "sd": round(statistics.stdev(xs), 3), "n": len(xs)}


@functools.lru_cache(maxsize=16)
def build_history(preflight_days: int = 0, person: str = "alex") -> dict:
    """preflight_days > 0 prepends that many DEMO (simulated) pre-launch days on Earth and learns the
    personal norms from them; 0 keeps the original behaviour (norms from the first BASELINE_DAYS flight days)."""
    pr = CR.BY_ID[person]
    rng = random.Random(pr["seed"])
    P = int(preflight_days)
    flight_min = int(datetime.combine(D.MISSION_START, time(0), tzinfo=UTC).timestamp() // 60)
    start_min = flight_min - P * 1440            # first minute of the dataset (pre-flight start if P > 0)
    now_min = int(D.DEMO_NOW.timestamp() // 60)
    n_days = (D.DEMO_NOW.date() - D.MISSION_START).days + 1 + P     # total days in the dataset
    base_days = P if P else D.BASELINE_DAYS

    # ---- latent daily state (stress load, sleep) ---------------------------
    stress, sleep_min = [], []
    s = pr["stress0"]
    for d in range(n_days + 1):
        s = pr["stress0"] + 0.6 * (s - pr["stress0"]) + rng.gauss(0, 0.4)
        bump = 1.9 * math.exp(-(((d - P - pr["bump"]) / 2.6) ** 2))        # a rough patch ~days 19-23
        stress.append(_clip(s + bump, 1.2, 8.5))
        sleep_min.append(round(60 * _clip(rng.gauss(pr["sleep"], 0.4) - 0.9 * bump, 5.6, 8.4)))
    ep = DEMO_EPISODES.get(person)
    if ep:                                              # no random numbers are drawn here; HR, mood, energy, tests follow via the generator's own links
        for j, w in enumerate(ep["onset"]):
            i = n_days - ep["days"] + j
            stress[i] = _clip(stress[i] + ep["amplitude"] * w, 1.2, 8.5)
    sleep_min[n_days - 1] = pr["last_sleep"]            # last night = 7 h 24 min, same as Dashboard
    wake = [start_min + d * 1440 + 360 + int(rng.gauss(0, 15)) for d in range(n_days + 1)]
    bed = [wake[d] - sleep_min[d] for d in range(n_days + 1)]   # session d ENDS on day d

    # ---- heart rate, one value per minute ----------------------------------
    hr: list[float | None] = []
    for d in range(n_days):
        t0 = start_min + d * 1440
        rest = (pr["rest"] + rng.gauss(0, 0.7) + 0.8 * (stress[d] - pr["stress0"])
                + max(0.0, pr["sl0"] - sleep_min[d] / 60))
        tasks = [(rng.randint(480, 1200), rng.randint(5, 25), rng.uniform(6, 18))
                 for _ in range(rng.randint(2, 5))]
        do_ex = rng.random() > (1 - pr["ex_p"])
        ex0 = 930 + int(rng.gauss(0, 25))
        ex_len = int(_clip(rng.gauss(50, 8), 30, 70))
        ex_peak = rest + 62 + rng.gauss(0, 6)
        gaps = []
        if rng.random() < 0.7:
            g = rng.randint(420, 1260)
            gaps.append((g, g + rng.randint(15, 45)))
        if rng.random() < 0.06:
            g = rng.randint(360, 900)
            gaps.append((g, g + rng.randint(180, 300)))
        noise = 0.0
        for mod in range(1440):
            t = t0 + mod
            if t > now_min:
                break
            noise = 0.93 * noise + rng.gauss(0, 0.55)
            if bed[d] <= t < wake[d]:
                s0, s1 = bed[d], wake[d]
            elif bed[d + 1] <= t < wake[d + 1]:
                s0, s1 = bed[d + 1], wake[d + 1]
            else:
                s0 = s1 = None
            if s0 is not None:
                v = rest - 5 - 3 * math.sin(math.pi * (t - s0) / (s1 - s0)) + 0.8 * noise
            else:
                v = rest + 4.5 + 2.2 * math.sin(2 * math.pi * (mod / 1440 - 0.35)) + noise
                for ts, ln, amp in tasks:
                    if ts <= mod < ts + ln:
                        v += amp * math.sin(math.pi * (mod - ts) / ln)
                if do_ex:
                    x = mod - ex0
                    if 0 <= x < ex_len + 12:
                        prof = x / 8 if x < 8 else 1.0 if x < ex_len else 1 - (x - ex_len) / 12
                        prof = _clip(prof, 0, 1)
                        v += (ex_peak - v) * prof + 2 * noise * prof
                if 0 <= t - wake[d] < 25:                      # gradual wake-up
                    v += (rest - 5 - v) * (1 - (t - wake[d]) / 25)
            if any(a <= mod < b for a, b in gaps):
                hr.append(None)                                  # sensor not worn / offline
            else:
                hr.append(round(_clip(v, 38, 185), 1))

    # ---- check-ins, cognitive tests, sleep sessions ------------------------
    def c10(x: float) -> int:
        return int(_clip(round(x), 1, 10))

    checkins, tests, sleeps = [], [], []
    for d in range(n_days):
        t0 = start_min + d * 1440
        sl = sleep_min[d] / 60 if d > 0 else pr["sl0"]
        st = stress[d]
        s0, l0 = pr["stress0"], pr["sl0"]
        mood0 = pr["mood"] - 0.45 * (st - s0) + 0.4 * (sl - l0)
        en0 = pr["energy"] + 1.0 * (sl - l0) - 0.25 * (st - s0)
        if rng.random() > 0.04:                                  # morning
            t = wake[d] + int(_clip(rng.gauss(70, 15), 40, 120))
            rec = {"t": t, "k": "morning", "mood": c10(mood0 + rng.gauss(0, 0.7)),
                   "stress": c10(st + rng.gauss(0, 0.7)), "energy": c10(en0 + rng.gauss(0, 0.7))}
            if t <= now_min:
                checkins.append(rec)
        if rng.random() > 0.04:                                  # evening
            t = t0 + 1230 + int(rng.gauss(0, 25))
            rec = {"t": t, "k": "evening", "mood": c10(mood0 - 0.2 + rng.gauss(0, 0.8)),
                   "stress": c10(st + 0.7 + rng.gauss(0, 0.8)), "energy": c10(en0 - 1.2 + rng.gauss(0, 0.8))}
            if t <= now_min:
                checkins.append(rec)
        if rng.random() < 0.07:                                  # optional extra
            t = t0 + 840 + int(rng.gauss(0, 60))
            rec = {"t": t, "k": "extra", "mood": c10(mood0 - 0.1 + rng.gauss(0, 0.9)),
                   "stress": c10(st + 0.3 + rng.gauss(0, 0.9)), "energy": c10(en0 - 0.5 + rng.gauss(0, 0.9))}
            if t <= now_min:
                checkins.append(rec)
        if rng.random() > 0.03:                                  # cognitive test
            t = t0 + 630 + int(rng.gauss(0, 40))
            score = int(_clip(round(pr["cog"] + 4.5 * (sl - l0) - 2.0 * (st - s0) + rng.gauss(0, 2.8)), 40, 100))
            if t <= now_min:
                tests.append({"t": t, "v": score})
        if d > 0 and wake[d] <= now_min:                        # night ending on day d
            sleeps.append({"s": bed[d], "e": wake[d], "h": round(sleep_min[d] / 60, 3)})
    checkins.sort(key=lambda r: r["t"])
    tests.sort(key=lambda r: r["t"])

    # ---- the person's OWN norms (calibration window only) ------------------
    cal_end = start_min + base_days * 1440
    hod = []
    for h in range(24):
        means = []
        for d in range(base_days):
            seg = [v for v in hr[d * 1440 + h * 60: d * 1440 + h * 60 + 60] if v is not None]
            if len(seg) >= 30:
                means.append(statistics.fmean(seg))
        hod.append(_norm(means))
    daily_hr = []
    for d in range(base_days):
        seg = [v for v in hr[d * 1440:(d + 1) * 1440] if v is not None]
        if len(seg) >= 0.8 * 1440:
            daily_hr.append(statistics.fmean(seg))
    norms: dict = {"hr": {"hour_of_day": hod, "daily": _norm(daily_hr)}}

    def event_norm(key: str, recs: list[dict], tkey: str, vkey: str) -> dict:
        cal = [r for r in recs if r[tkey] < cal_end]
        per_day: dict[int, list[float]] = {}
        for r in cal:
            per_day.setdefault((r[tkey] - start_min) // 1440, []).append(r[vkey])
        return {"event": _norm([r[vkey] for r in cal]),
                "daily": _norm([statistics.fmean(v) for v in per_day.values()])}

    for k in ("mood", "stress", "energy"):
        norms[k] = event_norm(k, checkins, "t", k)
    norms["cog"] = event_norm("cog", tests, "t", "v")
    norms["sleep"] = event_norm("sleep", sleeps, "e", "h")

    # ---- SYNTHETIC cabin CO2 and symptom log (separate RNGs: older streams stay bit-identical) -------------
    # Probabilities are invented for the demo; only the DIRECTION of links follows docs/REFERENCES.md (S1-S4).
    crng = random.Random(4242)                       # one cabin for the whole crew
    co2, c = [], 3.0
    for d in range(n_days):
        c = 3.0 + 0.7 * (c - 3.0) + crng.gauss(0, 0.35)
        co2.append(round(_clip(c, 1.5, 5.5), 2) if d >= P else None)      # no cabin before launch
    srng = random.Random(pr["seed"] ^ 0x5A17)
    sev = lambda: 1 if srng.random() < 0.75 else 2 if srng.random() < 0.85 else 3
    symptoms = []
    for d in range(n_days):
        fd = d - P + 1                                # flight day (<= 0 before launch)
        inflight = fd >= 1
        ph = 0.04 + (0.10 * max(0.0, (co2[d] or 3.0) - 3.0) + 0.05 * max(0.0, stress[d] - pr["stress0"])
                     + 0.06 * max(0.0, pr["sl0"] - sleep_min[d] / 60) if inflight else 0.0)
        pb = 0.5 * math.exp(-(fd - 1) / 2.5) if 1 <= fd <= 8 else 0.02       # space adaptation back pain: early flight
        pn = 0.6 * math.exp(-(fd - 1) / 1.5) if 1 <= fd <= 5 else 0.01       # space motion sickness: first days
        recent = statistics.fmean(stress[max(0, d - 4): d + 1])
        ps = 0.01 + (0.04 * max(0.0, recent - pr["stress0"]) if inflight else 0.0)
        symptoms.append([sev() if srng.random() < q else 0 for q in (ph, pb, pn, ps)])

    meta = {"start_min": start_min, "flight_start_min": flight_min, "now_min": now_min,
            "mission_day": n_days - P, "baseline_days": base_days,
            "baseline_source": "preflight" if P else "flight",
            "source": D.DATA_SOURCE, "tz": "UTC", "person": person}
    if ep:
        meta["demo_episode"] = ep["label"]
    return {
        "meta": meta,
        "metrics": METRICS,
        "hr": {"t0": start_min, "values": hr},
        "checkins": checkins,
        "tests": tests,
        "sleep": sleeps,
        "norms": norms,
        "symptoms": {"keys": ["headache", "back", "nausea", "skin"], "scale": "0-3", "values": symptoms},
        "env": {"co2_mmHg": co2},
    }


def history_json(preflight_days: int = 0, person: str = "alex") -> str:
    """Compact JSON safe to inline inside a <script type="application/json">."""
    return json.dumps(build_history(preflight_days, person), separators=(",", ":")).replace("</", "<\\/")
