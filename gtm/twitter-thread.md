# Twitter/X thread

Copy-paste each numbered block as a separate tweet. Post from personal account using "I" voice. Hold this thread until follower count is >100 (engagement-first strategy until then).

---

1/

I built an OpenClaw skill that cut my agent's LLM costs 60%.

Most agents send every request to GPT-4o. Simple tasks, complex tasks, all billed the same. I made a routing layer that scores complexity and sends the cheap stuff to models that cost 10x less.

pura.xyz/compare

---

2/

The problem: every OpenClaw agent hard-codes one LLM provider. When that model is overkill for the task, you're overpaying. When it goes down, your agent stops.

Pura sits between your agent and the LLM. It picks the cheapest model that can handle each request.

---

3/

How cascade routing works:

Every request starts at Groq (Llama 3.3 70B, $0.00059/1K tokens). If the response is weak — too short, hedging, refusal — it automatically retries on the next tier.

Groq → Gemini → OpenAI → Anthropic.

70-80% of requests resolve at tier 1. The rest escalate.

---

4/

Four signals determine whether to escalate:

- Length ratio (response vs expected)
- Hedging language ("I think", "it depends")
- Refusal detection
- Completeness check

If all four pass, the cheap answer stands. If any fail, the request moves up a tier. You pay premium prices only when the cheap answer was genuinely not good enough.

---

5/

The install is one env var change.

```python
from openai import OpenAI
client = OpenAI(
  base_url="https://api.pura.xyz/v1",
  api_key="pura_YOUR_KEY"
)
```

OpenAI SDK compatible. Every response includes cost headers: X-Pura-Model, X-Pura-Cost, X-Pura-Tier.

---

6/

Security angle: your LLM API keys stay on the Pura server. They never touch the agent runtime.

If you run OpenClaw agents with third-party plugins, those plugins cannot access your provider keys. The agent talks to one URL. That is it.

---

7/

Free tier is 5,000 requests. No credit card. Takes 30 seconds to get a key.

After that, fund via Lightning. Smallest useful deposit is ~1,000 sats ($0.30), good for roughly 500 routed completions.

---

8/

Head-to-head comparison: pura.xyz/compare

Open source, MIT licensed. Looking for OpenClaw builders willing to try it and tell me what breaks.

pura.xyz
github.com/puraxyz/puraxyz

---

## Notes

- Post from personal account, "I" voice throughout
- Screenshot the DemoTerminal from pura.xyz for tweet 3
- Do not post until follower count > 100 (engagement-first)
- Cross-post to Bluesky and Nostr

---

## One-off posts

Post individually. Not a thread. Same "I" voice. Each stands alone. Use these for daily building-in-public breadcrumbs while doing engagement-first.

---

If your OpenClaw agent calls GPT-4o for every request including "what time is it," you are burning money. I built a skill that scores complexity and routes simple requests to Llama 3.3 on Groq. The agent does not notice. The bill drops 80%.

---

Every OpenClaw agent has the same problem: one provider, one model, one price for everything. Simple QA, complex reasoning, code generation — all billed at the same rate. Cascade routing fixes this. pura.xyz/compare

---

Agents should pay per-request on Lightning, not per-month on Stripe. A subscription assumes steady usage. Agent usage is bursty and unpredictable. Lightning invoices match the actual usage curve.

---

The OpenAI SDK already supports custom base URLs. That means any agent built on it can switch to Pura by changing one line. No new SDK. No new auth flow. Just a different base_url and an API key.

---

If your agent calls GPT-4o for every request including "what time is it," you are burning money. Pura scores task complexity and routes simple requests to Llama 3.3 on Groq. The agent does not notice. The bill drops 80%.

---

Self-hosting the Pura gateway: clone the repo, add your own provider API keys, run `npm run dev`. No platform fees, no usage tracking, no vendor lock-in. Your keys, your data, your routing rules.

---

35 contracts. 319 tests. 4 LLM providers. Lightning settlement. One API endpoint. The whole thing is MIT-licensed. pura.xyz

---

The gateway tracks which providers are up, how fast they respond, and what they cost per token. When a provider degrades, traffic shifts automatically. Your agent never sees a 500 error.

---

OpenClaw skills can ship with a Pura gateway config baked in. Install the skill, it brings its own routing and payment. No manual provider setup. The skill author chose the tradeoffs. You just run it.

---

Hot take: the first AI agent platform that actually works at scale will not have the best models. It will have the best routing. Who handles the request, at what cost, and what happens when the provider is down.
