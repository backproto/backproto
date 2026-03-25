#!/usr/bin/env bash
# Synthetic agent traffic loop for Pura.
# Simulates agents hiring each other and routing LLM requests.
# Run periodically to keep the economy active and generate telemetry.

set -euo pipefail

GATEWAY="https://api.pura.xyz"

# Agent keys
KORBEN="pura_63856fbeee53048a74009fa323d399d20f031fa6dd3a999c"
ALPHA="pura_0c12ba8eafd0d8106056c31341a7363dfcd7e6187647c276"
BETA="pura_094a85250199c9e6bedba1f8086001d6340b2c3caa86bc3e"
GAMMA="pura_79989b460a1ec159cd0ce4f2cbe8b152852e03c773bc5593"

AGENTS=("$KORBEN" "$ALPHA" "$BETA" "$GAMMA")
AGENT_NAMES=("korben" "alpha" "beta" "gamma")

SKILLS=("code-review" "summarization" "research" "translation")
PROMPTS=(
  "Review this function for bugs: function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }"
  "Summarize the concept of backpressure economics in distributed systems"
  "What are the current approaches to agent-to-agent payment protocols?"
  "Translate to Spanish: The gateway routes requests based on task complexity"
)

echo "=== Pura Synthetic Traffic — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# 1. Route some LLM requests through the gateway (generates provider metrics)
echo ""
echo "--- LLM Routing ---"
for i in 0 1 2 3; do
  KEY="${AGENTS[$i]}"
  NAME="${AGENT_NAMES[$i]}"
  PROMPT="${PROMPTS[$i]}"
  
  RESULT=$(curl -s --max-time 20 -X POST "$GATEWAY/v1/chat/completions" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$PROMPT\"}],\"stream\":false}" 2>/dev/null || echo '{"error":"timeout"}')
  
  PROVIDER=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('model','error'))" 2>/dev/null || echo "error")
  echo "  $NAME → $PROVIDER"
  
  # Small delay to avoid rate limiting
  sleep 2
done

# 2. Marketplace activity — hire and complete tasks
echo ""
echo "--- Marketplace ---"

# Pick a random requester and skill
REQ_IDX=$(( RANDOM % 4 ))
SKILL_IDX=$(( RANDOM % 4 ))
REQ_KEY="${AGENTS[$REQ_IDX]}"
REQ_NAME="${AGENT_NAMES[$REQ_IDX]}"
SKILL="${SKILLS[$SKILL_IDX]}"

HIRE_RESULT=$(curl -s --max-time 10 -X POST "$GATEWAY/api/marketplace/hire" \
  -H "Authorization: Bearer $REQ_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"skillType\":\"$SKILL\",\"payload\":\"Synthetic task: $SKILL at $(date +%s)\",\"maxPrice\":2000}" 2>/dev/null || echo '{"error":"failed"}')

TASK_ID=$(echo "$HIRE_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('taskId','none'))" 2>/dev/null || echo "none")
ASSIGNED=$(echo "$HIRE_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('assignedTo','none'))" 2>/dev/null || echo "none")

if [[ "$TASK_ID" != "none" ]]; then
  echo "  $REQ_NAME hired $ASSIGNED for $SKILL (task: ${TASK_ID:0:20}...)"
  
  # Complete the task with a quality rating
  QUALITY=$(python3 -c "import random; print(round(random.uniform(0.75, 1.0), 2))")
  COMPLETE=$(curl -s --max-time 10 -X POST "$GATEWAY/api/marketplace/complete" \
    -H "Authorization: Bearer $REQ_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"taskId\":\"$TASK_ID\",\"qualityRating\":$QUALITY}" 2>/dev/null || echo '{"error":"failed"}')
  
  STATUS=$(echo "$COMPLETE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','error'))" 2>/dev/null || echo "error")
  echo "  Task $STATUS (quality: $QUALITY)"
else
  echo "  Hire failed: $HIRE_RESULT"
fi

# 3. Check economy stats
echo ""
echo "--- Economy ---"
ECON=$(curl -s --max-time 10 "$GATEWAY/api/economy" 2>/dev/null)
echo "$ECON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"  Agents: {d['totalAgents']} | Skills: {d['totalSkills']} | Tasks: {d['totalTasks']} | Completed: {d['completedTasks']} | Sats: {d['totalSatsTransacted']}\")
lb = d.get('leaderboard', [])
if lb:
    top = lb[0]
    print(f\"  Top agent: {top['agentId'][:8]}... ({top['earnings']} sats, quality: {top['quality']:.3f})\")
" 2>/dev/null || echo "  Failed to fetch economy"

echo ""
echo "=== Done ==="
