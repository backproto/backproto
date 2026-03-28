# Outreach DM templates

All DMs first person singular. Short. Specific. No pitch deck language. Lead with OpenClaw ecosystem angle.

---

## OpenClaw builders (primary target — skill devs, contributors, startups)

Subject: cut your openclaw agent's llm costs

Hey, I saw your work on [specific skill/project/PR]. I built an OpenClaw skill that routes your agent's LLM calls across four providers and picks the cheapest model that can handle each request.

Simple tasks go to Groq at $0.00059/1K tokens instead of GPT-4o at $0.005. If the cheap answer is weak, it automatically escalates. In practice, 70-80% of requests resolve at the cheapest tier.

Free for 5,000 requests. One env var change (swap your base URL). Would you try it and tell me what breaks?

pura.xyz/compare

---

## OpenClaw startup founders (revenue-generating, have real LLM costs)

Subject: saving money on llm calls

Hey, saw [company name / product]. Looks like you're running on OpenClaw.

I built a routing layer that sits between your agent and LLM providers. It scores each request's complexity and sends simple ones to Groq ($0.00059/1K) instead of GPT-4o ($0.005). Cascade routing: if the cheap answer is bad, it retries on a better model automatically. In practice, 40-60% savings on total LLM spend.

I can run your last 1,000 requests through the complexity scorer and show you exactly how much you'd save. Takes about 15 minutes. No commitment.

pura.xyz

---

## OpenClaw GitHub contributors (top committers)

Subject: openclaw cost optimization skill

Hey, I noticed your contributions to OpenClaw — [specific PR or area]. I built a skill that handles multi-provider LLM routing.

When installed, the agent routes simple tasks to Groq and complex ones to Anthropic/OpenAI. Cascade routing retries on a better model if the cheap answer falls short. Per-request cost headers so the agent tracks spend.

I'm looking for feedback on the integration. Free tier is 5,000 requests. Would 15 minutes be useful?

pura.xyz/compare

---

## AI agent builders (LangChain, CrewAI, AutoGen — secondary)

Subject: your agent is probably overpaying for simple tasks

Hey, I saw your work on [specific project/post]. Built something that might save you money.

Pura is a gateway that routes LLM calls across four providers. It scores each request's complexity and sends simple ones to models that cost 10x less. If the cheap model's response is weak, it automatically retries on a premium model. OpenAI SDK compatible — one URL change.

Free for 5,000 requests. Would you try it and tell me what breaks?

pura.xyz

---

## LLM infrastructure builders (LiteLLM, cost tracking tools — secondary)

Subject: cascade routing integration

Hey, I have been following [project]. I built a gateway that does automatic model selection with cascade routing — tries the cheapest model first, escalates only if the response quality is low (short answer, hedging language, refusals).

The quality scoring and cascade logic might be useful as a feature in [their project]. Four confidence signals: length ratio, hedging detection, refusal detection, completeness check.

Interested in chatting about how this could integrate? All MIT-licensed.

pura.xyz

---

## Warm follow-up (after initial contact, no response after 5+ days)

Subject: Re: [original subject]

Hey, circling back. No pressure.

Quick version: Pura is an OpenClaw skill that routes LLM calls across four providers. Picks the cheapest model per request. Cascade routing retries if the cheap answer is weak. Free tier is 5,000 requests.

15-minute walkthrough is open if you are curious.

pura.xyz
