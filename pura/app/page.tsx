"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { AsciiBar } from "./components/AsciiBar";
import { StatusDot } from "./components/StatusDot";
import { RoutingViz } from "./components/RoutingViz";
import {
  generateRelaySeedState,
  generateLightningSeedState,
  generateAgentSeedState,
  generateGatewaySeedState,
  type RelayState,
  type LightningState,
  type ExplorerState,
  type GatewayState,
} from "@/lib/shared/seed";

interface ThermoState {
  temperature: string;
  virialRatio: string;
  escrowPressure: string;
  demurrageRate: string;
  phase: string;
  phaseIndex: number;
  tauMin: string;
  tauMax: string;
  equilibriumTarget: string;
  seed?: boolean;
}

interface SimState {
  tickNumber: number;
  phase: string;
  tickInPhase: number;
  flowRateMultiplier: number;
  baseFee: string;
  flowRate: string;
  agents: Record<
    string,
    {
      address: string;
      stake: string;
      capacityCap: string;
      poolUnits: string;
      completionRate: string;
      completions: string;
      queueLoad: string;
      price: string;
    }
  >;
  poolAddress: string | null;
  chainId: number;
  blockNumber: string;
}

function truncHex(s: string, n = 6) {
  if (s.length <= n * 2 + 2) return s;
  return s.slice(0, n + 2) + "\u2026" + s.slice(-n);
}

function fmtNum(n: number | string): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
  return v.toLocaleString();
}

function SectionHead({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <div className={styles.sectionHead}>
      <span style={{ color }}>{"── "}{label.toUpperCase()}</span>
      <hr className={styles.rule} />
    </div>
  );
}

const PROBLEMS = [
  {
    label: "overload without signal",
    body: "The best relays and DVMs get all the traffic. They overload silently. Mediocre services sit idle. No signal telling callers who has room.",
  },
  {
    label: "payments without proof",
    body: "Streaming payments keep flowing to saturated providers. Money goes in. Completed work doesn't come out. Nobody verifies actual output.",
  },
  {
    label: "reputation without portability",
    body: "A reliable relay operator gets no credit when they also run a DVM. Track records are siloed. Good actors can't prove history across services.",
  },
];

const SERVICES = [
  {
    label: "nostr relays",
    color: "var(--color-relays)",
    body: "Deploy a relay on yourname.pura.xyz. Register capacity on-chain. Earn from the relay payment pool proportional to verified throughput.",
    href: "/deploy",
  },
  {
    label: "nip-90 dvms",
    color: "var(--amber)",
    body: "Run a Data Vending Machine for on-demand computation. Register capacity. Get routed jobs when you have headroom. Earn from verified work.",
    href: "/deploy/dvm",
  },
  {
    label: "llm endpoints",
    color: "var(--color-gateway)",
    body: "Multi-provider inference endpoint that routes requests based on real-time capacity. OpenAI-compatible API. Saturated provider? Requests go to whoever has room.",
    href: "/deploy",
  },
  {
    label: "agent services",
    color: "var(--color-agents)",
    body: "Register AI agent skills with throughput, latency, and error rate. Dual-signed completions build portable reputation across service types.",
    href: "/deploy",
  },
];

const PIPELINE = [
  { step: "declare", desc: "operators sign capacity attestations" },
  { step: "verify", desc: "dual-signed completions, on-chain proof" },
  { step: "price", desc: "congestion-driven dynamic pricing" },
  { step: "route", desc: "Boltzmann allocation to spare capacity" },
  { step: "buffer", desc: "escrow absorbs overflow, demurrage decays idle funds" },
];

const COMPARE_ROWS = [
  {
    metric: "Capacity awareness",
    vals: ["None", "None", "Server-side only", "On-chain, signed"],
  },
  {
    metric: "Completion verification",
    vals: ["None", "None", "None", "Dual-signed + vr.dev"],
  },
  {
    metric: "Economic incentives",
    vals: ["None", "None", "None", "Streaming payments"],
  },
  {
    metric: "Cross-service reputation",
    vals: ["None", "None", "None", "Portable, weighted"],
  },
];

