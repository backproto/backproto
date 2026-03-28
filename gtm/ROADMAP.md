# GTM execution plan — OpenClaw-first

60-day plan. One beachhead: OpenClaw. Updated April 2026.

---

## What exists today

- Gateway live at api.pura.xyz — 4 providers (OpenAI, Anthropic, Groq, Gemini), cascade routing, complexity scoring
- Per-request cost headers (X-Pura-Model, X-Pura-Cost, X-Pura-Tier, X-Pura-Budget-Remaining)
- Daily budget enforcement with 402 Payment Required on exhaustion
- Lightning settlement via LNbits (prepaid sat wallet, async deduction)
- 5,000 free requests per key, no credit card
- OpenClaw skill in `openclaw-skill/` — one env var install, cascade routing, cost reports
- Cost report endpoint (GET /api/report) with per-model spend breakdowns
- Provider status endpoint (GET /api/status) with time-bucketed latency/availability
- Comparison page at pura.xyz/compare — head-to-head cascade vs direct pricing
- 35 contracts on Base Sepolia, 319 tests, TypeScript SDK
- Next.js site (pura.xyz) with docs, blog, paper, gateway page, status page
- Research paper with formal Lyapunov proofs
- Self-audit + Aderyn static analysis (0 exploitable findings)

The product is the OpenClaw skill + gateway. The protocol and contracts are the mechanism underneath.

---

## Lessons learned

- HN Show HN with protocol-math-first angle — no traction. Retry leads with the product.
- Discord channels (LangChain, Superfluid, Base) — account timed out on first post. Dropped.
- Twitter/Bluesky/Nostr have <30 followers — standalone posts get zero reach. Engagement-first.
- LinkedIn (~3K followers) is the only channel with real distribution.
- Protocol framing ("backpressure routing for AI agent payments") does not convert. Product framing ("cut your agent's LLM costs 40-60%") does.
- OpenClaw is the beachhead: 250K stars, 1.5M agents, 129 startups, $283K revenue/month. Pura has a skill already built. Focus here and nowhere else until it works.

---

## Phase 0: shipped

| Action | Status |
|--------|--------|
| Gateway with 4 providers, cascade routing, budget enforcement | Done |
| Lightning settlement via LNbits | Done |
| OpenClaw skill (openclaw-skill/) | Done |
| Cost report + status endpoints | Done |
| Comparison page at /compare | Done |
| Homepage, gateway page, status page, getting-started docs | Done |
| SKILL.md rewritten for OpenClaw-first framing | Done |
| Community posts, outreach DMs rewritten for OpenClaw-first | Done |

## Phase 1: make the skill installable and demoable (days 1-7)

Before any outreach, the skill has to work end-to-end and produce a cost report someone can screenshot.

| Action | Notes |
|--------|-------|
| Run 3 personal agents through the gateway for 48h | Collect real tier distribution data |
| Screenshot the cost report showing per-model breakdown | For LinkedIn post 2 |
| Verify /compare page loads with accurate numbers | pura.xyz/compare |
| Test install flow: env var change → first request → cost header in response | Time it, target <60 seconds |
| Record the install flow as a 30-second screen capture | For DMs and posts |

Success signal: cost report showing 40-60% savings with real data, install time under 60 seconds.

## Phase 2: OpenClaw community immersion (days 1-14, parallel)

Get known in the OpenClaw ecosystem before posting about your own stuff.

| Action | Notes |
|--------|-------|
| Follow top 30 OpenClaw contributors on GitHub | Check who's active in issues/discussions |
| Comment on 2-3 GitHub issues per week with real technical input | Cost optimization, routing, provider selection topics |
| Join OpenClaw Discord and participate without self-promotion for 7 days | Build history first |
| Identify 10 people from the 129 startups who ship LLM-heavy agents | They spend the most on inference |
| Track names and projects in a spreadsheet | For phase 4 outreach |

Do not mention Pura in any of these interactions until phase 4.

## Phase 3: LinkedIn content push (days 7-21)

5 posts, spaced 2-3 days apart. URLs in first comment only. No weekends.

| Post | Angle | Asset |
|------|-------|-------|
| 1 | Cost savings with data — "I cut my agent's LLM costs 60%" | `gtm/community-posts.md` |
| 2 | The experiment — real tier distribution from 48h run | `gtm/community-posts.md` |
| 3 | OpenClaw LLM cost breakdown — offer free analysis | `gtm/community-posts.md` |
| 4 | Security angle — API key isolation for untrusted plugins | `gtm/community-posts.md` |
| 5 | Building in public — from protocol to product | `gtm/community-posts.md` |

Post 2 cannot go out until phase 1 produces real data. Post 3 is the conversion post (free analysis offer).

