# pura-bpe

Backpressure economics as a Rust library. EWMA smoothing, congestion pricing, Boltzmann routing weights, quality scoring, and max-weight scheduling.

Zero external dependencies. `#![no_std]` compatible. Fixed-point BPS arithmetic matching on-chain contracts.

## Usage

```rust
use pura_bpe::ewma::{ewma, DEFAULT_ALPHA_BPS};
use pura_bpe::pricing::{compute_dynamic_price, adjust_base_fee, ADJUSTMENT_RATE_BPS};
use pura_bpe::scoring::compute_weight;
use pura_bpe::quality::{compute_quality, report_latency, update_quality};
use pura_bpe::types::{PricingInputs, QualityMetrics, BPS};

// EWMA smoothing (α = 0.3)
let smoothed = ewma(800, Some(1000), DEFAULT_ALPHA_BPS); // 940

// Congestion pricing: price = baseFee × (1 + γ × u / (1 − u))
let price = compute_dynamic_price(&PricingInputs {
    queue_depth: 50,
    smoothed_capacity: 100,
    base_fee_msats: 100,
    gamma_bps: 10_000, // γ = 1.0
});
// At 50% utilization: 100 × 2.0 = 200 msats

// EIP-1559 style base fee adjustment (±12.5%)
let new_fee = adjust_base_fee(100, 200, 100, ADJUSTMENT_RATE_BPS); // congested → 112

// Quality scoring (4 components, weights 40/20/20/20)
let mut metrics = QualityMetrics::default();
report_latency(&mut metrics, 1500);
update_quality(&mut metrics);

// Routing weight: capacity × quality × price_factor
let weight = compute_weight(1000, BPS, 100, 1000);
```

## Modules

- `ewma` — Exponential weighted moving average (Jacobson 1988)
- `pricing` — Congestion pricing + EIP-1559 base fee adjustment
- `quality` — 4-component quality scoring (completion, latency, error, satisfaction)
- `scoring` — Routing weights, coefficient of variation, adaptive exploration
- `routing` — Max-weight scheduler with ε-greedy exploration, Boltzmann blending

## Design

All arithmetic uses u64 with basis-point scaling (BPS = 10,000). This matches the Solidity contracts exactly and avoids floating-point semantics differences across platforms.

The crate uses `#![no_std]` by default (with `extern crate alloc` for `Vec` in the routing module). Enable the `std` feature if you want it.

## License

MIT
