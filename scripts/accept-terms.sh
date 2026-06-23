#!/usr/bin/env bash
#
# Accepts the Terms of Service for the demo admin via the API so that
# POST /api/access-tokens returns a token directly.
#
# A freshly started PLANKA instance requires the admin to accept the terms on
# first login. The load tests hit the login API directly and would otherwise get
# a "terms acceptance required" response, so CI runs this once after the stack is up.
#
# Usage: scripts/accept-terms.sh [BASE_URL] [EMAIL_OR_USERNAME] [PASSWORD]

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
EMAIL_OR_USERNAME="${2:-demo}"
PASSWORD="${3:-demo}"

login_resp=$(curl -sS -X POST "$BASE_URL/api/access-tokens" \
  -H 'Content-Type: application/json' \
  -d "{\"emailOrUsername\":\"$EMAIL_OR_USERNAME\",\"password\":\"$PASSWORD\"}")

pending_token=$(printf '%s' "$login_resp" | python3 -c "import sys, json; print(json.load(sys.stdin).get('pendingToken', ''))")

if [ -z "$pending_token" ]; then
  echo "Terms already accepted — login returned a token."
  exit 0
fi

signature=$(curl -fsS "$BASE_URL/api/terms" | python3 -c "import sys, json; print(json.load(sys.stdin)['item']['signature'])")

curl -fsS -X POST "$BASE_URL/api/access-tokens/accept-terms" \
  -H 'Content-Type: application/json' \
  -d "{\"pendingToken\":\"$pending_token\",\"signature\":\"$signature\"}" >/dev/null

echo "Terms accepted for '$EMAIL_OR_USERNAME'."
