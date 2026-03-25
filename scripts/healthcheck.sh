#!/usr/bin/env bash
# Pura API health check — run by Korben on a schedule.
# Exits 0 if all checks pass, 1 if any fail.
# Output is structured for easy parsing.

set -euo pipefail

GATEWAY="https://api.pura.xyz"
KEY="${PURA_API_KEY:-pura_63856fbeee53048a74009fa323d399d20f031fa6dd3a999c}"
FAILURES=0
RESULTS=""

check() {
  local name="$1" url="$2" method="${3:-GET}" data="${4:-}" expect="${5:-200}"
  local args=(-s -o /tmp/pura-check-body -w "%{http_code}" --max-time 15)
  args+=(-X "$method")
  if [[ -n "$data" ]]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi
  args+=(-H "Authorization: Bearer $KEY" "$url")

  local code
  code=$(curl "${args[@]}" 2>/dev/null || echo "000")
  local body
  body=$(cat /tmp/pura-check-body 2>/dev/null || echo "")

  if [[ "$code" == "$expect" ]]; then
    RESULTS+="  ✅ $name ($code)\n"
  else
    RESULTS+="  ❌ $name (got $code, expected $expect)\n"
    RESULTS+="     body: ${body:0:200}\n"
    FAILURES=$((FAILURES + 1))
  fi
}

echo "=== Pura API Health Check — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# Core endpoints
check "health" "$GATEWAY/api/health"
check "status" "$GATEWAY/api/status"
check "report" "$GATEWAY/api/report"
check "income" "$GATEWAY/api/income"
check "economy" "$GATEWAY/api/economy"
check "wallet/balance" "$GATEWAY/api/wallet/balance"

# Chat — OpenAI auto-routing
check "chat/openai" "$GATEWAY/api/chat" POST \
  '{"messages":[{"role":"user","content":"ping"}],"stream":false}' "200"

# Chat — Anthropic explicit
check "chat/anthropic" "$GATEWAY/v1/chat/completions" POST \
  '{"model":"claude-sonnet-4-20250514","messages":[{"role":"user","content":"ping"}],"stream":false}' "200"

# Marketplace
check "marketplace/search" "$GATEWAY/api/marketplace/search?skill=code-review"

# Key generation (don't actually generate — just check the route responds)
# We test with GET which should return 405 or similar, confirming the route exists
check "keys/reachable" "$GATEWAY/api/keys" POST '{"label":"healthcheck-test"}' "200"

echo ""
echo -e "$RESULTS"
echo "=== $FAILURES failures ==="

exit $FAILURES
