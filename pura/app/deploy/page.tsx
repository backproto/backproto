"use client";

import { useState, useCallback, useEffect } from "react";
import s from "./deploy.module.css";

type AuthState =
  | { status: "unauthenticated" }
  | { status: "authenticating" }
  | { status: "authenticated"; pubkey: string };

interface RelayStatus {
  subdomain: string;
  relay_url: string;
  plan: string;
  relayName: string;
  relayDescription: string;
  storageUsedBytes: number;
  eventCount: number;
  customDomain: string | null;
  superfluidStreamId: string | null;
  createdAt: number;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    features: [
      "1 relay on pura.xyz subdomain",
      "100 MB storage",
      "10 allowed pubkeys",
      "50 events/min rate limit",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9/mo stream",
    features: [
      "5 GB storage",
      "Unlimited pubkeys",
      "Custom domain support",
      "On-chain relay registration",
      "Payment pool revenue sharing",
    ],
  },
  {
    id: "operator",
    name: "Operator",
    price: "$29/mo stream",
    features: [
      "50 GB storage",
      "Everything in Pro",
      "Multiple relay configs",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

export default function DeployPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "unauthenticated" });
  const [relay, setRelay] = useState<RelayStatus | null>(null);
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState("");
  const [provisioning, setProvisioning] = useState(false);

  const signIn = useCallback(async () => {
    setAuth({ status: "authenticating" });
    setError("");

    try {
      const nostr = (
        window as unknown as {
          nostr?: {
            getPublicKey(): Promise<string>;
            signEvent(e: unknown): Promise<unknown>;
          };
        }
      ).nostr;
      if (!nostr) {
        setError(
          "No Nostr extension found. Install nos2x, Alby, or another NIP-07 extension.",
        );
        setAuth({ status: "unauthenticated" });
        return;
      }

      const challengeRes = await fetch("/api/deploy/auth");
      const { id: challengeId, challenge } = await challengeRes.json();
      const pubkey = await nostr.getPublicKey();

      const event = await nostr.signEvent({
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["challenge", challenge]],
        content: "",
        pubkey,
      });

      const verifyRes = await fetch("/api/deploy/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, event }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || "Auth failed");
        setAuth({ status: "unauthenticated" });
        return;
      }

      const { pubkey: verifiedPubkey } = await verifyRes.json();
      setAuth({ status: "authenticated", pubkey: verifiedPubkey });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
      setAuth({ status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    fetch(`/api/deploy/status?pubkey=${auth.pubkey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setRelay(data);
      })
      .catch(() => {});
  }, [auth]);

  const provision = useCallback(async () => {
    if (auth.status !== "authenticated") return;
    setProvisioning(true);
    setError("");

    try {
      const res = await fetch("/api/deploy/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubkey: auth.pubkey, subdomain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Provisioning failed");
        return;
      }
      const statusRes = await fetch(
        `/api/deploy/status?pubkey=${auth.pubkey}`,
      );
      if (statusRes.ok) setRelay(await statusRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Provisioning failed");
    } finally {
      setProvisioning(false);
    }
  }, [auth, subdomain]);

  // Pre-auth view
  if (auth.status !== "authenticated") {
    return (
      <main className={s.main}>
        <div className={s.head}>
          <span style={{ color: "var(--color-deploy)" }}>── DEPLOY</span>
          <hr className={s.rule} />
        </div>

        <h1 className={s.title}>Deploy your Nostr relay</h1>
        <p className={s.subtitle}>
          Your personal relay in 60 seconds. No email, no password. Sign in
          with Nostr.
        </p>

        <div className={s.plans}>
          {PLANS.map((plan) => (
            <div key={plan.id} className={s.planCard}>
              <div className={s.planName}>{plan.name}</div>
              <div className={s.planPrice}>{plan.price}</div>
              <ul className={s.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={s.authBlock}>
          <button
            className={s.btn}
            onClick={signIn}
            disabled={auth.status === "authenticating"}
          >
            {auth.status === "authenticating"
              ? "signing in..."
              : "sign in with nostr →"}
          </button>
          {error && <p className={s.error}>{error}</p>}
        </div>
      </main>
    );
  }

  // Post-auth view
  return (
    <main className={s.main}>
      <div className={s.head}>
        <span style={{ color: "var(--color-deploy)" }}>── DEPLOY</span>
        <hr className={s.rule} />
      </div>

      <h1 className={s.title}>Your relay</h1>
      <p className={s.subtitle}>
        signed in as {auth.pubkey.slice(0, 8)}…{auth.pubkey.slice(-4)}
      </p>

      {relay ? (
        <>
          <div className={s.kvGrid}>
            <span className={s.kvLabel}>status</span>
            <span className={s.kvValue}>
              <span style={{ color: "var(--green)" }}>● online</span>
            </span>
            <span className={s.kvLabel}>events</span>
            <span className={s.kvValue}>
              {relay.eventCount.toLocaleString()}
            </span>
            <span className={s.kvLabel}>storage</span>
            <span className={s.kvValue}>
              {(relay.storageUsedBytes / 1024 / 1024).toFixed(1)} MB
            </span>
            <span className={s.kvLabel}>url</span>
            <span className={s.kvValue}>{relay.relay_url}</span>
            <span className={s.kvLabel}>plan</span>
            <span className={s.kvValue}>{relay.plan}</span>
            <span className={s.kvLabel}>name</span>
            <span className={s.kvValue}>{relay.relayName}</span>
            {relay.customDomain && (
              <>
                <span className={s.kvLabel}>domain</span>
                <span className={s.kvValue}>{relay.customDomain}</span>
              </>
            )}
            <span className={s.kvLabel}>created</span>
            <span className={s.kvValue}>
              {new Date(relay.createdAt).toLocaleDateString()}
            </span>
          </div>
        </>
      ) : (
        <div className={s.provisionBlock}>
          <div className={s.subdomainRow}>
            <input
              type="text"
              className={s.input}
              placeholder="yourname"
              value={subdomain}
              onChange={(e) =>
                setSubdomain(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
            />
            <span className={s.suffix}>.pura.xyz</span>
            <button
              className={s.btn}
              onClick={provision}
              disabled={provisioning || subdomain.length < 3}
            >
              {provisioning ? "creating..." : "create relay →"}
            </button>
          </div>
          {error && <p className={s.error}>{error}</p>}
        </div>
      )}
    </main>
  );
}
