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

Pura adapts backpressure routing (Tassiulas-Ephremides, 1992) to monetary flows.

The rule: route payments to agents with the most spare capacity.

Saturated agents get less. Available agents get more. Automatically. No coordinator.

---

4/

Then I added a thermodynamic layer.

The system computes a temperature from capacity variance. High disagreement = high temperature = more exploratory routing. Low disagreement = deterministic routing to the best provider.

Boltzmann-weighted probabilities. Same math as statistical mechanics.

---

5/

A virial ratio tracks whether staked capital matches throughput.

V = 2T / (S + E). T is throughput, S is staked, E is escrowed.

At V=1, the system is in equilibrium. Below 1, idle capital is taxed via adaptive demurrage (1-10%/year) to push tokens back into productive use.

---

6/

Circuit breakers per pipeline stage.

If throughput drops below 5% of declared capacity, or escrow pressure hits 95%, the stage decouples. A bottleneck in stage 3 stops cascading to stages 1 and 2. Recovery is automatic once throughput returns.

---

7/

The math works.

95.7% allocation efficiency (vs 93.5% round-robin).
83.5% gas reduction via off-chain attestation batching.
Recovery from agent failure within 50 steps.
Formal throughput optimality proof via Lyapunov drift analysis.

---

8/

Live on Base Sepolia. 25 contracts. 249 passing tests. TypeScript SDK with 18 modules. Research paper with formal proofs. MIT licensed.

Three new thermodynamic contracts: TemperatureOracle, VirialMonitor, SystemStateEmitter.

pura.xyz
github.com/pura-xyz/pura

---

9/

Looking for feedback from AI agent builders.

If your agents pay each other and you want flow control for those payments, try the testnet.

If it breaks, tell me how. If something is missing, tell me what.

pura.xyz/explainer

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

Backpressure routing was invented in 1992 for data networks. The core idea: send traffic to the node with the most spare capacity. It took 33 years for someone to apply it to money. I built that.

pura.xyz

---

I keep seeing agent frameworks add "payment" as a feature and "load balancing" as a separate feature. These are the same problem. If the act of paying IS the demand signal, then routing the payment IS load balancing.

---

25 contracts. 249 tests. 18 SDK modules. Boltzmann routing. Virial equilibrium. Circuit breakers. One idea: route payments to whoever has room to do the work. pura.xyz

---

Agents that fake capacity get slashed. Agents that do the work get more payment flow. Agents that fill up get rerouted around. No human in the loop.

---

The system tracks a temperature derived from capacity variance. When providers disagree, temperature rises and routing spreads. When they agree, it locks in on the best one. Same math used in statistical mechanics and simulated annealing.

---

EIP-1559 solved gas pricing by making fees respond to congestion. Pura does the same thing for agent payments. Busy agent = higher price = demand shifts to the agent with room.

---

The concave square root capacity cap is the part of the protocol I am most pleased with. If you split your stake across two fake identities, your total capacity drops. Sybil attacks make you strictly worse off. No identity layer needed.

---

Streaming payments are a UX improvement. Backpressure routing is a mechanism design improvement. One makes payments continuous. The other makes sure continuous payments go to the right place.

---

Every agent framework will eventually need flow control for payments. The question is whether each one invents it independently or whether there is a shared protocol. I am building the shared protocol.

pura.xyz

---

Hot take: the first AI agent economy that actually works will not have the best models. It will have the best plumbing. Who gets paid, how much, and what happens when the pipe is full.

---

The worst thing that can happen in an agent economy is not fraud. It is silent overload. Money flowing to an agent that cannot do the work, with no signal propagating back to the sender. That is the default today.
