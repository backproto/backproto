"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { AsciiBar } from "./components/AsciiBar";
import { StatusDot } from "./components/StatusDot";
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

export default function Dashboard() {
  const [relays, setRelays] = useState<RelayState | null>(null);
  const [lightning, setLightning] = useState<LightningState | null>(null);
  const [agents, setAgents] = useState<ExplorerState | null>(null);
  const [gateway, setGateway] = useState<GatewayState | null>(null);
  const [sim, setSim] = useState<SimState | null>(null);
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
  }, []);

  const seed = (key: string) =>
    seeds.has(key) ? <span className={styles.seedTag}>[seed]</span> : null;

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Backpressure infrastructure for Nostr</h1>
        <p className={styles.subtitle}>
          on-chain capacity · payment routing · relay hosting — base sepolia
        </p>
      </header>

      <div className={styles.grid}>
        {/* ── left column ── */}
        <div>
          {/* RELAYS */}
          <section className={styles.section} id="relays">
            <SectionHead label="relays" color="var(--color-relays)" />
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
          </section>

          {/* LIGHTNING */}
          <section className={styles.section} id="lightning">
            <SectionHead label="lightning" color="var(--color-lightning)" />
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
          </section>

          {/* AGENTS */}
          <section className={styles.section} id="agents">
            <SectionHead label="agents" color="var(--color-agents)" />
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
          </section>
        </div>

        {/* ── right column ── */}
        <div>
          {/* GATEWAY */}
          <section className={styles.section} id="gateway">
            <SectionHead label="gateway" color="var(--color-gateway)" />
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
          </section>

          {/* SIMULATOR */}
          <section className={styles.section} id="sim">
            <SectionHead label="simulator" color="var(--color-sim)" />
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
          </section>

          {/* DEPLOY */}
          <section className={styles.section} id="deploy">
            <SectionHead label="deploy" color="var(--color-deploy)" />
            <p className={styles.deployDesc}>
              1-click Nostr relay hosting on pura.xyz — sign in with NIP-07
            </p>
            <a href="/deploy" className={styles.deployCta}>
              deploy relay →
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
