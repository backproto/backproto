# Catalini window — GTM ops file

Everything needed to capitalize on the Catalini paper ("Some Simple Economics of AGI", arXiv:2602.20946v2) and the a16z podcast ("AI just gave you superpowers — now what?", March 2026). One file, all copy, ready to deploy.

Window: 2-4 weeks from March 21, 2026. The people reading Catalini right now are the same people who need to see Pura. After that, the paper becomes background noise.

---

## LinkedIn connection request (≤200 chars)

For Catalini / MIT co-authors:

> Your measurability parameter maps to our CompletionTracker contract. Built the verification layer you formalized. Would love to compare notes.

For a16z / podcast guests:

> Heard the pod on AI agent infrastructure. We built the payment routing layer — backpressure + streaming on Base L2. Would be glad to share what we learned.

For agent infra builders who posted about Catalini:

> Saw your take on Catalini's verification economics. We have a working protocol for this — capacity routing with on-chain verification. Happy to show you.

---

## DM follow-up (after connection accepted)

For Catalini / academic:

Hey — thanks for connecting. Your paper landed at a perfect time. I have been building Pura for the past year: a protocol that routes streaming payments to AI agents based on verified spare capacity, using on-chain completion tracking and staked capacity declarations.

Your measurability parameter *m* maps directly to what our CompletionTracker enforces: dual-signed receipts per task, completion rate tracking over rolling epochs, automatic slashing below 50% for three consecutive periods. High-*m* tasks get cheap verification through the existing mechanism. Low-*m* tasks need something more, and we are adding a verificationBudgetBps parameter so economy deployers can allocate a share of the payment stream to human or multi-party verification.

I wrote up the full mapping: [blog post URL]. The paper is adding a §2.7 on verification economics citing your work.

Would 20 minutes be useful? I would genuinely like feedback on whether our slashing mechanism is the right implementation of your V(m).

For a16z / crypto-native:

Hey — thanks for the connect. The podcast framing of blockchain as "the financial API for autonomous software" is exactly why I built Pura on Superfluid + Base.

Pura routes streaming payments to AI agents proportional to their verified spare capacity. Agents stake, declare capacity, produce dual-signed completion receipts, and a smart contract pool rebalances payment flows automatically. 25 contracts on Base Sepolia, 249 tests, TypeScript SDK.

I wrote up how Catalini's verification economics framework maps to our mechanism design: [blog post URL].

Would you be open to 15 minutes? Interested in whether the streaming payments model fits the agent infrastructure thesis your team has been developing.

---

## Twitter thread — Catalini mapping (7 tweets)

1/

MIT just published a formal model for why AI verification, not AI capability, is the real bottleneck.

Catalini et al., "Some Simple Economics of AGI." The measurability parameter *m* determines which tasks get automated, how prices shift, and who captures value.

Here is how it maps to working code.

2/

Catalini: tasks with high measurability *m* get automated first because verification is cheap. Tasks with low *m* stay expensive regardless of AI capability.

Pura: the CompletionTracker contract enforces this split. Dual-signed receipts = high-*m* verification. Each agent's completion rate is tracked per 300-second epoch on-chain.

3/

Catalini: verification cost determines the automation frontier more than production cost.

Pura: we are adding verificationBudgetBps — a per-pool parameter that reserves a share of the payment stream for verification. High-*m* task: 5%. Low-*m* task: 20-30%. Set by the economy deployer.

4/

Catalini: stablecoins reduce agent-to-agent transaction costs by an order of magnitude.

Pura: built on Superfluid GDA streaming on Base L2. The marginal cost of an additional payment flow is one rebalance() call — around $0.001 on Base Sepolia. No batch settlement. No invoice.

5/

a16z podcast (Lazzarin): blockchain is "the financial API for autonomous software."

This is what receiver-side capacity routing on a programmable chain looks like. The routing signal and the payment are the same mechanism. You cannot do that on Stripe.

6/

New metric: Δm (measurability gap). Per-agent, computed as (declared capacity − verified completions) / declared capacity.

Green: <20%. Yellow: 20-50%. Red: >50%.

Live in the DarkSource dashboard. Using Catalini's vocabulary to surface data we already had.

7/

The protocol changes (verificationBudgetBps, Δm display) ship this week. Blog post mapping all six Catalini concepts to Pura mechanisms is live.

If you are building agents and thinking about verification costs, try the testnet.

pura.xyz
pura.xyz/blog/verification-bottleneck

---

## Standalone tweets (5)

Tweet A — quote-bait:

Catalini's "Some Simple Economics of AGI" argues verification cost, not production cost, determines which tasks AI can actually take over.

We have been building this for a year. CompletionTracker: dual-signed receipts, per-epoch rates, auto-slashing. The verification layer, in Solidity.

pura.xyz/blog/verification-bottleneck

Tweet B — Lazzarin angle:

"Blockchain is the financial API for autonomous software" — Lazzarin on a16z.

This is what that looks like in practice: Superfluid GDA pools routing payments proportional to verified agent capacity. Sub-cent gas on Base L2. No batch settlement. No invoice cycle.

pura.xyz

Tweet C — measurability gap:

New metric for agent reputation: Δm, the measurability gap.

Declared capacity vs verified completions. Higher gap = either the agent is overclaiming or verification has holes.

Live in DarkSource. The number Catalini formalized, displayed per-agent.

darksource.ai

Tweet D — building in public:

Reading Catalini's AGI paper and finding your protocol already implements half the verification mechanisms he formalizes is a strange feeling.

