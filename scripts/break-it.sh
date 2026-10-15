#!/usr/bin/env bash
# Negative tests for the presigned POST limits and API validation.
# Usage: bash scripts/break-it.sh photo.jpg
#        API_URL defaults to http://localhost:3000/api
# Requires: curl, jq
set -uo pipefail   # no -e on purpose: most requests here are SUPPOSED to fail

# Windows builds of jq can emit CRLF line endings, which corrupt presigned form fields.
jq() { command jq "$@" | tr -d '\r'; }

API="${API_URL:-http://localhost:3000/api}"
PHOTO="${1:?usage: break-it.sh <photo.jpg>}"
[[ -r "$PHOTO" ]] || { echo "Cannot read $PHOTO" >&2; exit 1; }
# Git Bash path (/c/Users/x) -> Windows path (C:/Users/x) for Windows builds of curl.
PHOTO="$(cygpath -m "$PHOTO" 2>/dev/null || echo "$PHOTO")"

BIG="break-it-big.jpg"
trap 'rm -f "$BIG"' EXIT

URL=""
FIELDS=()
CODE=""
S3ERR=""

new_upload() {
  local res line
  res=$(curl -fsS -X POST "$API/uploads" -H 'content-type: application/json' \
    -d '{"contentType":"image/jpeg"}') || { echo "Could not reach $API" >&2; exit 1; }
  URL=$(jq -r .url <<<"$res")
  FIELDS=()
  while IFS= read -r line; do FIELDS+=("$line"); done \
    < <(jq -r '.fields | to_entries[] | "\(.key)=\(.value)"' <<<"$res")
}

# upload <file> <mode>    modes: normal | tamper-key | wrong-type | no-type
# Sets CODE (HTTP status) and S3ERR (the <Code> from S3's XML error, if any).
upload() {
  local file="$1" mode="${2:-normal}" args=() f resp body
  for f in "${FIELDS[@]}"; do
    case "$mode:$f" in
      tamper-key:key=*)          f="key=uploads/evil.jpg" ;;
      wrong-type:Content-Type=*) f="Content-Type=image/png" ;;
      no-type:Content-Type=*)    continue ;;
    esac
    args+=(-F "$f")
  done
  resp=$(curl -sS -w $'\n%{http_code}' "${args[@]}" -F "file=@${file};type=image/jpeg" "$URL")
  CODE="${resp##*$'\n'}"
  body="${resp%$'\n'*}"
  S3ERR=$(grep -o '<Code>[^<]*</Code>' <<<"$body" | sed 's/<[^>]*>//g')
}

report() { # <name> <expected-code> <actual-code> [detail]
  if [[ "$3" == "$2" ]]; then
    echo "PASS  $1 (HTTP $3 ${4:-})"
  else
    echo "FAIL  $1 (expected $2, got $3 ${4:-})"
  fi
}

echo "API: $API"
echo

# Control: if this fails, the harness or setup is broken, so ignore the rest.
new_upload; upload "$PHOTO" normal
report "control: valid upload accepted" 204 "$CODE" "$S3ERR"

new_upload; upload "$PHOTO" tamper-key
report "tampered key rejected" 403 "$CODE" "$S3ERR"

new_upload; upload "$PHOTO" wrong-type
report "wrong Content-Type rejected" 403 "$CODE" "$S3ERR"

new_upload; upload "$PHOTO" no-type
report "missing Content-Type rejected" 403 "$CODE" "$S3ERR"

# S3 checks size before looking at contents, so zeros are fine here.
head -c 11000000 /dev/zero > "$BIG"
new_upload; upload "$BIG" normal
report "11 MB file rejected" 400 "$CODE" "$S3ERR"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/uploads" \
  -H 'content-type: application/json' -d '{"contentType":"image/gif"}')
report "unsupported contentType gives 400" 400 "$code"

code=$(curl -s -o /dev/null -w '%{http_code}' "$API/images/not-a-uuid")
report "malformed image id gives 400" 400 "$code"

code=$(curl -s -o /dev/null -w '%{http_code}' "$API/images/123e4567-e89b-42d3-a456-426614174000")
report "unknown valid id gives 200 (pending)" 200 "$code"