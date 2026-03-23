import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  JobIntent,
  VerificationReceipt,
  PriceSignal,
  SettlementReceipt,
  CapacityAttestationWithMetrics,
  SignedAttestation,
  CompletionReceipt,
} from "../src/schemas.js";

const SCHEMAS_DIR = resolve(__dirname, "../schemas");

function loadSchema(name: string) {
  const raw = readFileSync(resolve(SCHEMAS_DIR, `${name}.schema.json`), "utf-8");
  return JSON.parse(raw);
}

describe("JSON schemas", () => {
  it("loads all 5 schemas without error", () => {
    const names = [
      "job-intent",
      "capacity-attestation",
      "verification-receipt",
      "price-signal",
      "settlement-receipt",
    ];
    for (const name of names) {
      const schema = loadSchema(name);
      expect(schema.$id).toContain(name);
      expect(schema.type).toBe("object");
      expect(schema.required).toBeDefined();
      expect(schema.required.length).toBeGreaterThan(0);
    }
  });

  it("job-intent schema has correct required fields", () => {
    const schema = loadSchema("job-intent");
    expect(schema.required).toEqual(
      expect.arrayContaining(["id", "source", "kind", "input", "maxBudget", "timestamp"]),
    );
    expect(schema.properties.kind.minimum).toBe(5000);
    expect(schema.properties.kind.maximum).toBe(5999);
  });

  it("capacity-attestation schema matches SignedAttestation fields", () => {
    const schema = loadSchema("capacity-attestation");
    expect(schema.required).toEqual(
      expect.arrayContaining(["taskTypeId", "sink", "capacity", "timestamp", "nonce", "signature"]),
    );
  });

  it("verification-receipt schema has dual signatures", () => {
    const schema = loadSchema("verification-receipt");
    expect(schema.required).toEqual(
      expect.arrayContaining(["sinkSignature", "sourceSignature"]),
    );
  });

  it("price-signal schema has pricing components", () => {
    const schema = loadSchema("price-signal");
    expect(schema.required).toEqual(
      expect.arrayContaining(["taskTypeId", "sink", "price", "baseFee", "timestamp"]),
    );
    expect(schema.properties.utilizationBps.maximum).toBe(10000);
  });

  it("settlement-receipt schema supports all rails", () => {
    const schema = loadSchema("settlement-receipt");
    expect(schema.properties.rail.enum).toEqual(["SUPERFLUID", "LIGHTNING", "DIRECT"]);
  });
});

describe("TypeScript types", () => {
  it("JobIntent type is assignable", () => {
    const job: JobIntent = {
      id: "0x0000000000000000000000000000000000000000000000000000000000000001",
      source: "0x1234567890abcdef1234567890abcdef12345678",
      kind: 5002,
      input: "translate this to french",
      maxBudget: 1000000000000000n,
      timestamp: 1700000000,
    };
    expect(job.kind).toBe(5002);
  });

  it("VerificationReceipt type is assignable", () => {
    const receipt: VerificationReceipt = {
      taskTypeId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      sink: "0x1234567890abcdef1234567890abcdef12345678",
      source: "0xabcdef1234567890abcdef1234567890abcdef12",
      taskId: "0x0000000000000000000000000000000000000000000000000000000000000002",
      timestamp: 1700000000n,
      sinkSignature: "0xabc",
      sourceSignature: "0xdef",
    };
    expect(receipt.sink).toBeDefined();
  });

  it("PriceSignal type is assignable", () => {
    const signal: PriceSignal = {
      taskTypeId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      sink: "0x1234567890abcdef1234567890abcdef12345678",
      price: 1000000000000000n,
      baseFee: 1000000000000000n,
      timestamp: 1700000000,
    };
    expect(signal.price).toBe(1000000000000000n);
  });

  it("SettlementReceipt type is assignable", () => {
    const receipt: SettlementReceipt = {
      jobId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      provider: "0x1234567890abcdef1234567890abcdef12345678",
      amount: 500000000000000000n,
      rail: "LIGHTNING",
      timestamp: 1700000000,
    };
    expect(receipt.rail).toBe("LIGHTNING");
  });

  it("CapacityAttestationWithMetrics extends SignedAttestation fields", () => {
    const att: CapacityAttestationWithMetrics = {
      taskTypeId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      sink: "0x1234567890abcdef1234567890abcdef12345678",
      capacity: 100n,
      timestamp: 1700000000n,
      nonce: 0n,
      signature: "0xabc",
      domain: "NOSTR_DVM",
      rawMetrics: { throughput: 50, latencyMs: 3000, errorRateBps: 100 },
    };
    expect(att.rawMetrics?.throughput).toBe(50);
  });

  it("SignedAttestation re-export works", () => {
    const att: SignedAttestation = {
      taskTypeId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      sink: "0x1234567890abcdef1234567890abcdef12345678",
      capacity: 100n,
      timestamp: 1700000000n,
      nonce: 0n,
      signature: "0xabc",
    };
    expect(att.signature).toBe("0xabc");
  });

  it("CompletionReceipt re-export works", () => {
    const receipt: CompletionReceipt = {
      taskTypeId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      sink: "0x1234567890abcdef1234567890abcdef12345678",
      source: "0xabcdef1234567890abcdef1234567890abcdef12",
      taskId: "0x0000000000000000000000000000000000000000000000000000000000000002",
      timestamp: 1700000000n,
    };
    expect(receipt.source).toBeDefined();
  });
});
