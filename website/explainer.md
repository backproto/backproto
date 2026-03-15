# How BPE Works — The Plain-Language Guide

**No math degree required.** This page explains Backpressure Economics (BPE) from scratch, with pictures.

---

## The Problem: AI Agents Need to Pay Each Other

Imagine a world where AI agents do work for each other — and pay with cryptocurrency in real-time, streaming tiny amounts every second, like a running meter.

- A **translation agent** pays an **LLM agent** to generate text
- A **photo app** pays an **image generation agent** to create pictures
- A **search agent** pays an **embedding agent** to understand text

These payments flow continuously, like water through pipes.

**But here's the problem:** what happens when an agent gets too busy?

```mermaid
graph LR
    A[Translation Agent<br/>Sending $10/min] -->|payment stream| B[LLM Agent<br/>⚠️ At capacity!]
    C[Chat Agent<br/>Sending $5/min] -->|payment stream| B
    D[Writing Agent<br/>Sending $8/min] -->|payment stream| B

    style B fill:#ff6b6b,color:#fff
```

The LLM agent can only handle so much work. But the money keeps flowing in, whether the work gets done or not. It's like paying for a restaurant meal that never arrives because the kitchen is overwhelmed.

**In data networks, this is a solved problem** — routers drop packets or reroute traffic when links are congested. But in payment networks? No one has built this. That's what BPE does.

---

## The Solution: Backpressure Routing for Money

BPE borrows a brilliant idea from how the internet works: **backpressure routing**. The core idea is simple:

> **Send more money to the agents who have the most spare capacity.**

```mermaid
graph LR
    A[Translation Agent<br/>Sending $10/min] -->|$7/min| B[LLM Agent A<br/>✅ 70% free]
    A -->|$3/min| C[LLM Agent B<br/>⚠️ 30% free]

    style B fill:#51cf66,color:#fff
    style C fill:#ffd43b,color:#000
```

When Agent A has lots of spare capacity, it gets a bigger share of the payments. When Agent B is almost full, it gets less. The system automatically reroutes money toward whoever can actually do the work.

---

## How Does It Actually Work?

There are five key ideas, and they form a pipeline:

```mermaid
graph TB
    subgraph "1️⃣ DECLARE"
        S1[Each agent announces<br/>how much work it can handle]
    end

    subgraph "2️⃣ VERIFY"
        S2[The system checks<br/>if they're telling the truth]
    end

    subgraph "3️⃣ PRICE"
        S4[Busy agents become<br/>more expensive]
    end

    subgraph "4️⃣ ROUTE"
        S3[Payments flow to agents<br/>based on their capacity]
    end

    subgraph "5️⃣ BUFFER"
        S5[Overflow payments are<br/>held safely until capacity frees up]
    end

    S1 --> S2 --> S4 --> S3 --> S5

    style S1 fill:#339af0,color:#fff
    style S2 fill:#845ef7,color:#fff
    style S4 fill:#f76707,color:#fff
    style S3 fill:#51cf66,color:#fff
    style S5 fill:#ffd43b,color:#000
```

Let's walk through each one.

---

### 1️⃣ Declare: "Here's How Much I Can Handle"

Every AI agent that wants to receive payments (**called a "sink"**) tells the network how much work it can process. Think of it like a restaurant posting how many tables are open.

But there's a catch — agents might lie to get more money. So declarations go through two safeguards:

**Stake to play.** Every agent must put down a deposit (like a security deposit on an apartment). The more you deposit, the more capacity you're allowed to claim. This prevents someone from creating a thousand fake agents to steal payments.

```mermaid
graph LR
    A[Agent deposits<br/>100 tokens] -->|stake| B[Allowed to claim<br/>capacity of 10]
    C[Agent deposits<br/>400 tokens] -->|stake| D[Allowed to claim<br/>capacity of 20]

    style A fill:#e9ecef
    style C fill:#e9ecef
    style B fill:#339af0,color:#fff
    style D fill:#339af0,color:#fff
```

Notice something? Depositing 4x more only gives you 2x more capacity. This is by design — it makes the "create fake identities" attack unprofitable.

**Commit-reveal.** Agents don't just blurt out their capacity. They first submit a sealed commitment (like a sealed auction bid), then reveal the actual number later. This prevents other agents from seeing your number and gaming the system.

---

### 2️⃣ Verify: "Prove You Actually Did the Work"

Declaring capacity is one thing. Actually doing the work is another. BPE has a built-in lie detector:

```mermaid
sequenceDiagram
    participant Source as 📱 App (Source)
    participant Sink as 🤖 AI Agent (Sink)
    participant Chain as ⛓️ Blockchain

    Source->>Sink: Send task request
    Sink->>Sink: Do the work
    Sink->>Source: Return result + sign receipt
    Source->>Chain: Submit receipt (both signatures)
    Chain->>Chain: Count completions vs. declared capacity
    
    Note over Chain: If completions < 50% of declared capacity<br/>for 3 periods in a row → slash the deposit!
```

Every completed task produces a **dual-signed receipt** — both the agent doing the work AND the agent requesting it must sign off. The blockchain counts these receipts and compares them to what the agent *claimed* it could do.

**If an agent claims it can handle 100 tasks per period but only completes 40?** After three bad periods in a row, 10% of its deposit gets taken away. This makes lying about capacity a losing strategy.

---

### 3️⃣ Price: Busy Agents Cost More

Just like Uber's surge pricing, BPE makes busy agents more expensive:

