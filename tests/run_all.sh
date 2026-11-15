#!/usr/bin/env bash
# Run all suites from anywhere. Needs: pip install playwright, Chrome (CHROME=/path/to/chrome to override).
set -u
cd "$(dirname "$0")"
fail=0
for t in test_chat_handbook test_vas test_methods_radiation test_assistant_v3 test_chat_interview scan_languages; do
  echo "=== $t"; python3 "$t.py" | grep -E "RESULT|errs|FAILED|EN " || fail=1
done
exit $fail
