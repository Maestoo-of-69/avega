"""Per-person summary for the Earth-side doctor view: latest values AS OF (now - delay), each compared with the
person's OWN norm. Synthetic demo numbers only."""
from __future__ import annotations
import json, pathlib, statistics
from .history_data import build_history, history_json
from . import crew as CR

ROOT = pathlib.Path(__file__).parent


def _z(v, n):
    return None if v is None or not n or not n.get("sd") else round((v - n["m"]) / n["sd"], 2)


def summarize(pid: str, preflight_days: int = 30, delay_min: int = CR.DELAY_MIN) -> dict:
    d = build_history(preflight_days, pid)
    asof = d["meta"]["now_min"] - delay_min
    t0, vals = d["hr"]["t0"], d["hr"]["values"]
    seg = [v for v in vals[max(0, asof - t0 - 59): asof - t0 + 1] if v is not None]
    hr = round(statistics.fmean(seg), 1) if len(seg) >= 20 else None
    hour = (asof // 60) % 24
    hr_n = d["norms"]["hr"]["hour_of_day"][hour]
    ci = [r for r in d["checkins"] if r["t"] <= asof][-1:]
    ts = [r for r in d["tests"] if r["t"] <= asof][-1:]
    sl = [r for r in d["sleep"] if r["e"] <= asof][-1:]
    ci, ts, sl = (ci[0] if ci else None), (ts[0] if ts else None), (sl[0] if sl else None)
    row = {"id": pid, "asof_min": asof, "hr": hr, "hr_z": _z(hr, hr_n),
           "mood": ci and ci["mood"], "mood_z": ci and _z(ci["mood"], d["norms"]["mood"]["event"]),
           "stress": ci and ci["stress"], "stress_z": ci and _z(ci["stress"], d["norms"]["stress"]["event"]),
           "sleep_h": sl and sl["h"], "sleep_z": sl and _z(sl["h"], d["norms"]["sleep"]["event"]),
           "cog": ts and ts["v"], "cog_z": ts and _z(ts["v"], d["norms"]["cog"]["event"]),
           "last_hr_t": max((t0 + i for i in range(asof - t0, max(-1, asof - t0 - 600), -1) if vals[i] is not None), default=None)}
    zs = [row[k] for k in ("hr_z", "mood_z", "stress_z", "sleep_z", "cog_z") if row[k] is not None]
    nm = lambda k, sub: (d["norms"][k][sub] or {})
    row["norm"] = {"hr": nm("hr", "daily").get("m"), "mood": nm("mood", "daily").get("m"), "stress": nm("stress", "daily").get("m"),
                   "sleep": nm("sleep", "daily").get("m"), "cog": nm("cog", "daily").get("m")}
    row["out"] = sum(1 for z in zs if abs(z) > 1)
    row["known"] = len(zs)
    return row


def export_synthetic(preflight_days: int = 30) -> None:
    """Write each person's separate database to data/synthetic/ (one JSON per person)."""
    out = ROOT / "synthetic"; out.mkdir(exist_ok=True)
    for p in CR.CREW:
        (out / f"{p['id']}.json").write_text(history_json(preflight_days, p["id"]), encoding="utf-8")
    (out / "crew.json").write_text(json.dumps({"crew": CR.CREW, "doctor": CR.DOCTOR, "delay_min": CR.DELAY_MIN,
                                               "preflight_days": preflight_days, "synthetic": True}, ensure_ascii=False, indent=1), encoding="utf-8")
