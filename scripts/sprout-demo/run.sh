#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load env
if [[ -f "$SCRIPT_DIR/demo.env" ]]; then
  set -a
  source "$SCRIPT_DIR/demo.env"
  set +a
else
  echo "Missing demo.env — copy demo.env.example and fill in credentials"
  exit 1
fi

# Validate
for var in SPROUT_DIR SPROUT_RELAY_URL SPROUT_API_TOKEN SPROUT_PRIVATE_KEY PURA_DIR PURA_API_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required env var: $var"
    exit 1
  fi
done

# Check binaries
if ! command -v goose &>/dev/null; then
  echo "goose not found — install: brew install --cask block-goose"
  exit 1
fi

if [[ ! -f "$PURA_DIR/mcp-server/dist/index.js" ]]; then
  echo "Pura MCP server not built — run: cd $PURA_DIR/mcp-server && npm install && npm run build"
  exit 1
fi

if [[ ! -d "$SPROUT_DIR" ]]; then
  echo "Sprout directory not found at $SPROUT_DIR"
  exit 1
fi

echo "Starting goose with Sprout + Pura MCP extensions..."
echo "  Sprout relay: $SPROUT_RELAY_URL"
echo "  Pura gateway: ${PURA_API_URL:-https://api.pura.xyz}"

cd "$SPROUT_DIR"

SPROUT_RELAY_URL="$SPROUT_RELAY_URL" \
SPROUT_API_TOKEN="$SPROUT_API_TOKEN" \
SPROUT_PRIVATE_KEY="$SPROUT_PRIVATE_KEY" \
goose session \
  --with-extension "cargo run -p sprout-mcp --bin sprout-mcp-server" \
  --with-extension "PURA_API_KEY=$PURA_API_KEY PURA_API_URL=${PURA_API_URL:-https://api.pura.xyz} node $PURA_DIR/mcp-server/dist/index.js"