## Phase 4: direct outreach (days 7-28, parallel — highest ROI)

DMs work regardless of follower count. Highest-conversion channel.

| Action | Asset |
|--------|-------|
| DM 10 OpenClaw builders identified in phase 2 | `gtm/outreach-dm.md` template 1 |
| DM 5 OpenClaw startup founders (from 129 startups list) | `gtm/outreach-dm.md` template 2 |
| DM 5 top GitHub contributors | `gtm/outreach-dm.md` template 3 |
| LinkedIn connection requests with cost-savings note | Leverages 3K network |
| Offer 15-minute pairing sessions ("try it, I'll watch, tell me what breaks") | pura.xyz/gateway as call script |
| Track funnel: DMs sent → replies → calls → API keys → cost reports | Spreadsheet |
| Follow up once after 5 days on unanswered DMs | One follow-up only |

Pitch: "Your agent sends every request to GPT-4o. 70-80% of those requests are simple enough for a model that costs 10x less. Free for 5K requests. Would you try it and tell me what breaks?"

Success signal: 3+ external agents running through the gateway with cost reports showing savings.

## Phase 5: Reddit + HN (days 14-28)

Reddit replaces Discord. Space posts 5-7 days apart. Comment on existing threads first.

| Action | Asset |
|--------|-------|
| Comment on 5+ existing r/LocalLLaMA threads about model costs | Build karma first |
| Post to r/LocalLLaMA — routing layer for multi-provider cost optimization | `gtm/community-posts.md` |
| Post to r/OpenClaw (or GitHub Discussions) — OpenClaw skill announcement | `gtm/community-posts.md` |
| HN Show HN — product-first, lead with the cost savings and curl example | `gtm/community-posts.md` |

## Phase 6: expand from beachhead (days 28-60)

Only if phases 1-5 produced 5+ active users and at least one cost report from someone else's agent.

| Action | Asset |
|--------|-------|
| Submit OpenClaw grant application | `gtm/grant-openclaw.md` |
| Submit Base Builder grant | `gtm/grant-base.md` |
| Submit Superfluid grant | `gtm/grant-superfluid.md` |
| Twitter thread (post when follower count > 100) | `gtm/twitter-thread.md` |
| Secondary communities: LangChain, CrewAI, AutoGen builders | `gtm/outreach-dm.md` templates 4-5 |
| Add providers based on demand (Mistral, Cohere, local models) | `gateway/lib/providers/` |
| Publish SDK to npm | `sdk/` |

Do not spray across communities until the OpenClaw beachhead is working.

---

## Channels dropped

| Channel | Reason | Revisit? |
|---------|--------|----------|
| Discord (LangChain, Superfluid, Base) | Account timed out on first post | No |
| HN (protocol-math angle) | Posted March 2026, no traction | Yes — product-first in phase 5 |
| Nostr/Lightning communities | Deferred until gateway has traction | Maybe |

## Explicitly deferred

- Mainnet deployment: until 5+ gateway users and grant funding confirmed
- Third-party security audit: until grant funding lands
- Python SDK: until builders specifically ask for it
- Nostr relay and Lightning domain pilots: until OpenClaw beachhead is working
- NIP-XX standardization: until relay operators are engaged
- Stripe/card payments: Lightning-only for now, revisit at 10+ paid users
- Revenue infrastructure: until 10+ active users
- NVM advanced systems content: after OpenClaw traction established
- arXiv paper submission: after real usage data exists

---

## Decisions made

- Beachhead: OpenClaw ecosystem, nothing else until it works
- Voice: first person singular everywhere (DMs, posts, threads)
- Lead with cost savings ("40-60% reduction"), not the protocol
- Lightning-only settlement, no Stripe. Free tier covers adoption friction.
- Non-AI domains (relay economics, Lightning routing): deferred indefinitely
- All content complies with AISLOP.md

## Quick reference

| Asset | Location |
|-------|----------|
| OpenClaw skill | `openclaw-skill/SKILL.md` |
| Comparison page | `pura/app/compare/page.tsx` |
| Twitter thread | `gtm/twitter-thread.md` |
| Community posts | `gtm/community-posts.md` |
| Outreach DMs | `gtm/outreach-dm.md` |
| Feedback form | `gtm/feedback-form.md` |
| OpenClaw grant | `gtm/grant-openclaw.md` |
| Base grant | `gtm/grant-base.md` |
| Superfluid grant | `gtm/grant-superfluid.md` |
| OpenClaw grant | `gtm/grant-openclaw.md` |
| AISLOP rules | `gtm/AISLOP.md` |
| This plan | `gtm/ROADMAP.md` |