Adding: verificationBudgetBps per pool, Δm metric per agent, and §2.7 in the paper citing his work.

Blog post mapping all six concepts: pura.xyz/blog/verification-bottleneck

Tweet E — reply-ready (for threads about AI agent payments):

We built this. Pura routes streaming payments to AI agents proportional to verified spare capacity. Dual-signed receipts, auto-slashing, capacity routing on Base L2. 25 contracts, 249 tests.

Catalini's paper formalizes the economics behind it.

pura.xyz

---

## LinkedIn post (~1400 chars)

MIT's Catalini published "Some Simple Economics of AGI" last month. The core argument: AI capability is increasing fast, but the cost of *verifying* AI output is the actual bottleneck that determines which tasks get automated and how value gets distributed.

He introduces a measurability parameter *m* that controls these dynamics. High *m* = cheap verification = fast automation. Low *m* = expensive verification = humans stay in the loop regardless of what the model can produce.

I have been building a protocol called Pura that implements this distinction in deployed smart contracts. Agents declare capacity backed by stake. A CompletionTracker records dual-signed receipts and tracks per-epoch completion rates on-chain. Agents below 50% for three consecutive epochs get slashed automatically.

That mechanism covers high-*m* tasks. For low-*m* tasks, we are adding a verificationBudgetBps parameter — economy deployers set what percentage of the payment stream is earmarked for verification. A code compilation pool might set 5%. A legal review pool might need 25%.

Three days after Catalini's paper, the a16z podcast made the same argument from the infrastructure side: blockchain as the financial API for agent economies, stablecoins reducing transaction costs by 10x.

Pura is live on Base Sepolia. 25 contracts, 249 tests, TypeScript SDK. MIT licensed.

Full mapping of Catalini's six concepts to Pura mechanisms: pura.xyz/blog/verification-bottleneck

---

## Reply templates

For threads discussing Catalini's paper:

> The measurability parameter maps cleanly to on-chain verification mechanisms. We built a CompletionTracker that does dual-signed receipts per task with auto-slashing — high-*m* verification in Solidity. Blog post with the full mapping: [URL]

For threads about AI agent payment infrastructure:

> We built this on Superfluid + Base. Streaming payments routed proportional to verified spare capacity, with automatic rebalancing when agents hit limits. 25 contracts on testnet. pura.xyz

For threads about a16z podcast / blockchain + AI:

> Lazzarin's framing of blockchain as the financial API for agents is exactly what pushed us to build on-chain rather than off. The routing signal and the payment need to be one mechanism — you cannot retrofit that onto a REST API with Stripe webhooks.

For threads about AI verification / trust:

> Catalini's verification cost model predicts that tasks will be priced by *m*, not by compute. We are adding a verificationBudgetBps parameter to let economy deployers set the right verification spend per task type. The data is already there in completion rates.

---

## Grant narrative snippets

For Base Builder Grant:

> Recent work by Catalini et al. (MIT, 2026) formalizes the economic argument for verification-aware payment routing. Their measurability parameter *m* directly maps to Pura's on-chain completion tracking and capacity verification. The protocol implements what MIT's economics department described in theory, deployed on Base L2.

For Superfluid Ecosystem Grant:

> Catalini et al. (2026) show that verification cost, not production cost, determines task pricing in agent economies. Pura's use of Superfluid GDA to route payments proportional to verified capacity is a concrete implementation of their verification-aware allocation model. The verificationBudgetBps parameter extends GDA pools with per-task verification budgets.

---

## Execution checklist

Timing: start within 48 hours of this commit. Content window is 2-4 weeks.

Phase 1 — content (days 1-3):
- [ ] Publish verification-bottleneck blog post on website
- [ ] Post LinkedIn article (use copy above, adapt for character limit)
- [ ] Post tweet D (building in public angle) as first signal
- [ ] Post tweet A (Catalini quote-bait) next day

Phase 2 — outreach (days 2-7):
- [ ] Send LinkedIn connection request to Catalini (use template above)
- [ ] Send LinkedIn connection request to 2-3 co-authors
- [ ] Send connection request to Lazzarin / Dixon if findable on LinkedIn
- [ ] Identify 10 accounts that posted about Catalini paper on Twitter
- [ ] Reply to 3-5 of those threads using reply templates
- [ ] Send Twitter DMs to 3-5 agent infra builders using follow-up template

Phase 3 — thread + sustained (days 4-10):
- [ ] Post full 7-tweet thread (Catalini mapping)
- [ ] Cross-post thread to Bluesky and Nostr
- [ ] Post tweet B (Lazzarin angle) and tweet C (Δm metric) on separate days
- [ ] Update grant applications with Catalini narrative snippets
- [ ] Monitor for replies and engage within 4 hours

Phase 4 — paper + protocol (days 7-14):
- [ ] Confirm verificationBudgetBps is in the deployed contracts
- [ ] Confirm Δm is showing in DarkSource dashboard
- [ ] Confirm §2.7 is in the paper draft
- [ ] Confirm Catalini is in the bibliography
- [ ] If Catalini responds, propose a 20-minute call
- [ ] If a16z responds, propose a 15-minute call with testnet walkthrough

Success signals:
- Catalini or a co-author engages (reply, like, connection accept)
- 2+ agent infra builders click through to blog post
- 1+ external testnet interaction traced to Catalini-linked outreach
- Grant reviewer mentions the Catalini framing as a strength
