#!/usr/bin/env bash
# Boot an iPhone simulator, install the unsigned .app, launch, and take load screenshots.
set -euo pipefail
APP="${1:?usage: ci_screenshot.sh path/to/WordDefense.app [outdir]}"
OUT="${2:-dist/shots}"
mkdir -p "$OUT"

UDID="$(python3 - <<'PY'
import json, subprocess, sys
data = json.loads(subprocess.check_output(["xcrun", "simctl", "list", "devices", "available", "-j"]))
candidates = []
for runtime, devices in data.get("devices", {}).items():
    if "iOS" not in runtime and "iPhoneOS" not in runtime:
        continue
    for d in devices:
        if not d.get("isAvailable"):
            continue
        name = d.get("name") or ""
        if "iPhone" not in name:
            continue
        score = 0
        if "iPhone 17" in name:
            score += 300
        elif "iPhone 16" in name:
            score += 200
        elif "iPhone 15" in name:
            score += 100
        if name.endswith("Pro") and "Max" not in name:
            score += 3
        elif "Pro Max" in name:
            score += 2
        candidates.append((score, runtime, name, d["udid"]))
if not candidates:
    sys.stderr.write("no iPhone simulator available\n")
    sys.exit(1)
candidates.sort(reverse=True)
score, runtime, name, udid = candidates[0]
sys.stderr.write(f"using {name} ({runtime}) {udid}\n")
print(udid)
PY
)"
echo "UDID=$UDID"
xcrun simctl boot "$UDID" || true
xcrun simctl bootstatus "$UDID" -b
xcrun simctl install "$UDID" "$APP"
LAUNCH_OUT="$(xcrun simctl launch "$UDID" com.wordgame.worddefense)"
echo "$LAUNCH_OUT"
PID="$(printf '%s\n' "$LAUNCH_OUT" | sed -n 's/.*: *//p' | tail -n 1)"
echo "PID=${PID:-unknown}"
sleep 4
# Best-effort liveness check (simulator ps/launchctl is limited). Don't fail the job here;
# later screenshots plus crash-report dumps tell us if it actually died.
alive=0
if [ -n "${PID}" ] && xcrun simctl spawn "$UDID" sh -c "kill -0 ${PID}" 2>/dev/null; then
  alive=1
  echo "pid $PID is alive"
fi
xcrun simctl spawn "$UDID" ps -A 2>/dev/null | grep -i -e WordDefense -e worddefense || true
if [ "$alive" -eq 0 ]; then
  echo "warning: could not confirm pid; will still screenshot. crash reports (if any):" >&2
  find "$HOME/Library/Logs/DiagnosticReports" "$HOME/Library/Logs/CoreSimulator" \
    /Library/Logs/DiagnosticReports \
    \( -iname '*WordDefense*' -o -iname '*worddefense*' -o -name '*.ips' \) 2>/dev/null | head
  xcrun simctl launch "$UDID" com.wordgame.worddefense || true
  sleep 3
fi
sleep 4
xcrun simctl io "$UDID" screenshot "$OUT/game-08s.png"
sleep 12
xcrun simctl io "$UDID" screenshot "$OUT/game-20s.png"
sleep 15
xcrun simctl io "$UDID" screenshot "$OUT/game-35s.png"
xcrun simctl terminate "$UDID" com.wordgame.worddefense || true
xcrun simctl shutdown "$UDID" || true
ls -la "$OUT"
