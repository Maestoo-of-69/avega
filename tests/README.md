# Tests

Playwright (Python) browser tests that drive the built single-file app `index.html`.

## Requirements
- Python 3.10+, `pip install playwright` (the tests use an installed Chrome, no `playwright install` needed)
- Google Chrome; the path is read from the `CHROME` environment variable (default `/usr/bin/google-chrome`)
- A current build: run `python3 prototype/build_shell.py` from the repository root first

## Run
```
tests/run_all.sh                 # all suites, one after another (about 15 minutes)
python3 tests/test_vas.py        # one suite
CHROME=/path/to/chrome python3 tests/test_vas.py
```
Screenshots and temporary files go to `tests/out/` (git-ignored). Each suite prints a `RESULT` line.

## Suites
| File | Covers | Expected |
|---|---|---|
| `test_chat_handbook.py` | Chat intents and handbook answers (RU/EN): red flags, drug-question line, symptom routing, no-match reply, layout | `RESULT queries+checks passed 67/67; page errors 0 []` |
| `test_chat_interview.py` | Data-aware interview for every handbook entry, levels, weekly consistency rows, doctor message, reload and language persistence (slow, 5-7 min) | `RESULT c2 passed 298/298; page errors 0 []` |
| `test_vas.py` | Instrument catalogue and the VAS self-rating (7 scales, saving, results) | `RESULT 8 8` |
| `test_methods_radiation.py` | Psychology page methods and the Radiation page (values, limits, labels) | `RESULT 15 15` |
| `test_assistant_v3.py` | Weekly trend, link strength, lever rule, weekly answer and doctor message, checked against numbers recomputed from the data | `RESULT 166 166` |
| `scan_languages.py` | Visits 25 pages for 5 accounts in RU and EN and lists words from the wrong script (slow, 5-7 min) | No line with ` en ` and a final `errs []` |

`scan_languages.py` also prints lines for RU pages that contain Latin words (product names such as "Crew Connection", device names, abbreviations); these are informational. Lines with `en` as the third word (Cyrillic text on an English page) must not appear.
