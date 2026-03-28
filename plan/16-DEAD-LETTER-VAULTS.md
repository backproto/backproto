# Dead letter vaults

## Problem

Jobs fail. The agent times out, produces garbage, or the buyer rejects the output. In most systems the payment reverses and the work is lost. Nobody learns anything. The same failure mode repeats.

## Mechanism

Failed jobs go into a dead letter vault. The original payment is escrowed (not returned). The vault accrues interest. Anyone can attempt to "resurrect" the job — complete the work that the original agent failed to do.

### Dead letter event

Kind 31933 — Dead letter:

```
{
  "kind": 31933,
  "content": "<original job request>",
  "tags": [
    ["d", "<dead_letter_id>"],
    ["original_job", "<job_id>"],
    ["original_agent", "<failed_agent_pubkey>"],
    ["buyer", "<buyer_pubkey>"],
    ["task_type", "<skill_type>"],
    ["escrowed_sats", "3000"],
    ["failure_reason", "timeout|rejection|error"],
    ["created_at", "<timestamp>"],
    ["premium_bps", "2000"]  // 20% premium on top of original payment
  ]
}
```

### Resurrection bounty

The dead letter vault offers a bounty = original payment + accrued interest + premium to any agent that completes the job. The premium starts at the `premium_bps` value and increases over time (1% per day, capped at 100% of original).

```
bounty = escrowed_sats * (1 + interest_rate * days_elapsed) + escrowed_sats * min(premium_bps/10000 + 0.01 * days_elapsed, 1.0)
```

### Resurrection receipt

Kind 31934 — Resurrection:

```
{
  "kind": 31934,
  "content": "<completed output>",
  "tags": [
    ["d", "<resurrection_id>"],
    ["dead_letter", "<dead_letter_id>"],
    ["agent", "<resurrector_pubkey>"],
    ["buyer_accepted", "true|false"]
  ]
}
```

If the buyer accepts the resurrected output, the bounty pays out to the resurrector. The original (failed) agent gets nothing. The failure is recorded in CompletionTracker and affects routing weights.

### Demand-intelligence royalty

Dead letters have value as market intelligence: they reveal what jobs fail, which skill types have gaps, and where capacity is insufficient. The artifact royalty graph (kind 31930) can reference dead letter vaults as data artifacts. An agent that builds a failure-analysis pipeline earns royalties from insights derived from dead letter patterns.

## Interest accrual

Escrowed sats earn interest at the protocol's demurrage rate (inverted). If the system demurrage rate is 2%/year on idle capacity stakes, dead letter escrows earn 2%/year on locked funds. This keeps the incentive for resurrection alive over time rather than decaying.

## Open questions

- Should buyers be able to cancel a dead letter and reclaim the escrow after a timeout (e.g., 30 days)?
- Should the failed agent get a partial refund if they completed partial work?
- How to prevent a buyer from colluding with a resurrector to extract the premium?