export default function Dashboard() {
  const [relays, setRelays] = useState<RelayState | null>(null);
  const [lightning, setLightning] = useState<LightningState | null>(null);
  const [agents, setAgents] = useState<ExplorerState | null>(null);
  const [gateway, setGateway] = useState<GatewayState | null>(null);
  const [sim, setSim] = useState<SimState | null>(null);
  const [thermo, setThermo] = useState<ThermoState | null>(null);
  const [seeds, setSeeds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchOrSeed<T>(
      url: string,
      key: string,
      seedFn: (() => T) | null,
      setter: (v: T) => void,
    ) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          setter(await res.json());
          return;
        }
      } catch {
        /* fall through to seed */
      }
      if (seedFn) {
        setter(seedFn());
        setSeeds((prev) => new Set(prev).add(key));
      }
    }

    fetchOrSeed("/api/relays/state", "relays", generateRelaySeedState, setRelays);
    fetchOrSeed("/api/lightning/state", "lightning", generateLightningSeedState, setLightning);
    fetchOrSeed("/api/agents/state", "agents", generateAgentSeedState, setAgents);
    fetchOrSeed("/api/gateway/state", "gateway", generateGatewaySeedState, setGateway);
    fetchOrSeed<SimState>("/api/sim/state", "sim", null, setSim);
    fetchOrSeed<ThermoState>("/api/thermo/state", "thermo", null, setThermo);
  }, []);

  const seed = (key: string) =>
    seeds.has(key) ? <span className={styles.seedTag}>[seed]</span> : null;

  return (
    <main className={styles.main}>
      {/* ═══════════ HERO ═══════════ */}
      <header className={styles.hero}>
        <h1 className={styles.title}>
          The operator platform for verified machine services.
        </h1>
        <p className={styles.subtitle}>
          Deploy Nostr relays, NIP-90 DVMs, LLM endpoints, and AI agents.
          Monitor real-time capacity. Verify completions. Earn proportional
          to verified throughput. Built on Base, settled via Lightning or
          Superfluid.
        </p>
        <div className={styles.heroCtas}>
          <a href="/deploy" className={styles.ctaPrimary}>deploy a service →</a>
          <a href="/monitor" className={styles.ctaSecondary}>try shadow mode →</a>
        </div>
        <RoutingViz />
      </header>

      {/* ═══════════ LIVE STATS BAR ═══════════ */}
      <div className={styles.statsBar}>
        <span>base-sepolia testnet</span>
        <span className={styles.statsBarSep}>│</span>
        <span>25 contracts</span>
        <span className={styles.statsBarSep}>│</span>
        <span>249 tests passing</span>
        {thermo && (
          <>
            <span className={styles.statsBarSep}>│</span>
            <span>τ = {thermo.temperature}</span>
            <span className={styles.statsBarSep}>│</span>
            <span>phase: {thermo.phase}</span>
          </>
        )}
      </div>

      <hr className={styles.divider} />

      {/* ═══════════ PROBLEM ═══════════ */}
      <section className={styles.problemSection}>
        <SectionHead label="the problem" color="var(--red)" />
        <div className={styles.problemGrid}>
          {PROBLEMS.map((p) => (
            <div key={p.label} className={styles.problemCard}>
              <span className={styles.problemLabel}>
                {"── "}{p.label.toUpperCase()}
              </span>
              <p className={styles.problemBody}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className={styles.divider} />

      {/* ═══════════ SOLUTION PIPELINE ═══════════ */}
      <section className={styles.section}>
        <SectionHead label="the solution" color="var(--green)" />
        <p className={styles.solutionHeadline}>
          Pura makes capacity observable, completions verifiable, and payments
          proportional.
        </p>
        <div className={styles.pipeline}>
          {PIPELINE.map((p, i) => (
            <div key={p.step} className={styles.pipelineStep}>
              <span className={styles.pipelineNum}>{i + 1}</span>
              <span className={styles.pipelineName}>{p.step}</span>
              <span className={styles.pipelineDesc}>{p.desc}</span>
              {i < PIPELINE.length - 1 && (
                <span className={styles.pipelineArrow}>→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <hr className={styles.divider} />

      {/* ═══════════ SERVICE TYPES ═══════════ */}
      <section className={styles.section}>
        <SectionHead label="what you can deploy" color="var(--amber)" />
        <div className={styles.serviceGrid}>
          {SERVICES.map((s) => (
            <div key={s.label} className={styles.serviceCard}>
              <span className={styles.serviceLabel} style={{ color: s.color }}>
                {"── "}{s.label.toUpperCase()}
              </span>
              <p className={styles.serviceBody}>{s.body}</p>
              <a href={s.href} className={styles.docLink}>
                deploy →
              </a>
            </div>
          ))}
        </div>
      </section>

      <hr className={styles.divider} />

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <section className={styles.section}>
        <SectionHead label="how it compares" color="var(--text-dim)" />
        <table className={styles.tbl}>
          <thead>
            <tr>
              <th>metric</th>
              <th>no coordination</th>
              <th>round-robin</th>
              <th>load balancer</th>
              <th className={styles.highlightCol}>pura</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r) => (
              <tr key={r.metric}>
                <td>{r.metric}</td>
                {r.vals.map((v, i) => (
                  <td
                    key={i}
                    className={i === 3 ? styles.highlightCol : undefined}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <hr className={styles.divider} />

      {/* ═══════════ LIVE PROTOCOL STATE ═══════════ */}
      <SectionHead label="live protocol state" color="var(--amber)" />

      {/* ── SYSTEM STATE — thermodynamic overview ── */}
      <section className={styles.section} id="thermo">
        <SectionHead label="system state" color="var(--amber)" />
        <p className={styles.desc}>
          Three thermodynamic signals on-chain. Temperature (τ) from
          attestation variance drives exploratory routing. Virial ratio V
          measures stake-throughput equilibrium (V=1 at balance). Escrow
          pressure P tracks buffer fill. Together they drive adaptive pricing,
          demurrage, and circuit breakers.
        </p>
        {thermo ? (
          <>
            <div className={styles.stats}>
              <span className={styles.kv}>
                <span className={styles.k}>phase</span>{" "}
                <span className={styles.v}>{thermo.phase}</span>
              </span>
              <span className={styles.kv}>
                <span className={styles.k}>τ</span>{" "}
                <span className={styles.v}>{thermo.temperature}</span>
              </span>
              <span className={styles.kv}>
                <span className={styles.k}>V</span>{" "}
                <span className={styles.v}>{thermo.virialRatio}</span>
              </span>
              <span className={styles.kv}>
                <span className={styles.k}>P</span>{" "}
                <span className={styles.v}>{thermo.escrowPressure}</span>
              </span>
              <span className={styles.kv}>
                <span className={styles.k}>δ</span>{" "}
                <span className={styles.v}>{thermo.demurrageRate}%/yr</span>
              </span>
              {thermo.seed && <span className={styles.seedTag}>[seed]</span>}
            </div>
            <div className={styles.stats}>
              <span className={styles.kv}>
                <span className={styles.k}>τ range</span>{" "}
                <span className={styles.v}>{thermo.tauMin} – {thermo.tauMax}</span>
              </span>
              <span className={styles.kv}>
                <span className={styles.k}>V target</span>{" "}
                <span className={styles.v}>{thermo.equilibriumTarget}</span>
              </span>
              <span className={styles.kv}>
                <span className={styles.k}>contracts</span>{" "}
                <span className={styles.v}>TemperatureOracle · VirialMonitor · SystemStateEmitter</span>
              </span>
            </div>
          </>
        ) : (
          <p className={styles.wait}>connecting...</p>
        )}
        <a href="/docs/contracts" className={styles.docLink}>
          thermodynamic plan →
        </a>
      </section>

      <hr className={styles.divider} />

      {/* ── DEPLOY — primary conversion ── */}
      <section className={styles.deployBlock} id="deploy">
        <SectionHead label="deploy a service" color="var(--color-deploy)" />
        <p className={styles.desc}>
          Get a Nostr relay running on yourname.pura.xyz in under a minute.
          Sign in with any NIP-07 extension (Alby, nos2x), pick a plan, done.
          Or deploy a NIP-90 DVM and start earning from verified completions.
        </p>
        <div className={styles.deployTiers}>
          <div className={styles.tier}>
            <span className={styles.tierName}>free</span>
            <span className={styles.tierPrice}>$0</span>
            <span className={styles.tierDetail}>100 MB storage, 10 allowed pubkeys, 50 events/min</span>
          </div>
          <div className={styles.tier}>
            <span className={styles.tierName}>pro</span>
            <span className={styles.tierPrice}>$9/mo</span>
            <span className={styles.tierDetail}>
              5 GB storage, unlimited pubkeys, custom domain, on-chain
              registration, payment pool revenue
            </span>
          </div>
          <div className={styles.tier}>
            <span className={styles.tierName}>operator</span>
            <span className={styles.tierPrice}>$29/mo</span>
            <span className={styles.tierDetail}>
              50 GB storage, multi-relay configs, advanced analytics,
              priority support
            </span>
          </div>
        </div>
        <div className={styles.heroCtas}>
          <a href="/deploy" className={styles.deployCta}>deploy relay →</a>
          <a href="/deploy/dvm" className={styles.deployCta}>deploy dvm →</a>
        </div>
      </section>

      <hr className={styles.divider} />

      <div className={styles.grid}>
        {/* ── left column ── */}
        <div>
          {/* RELAYS */}
          <section className={styles.section} id="relays">
            <SectionHead label="relay capacity" color="var(--color-relays)" />
            <p className={styles.desc}>
              On-chain registry of Nostr relay capacity. Operators register
              events/sec, storage, and bandwidth and stake against those numbers.
              Payment streams distribute proportional to verified capacity.
            </p>
            {relays ? (
              <>
                <div className={styles.stats}>
                  <span className={styles.kv}>
                    <span className={styles.k}>total</span>{" "}
                    <span className={styles.v}>{relays.totalRelays}</span>
                  </span>
                  <span className={styles.kv}>
                    <span className={styles.k}>anti-spam w/r/s</span>{" "}
                    <span className={styles.v}>
                      {relays.antiSpamMinimums.write}/
                      {relays.antiSpamMinimums.read}/
                      {relays.antiSpamMinimums.store}
                    </span>
                  </span>
                  {seed("relays")}
                </div>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>pubkey</th>
                      <th>operator</th>
                      <th>capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relays.relays.map((r) => (
                      <tr key={r.pubkey}>
                        <td className={styles.trunc}>{truncHex(r.pubkey)}</td>
                        <td className={styles.trunc}>{truncHex(r.operator)}</td>
                        <td>
                          <AsciiBar
                            value={Number(r.capacity)}
                            max={1000}
                            width={12}
                            color="var(--color-relays)"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className={styles.wait}>connecting...</p>
            )}
            <a href="/docs/contracts" className={styles.docLink}>
              protocol spec →
            </a>
          </section>

          {/* LIGHTNING */}
          <section className={styles.section} id="lightning">
            <SectionHead label="lightning routing" color="var(--color-lightning)" />
            <p className={styles.desc}>
              Capacity-weighted route finding for Lightning. Nodes register
              channel liquidity on-chain backed by stake. EWMA smoothing
              prevents gaming. Operators earn routing fees proportional to
              registered capacity.
            </p>
            {lightning ? (
              <>
                <div className={styles.stats}>
                  <span className={styles.kv}>
                    <span className={styles.k}>nodes</span>{" "}
                    <span className={styles.v}>{lightning.totalNodes}</span>
                  </span>
                  {seed("lightning")}
                </div>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>pubkey</th>
                      <th>capacity</th>
                      <th>fee</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lightning.nodes.map((n) => (
                      <tr key={n.pubkey}>
                        <td className={styles.trunc}>{truncHex(n.pubkey)}</td>
                        <td>{fmtNum(n.capacity)}</td>
                        <td>{n.fee} sat</td>
                        <td>
                          <StatusDot
                            color={n.active ? "var(--green)" : "var(--text-dim)"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className={styles.wait}>connecting...</p>
            )}
            <a href="/docs/contracts" className={styles.docLink}>
              protocol spec →
            </a>
          </section>

          {/* AGENTS */}
          <section className={styles.section} id="agents">
            <SectionHead label="agent reputation" color="var(--color-agents)" />
            <p className={styles.desc}>
              AI agent registry on OpenClaw. Agents publish throughput, latency,
              and error rate. Each completion is dual-signed and on-chain,
              producing a composite reputation score.
            </p>
            {agents ? (
              <>
                <div className={styles.stats}>
                  <span className={styles.kv}>
                    <span className={styles.k}>registered</span>{" "}
                    <span className={styles.v}>{agents.totalAgents}</span>
                  </span>
                  <span className={styles.kv}>
                    <span className={styles.k}>protocol</span>{" "}
                    <StatusDot
                      color={
                        agents.protocolAvailable
                          ? "var(--green)"
                          : "var(--red)"
                      }
                      label={agents.protocolAvailable ? "live" : "off"}
                    />
                  </span>
                  {seed("agents")}
                </div>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>reputation</th>
                      <th>completions</th>
                      <th>gap</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.agents.map((a) => (
                      <tr key={a.id}>
                        <td className={styles.trunc}>{truncHex(a.id)}</td>
                        <td>
                          {a.reputation ? (
                            <AsciiBar
                              value={Number(a.reputation.score)}
                              max={100}
                              width={10}
                              color="var(--color-agents)"
                            />
                          ) : (
                            "\u2014"
                          )}
                        </td>
                        <td>{a.reputation?.completions ?? "\u2014"}</td>
                        <td>
                          {a.measurabilityGap != null
                            ? `${a.measurabilityGap}%`
                            : "\u2014"}
                        </td>
                        <td>
                          <StatusDot
                            color={
                              a.active ? "var(--green)" : "var(--text-dim)"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className={styles.wait}>connecting...</p>
            )}
            <a href="/docs/contracts" className={styles.docLink}>
              openclaw spec →
            </a>
          </section>
        </div>

        {/* ── right column ── */}
        <div>
          {/* GATEWAY */}
          <section className={styles.section} id="gateway">
            <SectionHead label="llm gateway" color="var(--color-gateway)" />
            <p className={styles.desc}>
              Multi-provider LLM API that routes requests across OpenAI and
              Anthropic based on real-time on-chain capacity weights.
              OpenAI-compatible. Saturated provider? Requests go to whoever
              has headroom. Every completion recorded on-chain.
            </p>
            {gateway ? (
              <>
                <div className={styles.stats}>
                  <span className={styles.kv}>
                    <span className={styles.k}>keys</span>{" "}
                    <span className={styles.v}>{gateway.keys.total}</span>
                  </span>
                  <span className={styles.kv}>
                    <span className={styles.k}>reqs</span>{" "}
                    <span className={styles.v}>
                      {fmtNum(gateway.keys.totalRequests)}
                    </span>
                  </span>
                  <span className={styles.kv}>
                    <span className={styles.k}>base fee</span>{" "}
                    <span className={styles.v}>{gateway.baseFee}</span>
                  </span>
                  {seed("gateway")}
                </div>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>sink</th>
                      <th>completions</th>
                      <th>units</th>
                      <th>price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gateway.sinks
                      .filter((s) => s.configured)
                      .map((s) => (
                        <tr key={s.name}>
                          <td>{s.name}</td>
                          <td>{fmtNum(s.completions ?? "0")}</td>
                          <td>{s.units ?? "\u2014"}</td>
                          <td>
                            <AsciiBar
                              value={Number(s.price ?? 0)}
                              max={20}
                              width={10}
                              color="var(--color-gateway)"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className={styles.wait}>connecting...</p>
            )}
            <a href="/docs/contracts" className={styles.docLink}>
              gateway docs →
            </a>
          </section>

          {/* SIMULATOR */}
          <section className={styles.section} id="sim">
            <SectionHead label="simulator" color="var(--color-sim)" />
            <p className={styles.desc}>
              Live agent-based simulation. Multiple agents with different
              strategies compete for capacity allocation across market phases
              (bull, bear, shock, recovery). Truthful reporting is the
              dominant strategy.
            </p>
            {sim ? (
              <>
                <div className={styles.stats}>
                  <span className={styles.kv}>
                    <span className={styles.k}>tick</span>{" "}
                    <span className={styles.v}>{sim.tickNumber}</span>
                  </span>
                  <span className={styles.kv}>
                    <span className={styles.k}>phase</span>{" "}
                    <span className={styles.v}>{sim.phase}</span>
                  </span>
                  <span className={styles.kv}>
                    <span className={styles.k}>flow</span>{" "}
                    <span className={styles.v}>{sim.flowRateMultiplier}×</span>
                  </span>
                </div>
                <table className={styles.tbl}>
                  <thead>
                    <tr>
                      <th>agent</th>
                      <th>stake</th>
                      <th>rate</th>
                      <th>load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sim.agents).map(([name, a]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>{fmtNum(a.stake)}</td>
                        <td>{fmtNum(a.completionRate)}</td>
                        <td>
                          <AsciiBar
                            value={Number(a.queueLoad)}
                            max={100}
                            width={10}
                            color="var(--color-sim)"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className={styles.offline}>
                sim offline — requires agent wallets
              </p>
            )}
            <a href="/docs/simulation" className={styles.docLink}>
              simulation design →
            </a>
          </section>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* ═══════════ ECOSYSTEM ═══════════ */}
      <footer className={styles.ecosystem}>
        <span>Built on Backproto (MIT)</span>
        <span className={styles.ecosystemSep}>·</span>
        <span>Verified by vr.dev</span>
        <span className={styles.ecosystemSep}>·</span>
        <span>Settled via Superfluid + Lightning</span>
        <span className={styles.ecosystemSep}>·</span>
        <a
          href="https://github.com/pura-xyz"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ecosystemLink}
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
