# AID Station — Nostr relay capacity dashboard

Live at [aidstation.app](https://aidstation.app).

AID Station reads relay capacity from Backproto's on-chain registry and displays it in real time. Relay operators register their spare capacity (events/sec, storage, bandwidth), and the protocol distributes payment streams proportional to verified headroom.

## Run locally

```bash
npm install
npm run sync-sdk
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

## Seed demo data

```bash
export OPERATOR_PRIVATE_KEY=0x...
npm run setup
```

This registers three demo relays on Base Sepolia and joins the write pool.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `CHAIN_ID` | `84532` | Base Sepolia (84532) or Base (8453) |
| `RPC_URL` | `https://sepolia.base.org` | JSON-RPC endpoint |
| `OPERATOR_PRIVATE_KEY` | — | Private key for setup script |

## Architecture

Same stack as all Backproto reference products: Next.js 16 + viem + @backproto/sdk + CSS Modules. The `/api/state` endpoint reads relay data from the CapacityRegistry and PaymentPool contracts, and the client polls every 30 seconds.

## SDK functions used

- `relay.registerRelay` — register a relay with initial capacity
- `relay.joinRelayPool` — join a payment pool (write/read/store)
- `relay.getRelayOperator` — look up who operates a relay
- `relay.getCompositeCapacity` — get smoothed composite capacity score
- `relay.getAntiSpamMinimum` — get minimum payment floor per pool type
