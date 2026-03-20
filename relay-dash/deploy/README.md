# Relay.Gold deployment

Instructions for running a live Nostr relay at `wss://relay.gold` and the
multi-tenant hosting platform.

## VPS

**Recommended:** Hetzner Cloud CAX11 (ARM64) — €3.79/mo.
2 vCPU, 4 GB RAM, 40 GB disk, 20 TB transfer.

Point DNS before provisioning:

```
relay.gold.     A   <VPS_IP>
*.relay.gold.   A   <VPS_IP>
```

## Software stack

| Component | Purpose |
|-----------|---------|
| strfry    | Nostr relay (C++, LMDB, negentropy sync) |
| Caddy     | Reverse proxy + automatic TLS (wildcard via DNS challenge) |
| Node.js   | WS proxy for multi-tenant subdomain routing (Phase 3) |

## Install strfry

```bash
apt update && apt install -y git build-essential libyaml-cpp-dev zlib1g-dev liblmdb-dev libflatbuffers-dev libsecp256k1-dev libzstd-dev
git clone https://github.com/hoytech/strfry.git
cd strfry && make setup-golpe && make -j$(nproc)
cp strfry /usr/local/bin/
mkdir -p /var/lib/strfry/data /etc/strfry
cp strfry.conf.example /etc/strfry/strfry.conf   # from this directory
```

### systemd service

strfry ships a unit file. Copy it and enable:

```bash
cp strfry/contrib/strfry.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now strfry
```

## Install Caddy

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy

# For wildcard TLS with Hetzner DNS challenge, install the plugin:
caddy add-package github.com/caddy-dns/hetzner
```

Copy `Caddyfile.example` to `/etc/caddy/Caddyfile`, set `HETZNER_DNS_TOKEN`
in the environment, then:

```bash
systemctl restart caddy
```

## Verify

```bash
# NIP-11 info document
curl -H "Accept: application/nostr+json" https://relay.gold

# WebSocket connection
websocat wss://relay.gold
```

## Register on-chain

After the relay is running, register it on Base Sepolia:

```bash
cd relay-dash
OPERATOR_PRIVATE_KEY=0x... npm run setup
```

For mainnet, set `CHAIN_ID=8453` and `RPC_URL` to a Base mainnet RPC.
