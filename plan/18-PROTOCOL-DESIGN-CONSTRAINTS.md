# Protocol design constraints

Four architectural notes that constrain implementation of advanced NVM features. Each identifies a dependency or tension that must be resolved before the feature ships.

## 12a: Lightning liquidity awareness

The routing service picks agents based on quality, capacity, and price. It does not check whether the Lightning payment to that agent will actually succeed. A route_score of 0.95 is useless if the payment path has insufficient liquidity.

### Constraint

Add `liquidity_factor` to the route scoring function:

```
route_score = quality * w_q + capacity * w_c + price * w_p + liquidity_factor * w_l
```

Where `liquidity_factor` is derived from:
- Channel balance probing (via `estimateRouteFee` or equivalent)
- Historical payment success rate to that agent's node
- Channel capacity relative to expected payment size

### Implementation

The Lightning capacity signals system (from `lightning-capacity-signals` blog post) already tracks per-node capacity. Wire this into the routing service:

1. Before routing, call `getChannelBalance(agentNode)` from the LND/CLN client.
2. If estimated success probability < 0.8, penalize the route score by `(1 - success_probability)`.
3. Cache liquidity estimates for 60 seconds (they change slowly except during payment bursts).

### Risk

Probing reveals information about payment flows. Limit probe frequency. Use cached estimates where possible.

## 12b: Blend-diversity tension

Don't implement covariance-based blend scoring (plan/17) without also implementing the blend gradient. The reason: if you optimize purely for output diversity (low covariance), you'll select agents that disagree with each other. Disagreement is not the same as complementary error. Two agents that are both wrong in different ways produce a blend that is wrong in a novel way.

### Constraint

Ship these together:
1. Blend gradient scoring (kind 31935)
2. Pareto frontier optimizer
3. Minimum individual quality threshold (hard floor at 0.6)

### Ordering

Blend scoring → quality floor → Pareto optimizer. Do not activate Pareto optimization until at least 50 blend-scored jobs exist per agent pair. Below that threshold, the covariance estimates are noise.

## 12c: Proactive correlation verification

Passive correlation detection (observing that two agents produce similar outputs over time) is slow. By the time you have enough data, the correlated agents may have already extracted significant routing share.

### Constraint

Add active stress probes:
1. Periodically submit synthetic jobs with known-correct answers to random agent pairs.
2. Compare outputs. If similarity > 0.9 and the agents claim independent operation, flag for Sybil review.
3. Probing cost must be lower than the expected loss from undetected Sybil extraction.

### Bounty design

Publish a correlation-detection bounty: any agent that identifies a correlated pair (with evidence from probe results) earns a bounty. The bounty must be less than the total routing revenue the correlated pair would have extracted over the detection period.

```
bounty < correlated_pair_daily_revenue * detection_lag_days
```

### Risk

Probes can be gamed if agents detect they're being probed. Randomize timing, use diverse synthetic jobs, and vary the probe source identity.

## 12d: Hitchhiker bids for state capsules

Cross-network bridging (plan, system 5) requires state transfer between relays. State capsules carry agent reputation, credit history, and skill configurations. These capsules need a payment rail.

### Constraint

Use an 80/20 Lightning split:
- 80% of the bridge fee pays the destination relay for ingesting and validating the capsule
- 20% pays the origin relay for packaging and signing the capsule

### Implementation

The bridge event (kind 31914) already has a `fee` tag. Add settlement logic:

1. Buyer initiates bridge request with `fee_sats`.
2. Origin relay packages the state capsule, signs it, publishes to the destination relay.
3. Destination relay validates signatures, ingests the capsule, publishes an acceptance receipt.
4. Settlement splits: `fee_sats * 0.8` to destination, `fee_sats * 0.2` to origin.
5. Both payments settle over Lightning as standard job completions.

### Edge case

If the destination relay rejects the capsule (invalid signatures, data corruption), the buyer gets a full refund. The origin relay gets nothing. This incentivizes the origin relay to package clean capsules.
