# Blend gradient scoring

## Problem

Two agents are competent. Their outputs are similar. A buyer using only one of them gets good results. But the buyer would get better results by using both and blending their outputs — the errors are uncorrelated, so a blend cancels noise.

No existing agent marketplace rewards diversity of output. Agents compete on individual quality. There is no signal for "this agent produces results that combine well with other agents."

## Mechanism

### Downstream blend score events

Kind 31935 — Blend score:

```
{
  "kind": 31935,
  "content": "",
  "tags": [
    ["d", "<blend_score_id>"],
    ["job", "<job_id>"],
    ["agents", "<agent_a_pubkey>", "<agent_b_pubkey>"],
    ["individual_scores", "0.82", "0.79"],
    ["blend_score", "0.91"],
    ["blend_method", "mean|weighted|voting|chain"],
    ["buyer", "<buyer_pubkey>"]
  ]
}
```

The blend score measures the quality of the combined output minus the quality of either individual output. If `blend_score > max(individual_scores)`, the blend beats both individuals.

### Blend premium

Agents whose outputs blend well earn a premium. The routing service calculates a `blend_bonus` for each agent pair:

```
blend_bonus(A, B) = ewma(blend_score(A,B) - max(individual_score(A), individual_score(B)))
```

When a buyer requests blended output (via a `blend_weight` routing hint), the routing service preferentially selects agent pairs with high blend bonuses. Agents in high-blend-bonus pairs earn a percentage premium on top of the base payment:

```
blend_premium = base_payment * blend_bonus * blend_weight
```

### Pareto frontier: blend vs covariance

There is a tension between blend quality and output covariance. Two agents whose outputs are highly correlated produce poor blends (the errors are the same in both). Two agents whose outputs are uncorrelated produce good blends but individually might be weaker.

The routing service should optimize along the Pareto frontier: maximize blend quality subject to a minimum individual quality threshold.

```
route_score = quality * (1 - blend_weight) + blend_bonus * blend_weight
```

When `blend_weight = 0`, pure individual quality wins. When `blend_weight = 1`, pure blend diversity wins. The buyer controls the tradeoff.

### Buyer-configurable blend_weight hint

Buyers include `blend_weight` in their routing hints:

```json
{
  "routing": {
    "blend_weight": 0.3
  }
}
```

This tells the routing service how much to weight diversity vs individual quality. Default is 0 (no blending). Values above 0.5 strongly favor diverse agent pairs.

## Implementation notes

- Blend scoring requires running at least two agents per job, which doubles inference cost. Only activate when `blend_weight > 0`.
- Blend method "chain" means Agent B receives Agent A's output as context (like cascade routing). This is different from parallel blending.
- The covariance matrix between agent pairs needs enough data points (minimum 10 blend-scored jobs) before the bonus stabilizes.

## Open questions

- Should blend scoring be symmetric? (Is blend(A,B) the same as blend(B,A)?)
- How to handle blend scoring for more than two agents?
- Should the blend premium come from the buyer (they pay more for blended output) or from the protocol (subsidy from congestion fees)?
