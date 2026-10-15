#!/usr/bin/env bash
# End-to-end check: request upload URL -> upload a JPEG -> poll until thumbnail is ready.
# Usage: bash scripts/smoke-test.sh photo.jpg
#        API_URL defaults to http://localhost:3000/api
# Requires: curl, jq
set -euo pipefail

# Windows builds of jq can emit CRLF line endings, which corrupt the presigned form fields.
jq() { command jq "$@" | tr -d '\r'; }

API="${API_URL:-http://localhost:3000/api}"
FILE="${1:?usage: smoke-test.sh <image.jpg>}"

[[ -r "$FILE" ]] || { echo "Cannot read $FILE" >&2; exit 1; }
# Git Bash path (/c/Users/x) -> Windows path (C:/Users/x) for Windows builds of curl.
FILE="$(cygpath -m "$FILE" 2>/dev/null || echo "$FILE")"

RES=$(curl -fsS -X POST "$API/uploads" \
  -H 'content-type: application/json' \
  -d '{"contentType":"image/jpeg"}')

ID=$(jq -r .id <<<"$RES")
URL=$(jq -r .url <<<"$RES")

# Presigned POST: send every returned field, then the file LAST.
ARGS=()
while IFS= read -r line; do ARGS+=(-F "$line"); done \
  < <(jq -r '.fields | to_entries[] | "\(.key)=\(.value)"' <<<"$RES")

curl -fsS "${ARGS[@]}" -F "file=@${FILE};type=image/jpeg" "$URL" -o /dev/null
echo "Uploaded $ID, waiting for thumbnail..."

for _ in $(seq 1 30); do
  STATUS=$(curl -fsS "$API/images/$ID")
  if [[ "$(jq -r .status <<<"$STATUS")" == "ready" ]]; then
    jq . <<<"$STATUS"
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for thumbnail $ID" >&2
exit 1