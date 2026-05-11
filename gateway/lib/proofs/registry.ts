import type { IssuerAdapter } from "./types";
import { worldIdAdapter } from "./world-id";

const adapters = new Map<string, IssuerAdapter>([[worldIdAdapter.issuerId, worldIdAdapter]]);

export function getIssuerAdapter(issuerId: string): IssuerAdapter | null {
  return adapters.get(issuerId) ?? null;
}

export function listIssuerAdapters(): string[] {
  return Array.from(adapters.keys());
}

export function registerIssuerAdapter(adapter: IssuerAdapter): void {
  adapters.set(adapter.issuerId, adapter);
}
