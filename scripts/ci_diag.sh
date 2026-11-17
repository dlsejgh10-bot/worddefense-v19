#!/usr/bin/env bash
# CI only: run the Debug simulator app on an iPhone 11 (414x896 @2x, notch + home indicator), let scripts/wd_diag.js
# drive the tabs, and screenshot each step. Measurements are printed as WDDIAG lines and saved to $OUT/diag.log.
set -uo pipefail
APP="${1:?app}"; OUT="${2:-dist/diag}"; mkdir -p "$OUT"
cp -f "$(dirname "$0")/wd_diag.js" "$APP/wd_diag.js"
RT="$(xcrun simctl list runtimes -j | python3 -c 'import json,sys; r=[x for x in json.load(sys.stdin)["runtimes"] if x.get("isAvailable") and x["platform"]=="iOS"]; print(sorted(r,key=lambda x:[int(p) for p in x["version"].split(".")])[-1]["identifier"])')"
echo "runtime $RT"
UDID="$(xcrun simctl create diag-iphone11 com.apple.CoreSimulator.SimDeviceType.iPhone-11 "$RT" 2>/dev/null || true)"
if [ -z "$UDID" ]; then echo "iPhone 11 sim not available; using iPhone 11 Pro Max size fallback"; UDID="$(xcrun simctl create diag-xr com.apple.CoreSimulator.SimDeviceType.iPhone-XR "$RT" 2>/dev/null || true)"; fi
[ -z "$UDID" ] && { echo "no sim"; exit 0; }
xcrun simctl boot "$UDID" || true
xcrun simctl bootstatus "$UDID" -b
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch --console --terminate-running-process "$UDID" com.wordgame.worddefense > "$OUT/console.log" 2>&1 &
LP=$!
seen=""
for i in $(seq 1 1500); do
  sleep 0.3
  while read -r name; do
    case " $seen " in *" $name "*) continue;; esac
    seen="$seen $name"; xcrun simctl io "$UDID" screenshot "$OUT/$name.png" </dev/null >/dev/null 2>&1; echo "shot $name $(date +%T)"
  done < <(grep -o 'WDDIAG SHOT [a-z0-9]*' "$OUT/console.log" 2>/dev/null | awk '{print $3}')
  grep -q 'WDDIAG DONE' "$OUT/console.log" 2>/dev/null && break
done
grep 'WDDIAG' "$OUT/console.log" | tee "$OUT/diag.log"
kill $LP 2>/dev/null || true
xcrun simctl shutdown "$UDID" || true
exit 0
