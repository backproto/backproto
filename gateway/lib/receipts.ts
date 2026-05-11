import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from "crypto";

export interface ChatReceipt {
  receipt_type: "pura.chat_completion";
  proof_class: "unknown" | "unique_human";
  cascade_depth: number;
  final_provider: string;
  human_reviewed: boolean;
  reviewer_proof_class?: "unique_human";
  cost_sats: number;
  timestamp: string;
  request_hash: string;
  response_hash: string;
}

const RECEIPT_KID = process.env.PURA_RECEIPT_KID ?? "pura-gateway-v1";

let cachedPrivateKey: KeyObject | null = null;
let cachedPublicKey: KeyObject | null = null;

function base64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function getSigningKeys(): { privateKey: KeyObject; publicKey: KeyObject } {
  if (cachedPrivateKey && cachedPublicKey) {
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  const envPrivate = process.env.PURA_RECEIPT_PRIVATE_KEY;
  const envPublic = process.env.PURA_RECEIPT_PUBLIC_KEY;

  if (envPrivate && envPublic) {
    cachedPrivateKey = createPrivateKey(envPrivate);
    cachedPublicKey = createPublicKey(envPublic);
    return { privateKey: cachedPrivateKey, publicKey: cachedPublicKey };
  }

  const pair = generateKeyPairSync("ed25519");
  cachedPrivateKey = pair.privateKey;
  cachedPublicKey = pair.publicKey;
  return { privateKey: pair.privateKey, publicKey: pair.publicKey };
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function createReceiptToken(receipt: ChatReceipt): string {
  const { privateKey } = getSigningKeys();
  const header = {
    alg: "EdDSA",
    typ: "JWT",
    kid: RECEIPT_KID,
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(receipt));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(null, Buffer.from(signingInput, "utf8"), privateKey);

  return `${signingInput}.${base64Url(signature)}`;
}

export function verifyReceiptToken(token: string): { valid: boolean; payload?: ChatReceipt; error?: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "invalid_token_format" };
  }

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = decodeBase64Url(encodedSig);

  const { publicKey } = getSigningKeys();
  const ok = verify(null, Buffer.from(signingInput, "utf8"), publicKey, signature);
  if (!ok) return { valid: false, error: "invalid_signature" };

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload).toString("utf8")) as ChatReceipt;
    return { valid: true, payload };
  } catch {
    return { valid: false, error: "invalid_payload" };
  }
}

export function getReceiptPublicKeyPem(): string {
  const { publicKey } = getSigningKeys();
  return publicKey.export({ type: "spki", format: "pem" }).toString();
}
