"""
DEMO DATA ONLY.

All values below are synthetic placeholders used to render the dashboard UI.
They are NOT real astronaut measurements. Later these structures will be
produced by the real data / analytics layer (check-ins, sensors, tests).
"""

DATA_SOURCE = "demo"  # "demo" | "simulated" | "live"

CREW_MEMBER = {
    "first_name": "Alex",
    "full_name": "Alex Carter",
    "role": "Astronaut",
    "initials": "AC",
}

from datetime import date, datetime, timezone

# Mission clock (all times UTC). Moving DEMO_NOW forward extends the whole demo
# history (and the "Day N" label) consistently.
MISSION_START = date(2026, 9, 29)                                   # Day 1
DEMO_NOW = datetime(2026, 11, 14, 18, 45, tzinfo=timezone.utc)      # "current moment"
BASELINE_DAYS = 14   # calibration window used to learn the person's OWN norms

MISSION = {
    "name": "Mars Mission",
    "day": (DEMO_NOW.date() - MISSION_START).days + 1,              # -> 47
}

SYSTEM = {
    "online": True,
    "last_sync": "2 h ago",
    "notifications": 1,
}

CHECKIN = {
    "title": "Daily Check-in",
    "subtitle": "Take a short assessment to track your current state.",
    "duration": "2–3 min",
    "topics": ["Mood", "Stress", "Sleep", "Well-being"],
}

# Status cards ("Your Current State"); spark = last 7 days, arbitrary units
CURRENT_STATE = [
    {
        "key": "psychological", "title": "Psychological", "value": "Stable",
        "color": "#9b7bf2", "icon": "brain",
        "spark": [0.45, 0.55, 0.50, 0.42, 0.58, 0.66, 0.60],
    },
    {
        "key": "sleep", "title": "Sleep", "value": "7 h 24 min",
        "color": "#2b8ff0", "icon": "moon",
        "spark": [0.40, 0.52, 0.55, 0.50, 0.53, 0.62, 0.70],
    },
    {
        "key": "physiological", "title": "Physiological", "value": "HR 67 bpm",
        "color": "#3fca7a", "icon": "pulse",
        "spark": [0.35, 0.48, 0.44, 0.56, 0.50, 0.62, 0.58],
    },
    {
        "key": "cognitive", "title": "Cognitive", "value": "Normal",
        "color": "#f2b81d", "icon": "target",
        "spark": [0.38, 0.46, 0.52, 0.47, 0.55, 0.68, 0.60],
    },
]

TREND_DAYS = ["D41", "D42", "D43", "D44", "D45", "D46", "D47"]

# Each tab: list of series + axis description.
# Well-being values are deviations from personal baseline (0 = baseline).
TRENDS = {
    "wellbeing": {
        "label": "Well-being",
        "y_range": (-1.6, 1.6),
        "y_ticks": [(1.6, "Higher"), (0.0, "Baseline"), (-1.6, "Lower")],
        "baseline": 0.0,
        "series": [
            {"name": "Mood", "color": "#2b8ff0",
             "values": [0.95, 1.0, 0.75, 1.0, 0.78, 0.95, 1.15]},
            {"name": "Stress (inverse)", "color": "#3fd0e6",
             "values": [-0.70, -0.70, -0.82, -0.88, -0.82, -0.70, -0.75]},
            {"name": "Energy", "color": "#5fd57a",
             "values": [0.10, 0.15, -0.20, 0.15, -0.18, 0.18, 0.22]},
        ],
    },
    "sleep": {
        "label": "Sleep",
        "y_range": (5.5, 9.0),
        "y_ticks": [(9.0, "9 h"), (7.25, "7 h 15"), (5.5, "5 h 30")],
        "baseline": 7.25,
        "series": [
            {"name": "Sleep duration (h)", "color": "#2b8ff0",
             "values": [6.9, 7.3, 6.6, 7.1, 7.0, 7.5, 7.4]},
        ],
    },
    "heart_rate": {
        "label": "Heart Rate",
        "y_range": (55, 80),
        "y_ticks": [(80, "80 bpm"), (66, "66 bpm"), (55, "55 bpm")],
        "baseline": 66,
        "series": [
            {"name": "Resting HR (bpm)", "color": "#ef5b6f",
             "values": [65, 66, 69, 67, 68, 66, 67]},
        ],
    },
    "cognitive": {
        "label": "Cognitive",
        "y_range": (60, 100),
        "y_ticks": [(100, "100"), (80, "Baseline"), (60, "60")],
        "baseline": 80,
        "series": [
            {"name": "Reaction-time score", "color": "#f2b81d",
             "values": [79, 81, 77, 82, 80, 84, 83]},
            {"name": "Attention score", "color": "#9b7bf2",
             "values": [76, 78, 75, 79, 78, 80, 81]},
        ],
    },
}

ASSISTANT = {
    "message": ("Your data looks stable. Would you like to try a short relaxation "
                "exercise to support recovery after today's workload?"),
    "primary_action": "Start 5-min relaxation",
    "secondary_actions": [("chat", "Ask a question"), ("book", "Other exercises")],
}

RECOMMENDATIONS = [
    {"icon": "bed", "text": "Maintain a consistent sleep schedule"},
    {"icon": "meditate", "text": "Try a short breathing exercise (5 min)"},
    {"icon": "run", "text": "Light physical activity to help recovery"},
]

DATA_TRANSMISSION = {
    "status": "Up to date",
    "text": ("Your data is stored securely and shared with the medical team on "
             "Earth according to mission protocol."),
}