```mermaid
graph TB
    subgraph "Low demand"
        A1[Queue: 2 tasks waiting] --> B1["Price: $1.00/task"]
    end
    subgraph "Medium demand"
        A2[Queue: 10 tasks waiting] --> B2["Price: $1.80/task"]
    end
    subgraph "High demand"
        A3[Queue: 50 tasks waiting] --> B3["Price: $5.00/task"]
    end

    style B1 fill:#51cf66,color:#fff
    style B2 fill:#ffd43b,color:#000
    style B3 fill:#ff6b6b,color:#fff
```

The price has two parts:

- **Base fee** — goes up when demand is high across the board (like gas prices during a shortage)
- **Queue premium** — goes up for a specific agent when their personal queue is long

This naturally pushes demand toward agents that have spare capacity, because they're cheaper.

---

### 4️⃣ Route: Money Flows Where Capacity Is

This is the magic step. A smart contract called the **Backpressure Pool** collects all incoming payment streams and redistributes them automatically.

```mermaid
graph TB
    P1[Source 1<br/>$5/min] --> Pool
    P2[Source 2<br/>$3/min] --> Pool
    P3[Source 3<br/>$7/min] --> Pool

    Pool["Backpressure Pool<br/>$15/min total"] --> S1
    Pool --> S2
    Pool --> S3

    S1["Agent A — 50% capacity<br/>Gets $7.50/min"]
    S2["Agent B — 30% capacity<br/>Gets $4.50/min"]
    S3["Agent C — 20% capacity<br/>Gets $3.00/min"]

    style Pool fill:#339af0,color:#fff
    style S1 fill:#51cf66,color:#fff
    style S2 fill:#51cf66,color:#fff
    style S3 fill:#51cf66,color:#fff
```

The pool divides money in proportion to each agent's verified capacity. Agents with more verified capacity get a bigger slice. This happens **automatically and continuously** — no middleman, no manual intervention.

When capacity changes (an agent gets busier, or a new agent joins), anyone can trigger a **rebalance** to update the split.

---

### 5️⃣ Buffer: A Safety Net for Overflow

What if ALL agents are at capacity and money keeps coming in? Instead of losing it, BPE holds it in an **escrow buffer** — like a waiting room.

```mermaid
graph LR
    IN["Incoming: $20/min"] --> CHECK{Any capacity<br/>available?}
    CHECK -->|Yes| POOL["Backpressure Pool<br/>Routes to agents"]
    CHECK -->|No| BUFFER["Escrow Buffer<br/>Holds excess safely"]
    BUFFER -->|When capacity frees up| POOL

    style BUFFER fill:#ffd43b,color:#000
    style POOL fill:#51cf66,color:#fff
```

When capacity frees up, the buffer drains automatically. If the buffer itself fills up, sources get a clear signal: stop sending until things clear up.

---

## The Big Picture

Here's how all the pieces fit together in one view:

```mermaid
graph TB
    subgraph "Off-chain (fast, free)"
        ATTEST["Agents sign capacity<br/>attestations off-chain"]
    end

    subgraph "On-chain (secure, permanent)"
        AGG["Aggregator<br/>Batches attestations"] --> REG["Capacity Registry<br/>Tracks who can do what"]
        SM["Stake Manager<br/>Deposits & capacity caps"] --> REG
        REG --> POOL["Backpressure Pool<br/>Routes payments"]
        REG --> PRICE["Pricing Curve<br/>Dynamic fees"]
        POOL --> GDA["Superfluid Streams<br/>Continuous payments"]
        POOL --> BUF["Escrow Buffer<br/>Overflow safety"]
        COMP["Completion Tracker<br/>Verifies actual work"] -.->|slash if lying| SM
    end

    ATTEST --> AGG

    style ATTEST fill:#e9ecef
    style AGG fill:#845ef7,color:#fff
    style REG fill:#339af0,color:#fff
    style SM fill:#339af0,color:#fff
    style POOL fill:#51cf66,color:#fff
    style PRICE fill:#f76707,color:#fff
    style GDA fill:#51cf66,color:#fff
    style BUF fill:#ffd43b,color:#000
    style COMP fill:#ff6b6b,color:#fff
```

---

## Why Should I Care?

BPE matters because AI agents are starting to transact with each other autonomously — paying for compute, data, and services without humans in the loop. Today's payment systems can't handle this:

| Problem | Traditional Payments | BPE |
|---------|---------------------|-----|
| Agent gets overwhelmed | Money wasted, work unfinished | Money reroutes to available agents |
| Agent lies about capacity | No way to know | Automatic detection and penalty |
| New agent joins | Manual integration | Permissionless — just stake and register |
| Demand spikes | System breaks | Prices rise, demand balances naturally |
| Agent goes offline | Payments lost | Buffer holds funds, pool rebalances |

---

## Glossary

| Term | Plain English |
|------|--------------|
| **Sink** | An AI agent that receives payment for doing work |
| **Source** | An app or agent that pays for work to be done |
| **Task type** | A category of work (e.g., "text generation", "image creation") |
| **Capacity** | How much work an agent can handle at once |
| **Stake** | A security deposit agents put down to participate |
| **Slash** | Penalty — taking part of an agent's deposit for bad behavior |
| **EWMA** | A smoothing method that prevents sudden, suspicious capacity changes |
| **Rebalance** | Updating how payments are split based on current capacity |
| **Epoch** | A time window (5 minutes) for measuring agent performance |
| **Stream** | A continuous payment flow (like a salary paid every second) |
| **GDA** | General Distribution Agreement — Superfluid's tech for splitting a stream among multiple recipients |

---

## Want to Go Deeper?

- **[Paper — Introduction](paper/introduction.md)** — the academic version, with formal proofs
- **[Protocol Design](paper/protocol.md)** — technical details of each smart contract
- **[Implementation](implementation/contracts.md)** — the actual Solidity code, deployed on Base Sepolia
- **[SDK](implementation/sdk.md)** — build with BPE in TypeScript
