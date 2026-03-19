# Twitter/X thread

Copy-paste each numbered block as a separate tweet. Post from personal account using "I" voice.

---

1/

AI agents are learning to pay each other in real time using streaming payments.

Nobody built the flow control layer. When an agent gets overwhelmed, the money keeps streaming in. No reroute. No throttle. No feedback.

Here is how I fixed it.

---

2/

In data networks, routers drop packets. TCP throttles the sender. Backpressure signals propagate upstream.

The internet works because congestion is a first-class concept.

Payment networks for AI agents have no equivalent.

---

3/

Backproto adapts backpressure routing (Tassiulas-Ephremides, 1992) to monetary flows.

The rule: route payments to agents with the most spare capacity.

Saturated agents get less. Available agents get more. Automatically. No coordinator.

---

4/

Five operations:

Agents declare capacity, backed by stake.
The protocol tracks completions and slashes liars.
Busy agents get expensive (EIP-1559-style).
A smart contract pool routes payments proportional to verified capacity.
Overflow sits in escrow until capacity frees up.

---

5/

Backproto is one layer in a stack of three:

Buildlog (buildlog.ai) records what agents do.
VR (vr.dev) verifies outcomes actually changed system state.
Backproto routes payments based on verified spare capacity.

Together: agents that do the work get paid. Agents that fake it get slashed.

---

6/

The math works.

95.7% allocation efficiency (vs 93.5% round-robin).
83.5% gas reduction via off-chain attestation batching.
Recovery from agent failure within 50 steps.
Formal throughput optimality proof via Lyapunov drift analysis.

---

7/

Live on Base Sepolia. 22 contracts. 213 passing tests. TypeScript SDK with 18 modules. Research paper with formal proofs. MIT licensed.

Research modules extend to Lightning routing, Nostr relay economics, and demurrage tokens.

backproto.io
github.com/backproto/backproto

---

8/

Looking for feedback from AI agent builders.

If your agents pay each other and you want flow control for those payments, try the testnet.

If it breaks, tell me how. If something is missing, tell me what.

backproto.io/explainer

---

## Notes

- Post from personal account, use "I" voice throughout
- Add architecture diagram image from the repo to tweet 5
- Tag relevant accounts: @BuildOnBase, @Superfluid_HQ, @LangChainAI
- Pin the thread after posting

---

## One-off posts

Post individually from personal account. Not a thread. Same "I" voice. Each stands alone.

---

The entire AI agent economy runs on fire-and-forget payments. Send money, hope the work happens. No receipt. No reroute if the agent is down. We have better plumbing for water than for agent payments.

---

If three agents all pay the same LLM and it is at capacity, what happens? Today: nothing. The money streams in. The work does not get done. Nobody gets told to try somewhere else.

---

Backpressure routing was invented in 1992 for data networks. The core idea: send traffic to the node with the most spare capacity. It took 34 years for someone to apply it to money. I built that.

backproto.io

---

I keep seeing agent frameworks add "payment" as a feature and "load balancing" as a separate feature. These are the same problem. If the act of paying IS the demand signal, then routing the payment IS load balancing.

---

22 contracts. 213 tests. 18 SDK modules. One idea: route payments to whoever has room to do the work. backproto.io

---

Agents that fake capacity get slashed. Agents that do the work get more payment flow. Agents that fill up get rerouted around. No human in the loop.

---

I built three things that are actually one thing:

Record what agents do (buildlog.ai).
Verify it happened (vr.dev).
Route payments accordingly (backproto.io).

---

EIP-1559 solved gas pricing by making fees respond to congestion. Backproto does the same thing for agent payments. Busy agent = higher price = demand shifts to the agent with room.

---

The concave square root capacity cap is the part of the protocol I am most pleased with. If you split your stake across two fake identities, your total capacity drops. Sybil attacks make you strictly worse off. No identity layer needed.

---

Streaming payments are a UX improvement. Backpressure routing is a mechanism design improvement. One makes payments continuous. The other makes sure continuous payments go to the right place.

---

Every agent framework will eventually need flow control for payments. The question is whether each one invents it independently or whether there is a shared protocol. I am building the shared protocol.

backproto.io

---

Hot take: the first AI agent economy that actually works will not have the best models. It will have the best plumbing. Who gets paid, how much, and what happens when the pipe is full.

---

The worst thing that can happen in an agent economy is not fraud. It is silent overload. Money flowing to an agent that cannot do the work, with no signal propagating back to the sender. That is the default today.
