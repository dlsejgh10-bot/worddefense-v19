#!/usr/bin/env bash
# Copy the newest 단어 디펜스 HTML into the iOS bundle folder.
# Priority:
#   1. $WORD_DEFENSE_HTML
#   2. local workspace build (/workspace/wordgame/main_v2/word_defense_v19.html)
#   3. sibling checkout (../main_v2/word_defense_v19.html)
#   4. CI checkout of the pages branch ( $GITHUB_WORKSPACE/_gamehtml/index.html )
#   5. origin/main:index.html in this repo (same file GitHub Pages serves)
# If nothing is found, a tiny stub is written so the Xcode project still compiles.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="$ROOT/WordDefense/Resources/www"
DEST="$DEST_DIR/index.html"
mkdir -p "$DEST_DIR"

candidates=()
if [ -n "${WORD_DEFENSE_HTML:-}" ]; then
  candidates+=("$WORD_DEFENSE_HTML")
fi
candidates+=(
  "/workspace/wordgame/main_v2/word_defense_v19.html"
  "$ROOT/../main_v2/word_defense_v19.html"
  "$ROOT/../word_defense_v19.html"
)
if [ -n "${GITHUB_WORKSPACE:-}" ]; then
  candidates+=("$GITHUB_WORKSPACE/_gamehtml/index.html")
fi

SRC=""
for c in "${candidates[@]}"; do
  if [ -f "$c" ]; then
    SRC="$c"
    break
  fi
done

if [ -z "$SRC" ]; then
  # Last resort on CI: pull the published HTML already stored on the main (pages) branch.
  if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git -C "$ROOT" fetch --depth=1 origin main >/dev/null 2>&1; then
      TMP="$(mktemp)"
      if git -C "$ROOT" show origin/main:index.html > "$TMP" && [ -s "$TMP" ]; then
        SRC="$TMP"
      else
        rm -f "$TMP"
      fi
    fi
  fi
fi

if [ -z "$SRC" ]; then
  echo "warning: game HTML not found; writing a compile stub to $DEST" >&2
  cat > "$DEST" <<'HTML'
<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>단어 디펜스</title>
<body style="margin:0;background:#1B1410;color:#fff8e8;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center">
게임이 아직 포함되지 않았어요.<br>scripts/sync_html.sh 를 실행해 주세요.
</body>
</html>
HTML
  exit 0
fi

cp -f "$SRC" "$DEST"
# If we copied from a temp `git show`, clean it up after.
case "$SRC" in
  /tmp/*) rm -f "$SRC" ;;
esac
echo "synced $(wc -c < "$DEST" | tr -d ' ') bytes from $SRC -> $DEST"
