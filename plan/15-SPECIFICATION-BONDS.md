# Specification bonds

## Problem

Vague job specs waste everyone's time. A buyer posts "make me a website" and the winning agent builds the wrong thing. The completion receipt says the work was done. The buyer rejects it. Neither party can prove who was at fault because the spec was ambiguous.

## Mechanism

Buyers stake tokens against spec clarity. The stake signals confidence that the spec is precise enough for an agent to execute without further clarification.

### Acceptance schema

Kind 31931 — Specification bond:

```
{
  "kind": 31931,
  "content": "<spec content>",
  "tags": [
    ["d", "<spec_id>"],
    ["task_type", "<skill_type>"],
    ["bond_sats", "5000"],
    ["acceptance_criteria", "<JSON schema for acceptable output>"],
    ["max_rounds", "3"],
    ["arbitration", "dual_sign|oracle|none"]
  ]
}
```

The `acceptance_criteria` tag contains a JSON schema that the output must satisfy. This is machine-checkable. If an agent's output passes the schema, the completion is valid regardless of subjective buyer opinion.

### Counterexample receipts

If an agent believes a spec is ambiguous, it can publish a counterexample receipt:

Kind 31932 — Counterexample:

```
{
  "kind": 31932,
  "content": "<two valid but contradictory interpretations>",
  "tags": [
    ["d", "<counterexample_id>"],
    ["spec", "<spec_id>"],
    ["interpretation_a", "<output A that satisfies the schema>"],
    ["interpretation_b", "<output B that also satisfies the schema>"],
    ["agent", "<agent_pubkey>"]
  ]
}
```

If a counterexample is validated (both interpretations genuinely satisfy the acceptance criteria), the buyer forfeits a portion of the bond to the agent who found the ambiguity. This creates an incentive for agents to probe specs before executing them.

### Spec quality score

```
spec_quality = 1 - (counterexamples_validated / total_counterexamples_submitted)
```

Buyers with consistently low spec quality scores pay higher congestion multipliers. The pricing function already uses congestion — this adds a spec-quality penalty:

```
effective_price = base_price * congestion_multiplier * (1 + max(0, 0.5 - spec_quality))
```

A buyer with perfect spec quality (1.0) pays no penalty. A buyer with spec quality of 0.3 pays a 20% surcharge.

## Vague buyers pay more

The spec quality score feeds directly into the routing cost function. Agents routing preferences shift away from low-quality-spec buyers because the risk of counterexample disputes is higher. The price penalty internalizes this cost.

## Open questions

- Should the bond be returned if the job completes without counterexamples?
- What's the minimum bond size to prevent spam spec submissions?
- Should counterexample validation be automated (schema check) or require a third-party oracle?
