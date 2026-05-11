//! Congestion pricing — price rises with utilization.
//!
//! Ported from `nvm/src/routing/pricing.ts` and `PricingCurve.sol`.
//!
//! Congestion formula:
//!   `price = baseFee × (1 + γ × u / (1 − u))`
//! where `u = queueDepth / smoothedCapacity` (utilization).
//!
//! Base fee adjustment (EIP-1559 style):
//!   if demand > capacity → baseFee += 12.5%
//!   else → baseFee -= 12.5% (floored at MIN_BASE_FEE)

use crate::types::{BPS, PricingInputs};

/// Maximum utilization in BPS (9900 = 99%). Matches `PricingCurve.sol` MAX_UTILIZATION.
pub const MAX_UTILIZATION_BPS: u64 = 9_900;

/// Minimum base fee in msats. Prevents fee from hitting zero.
pub const MIN_BASE_FEE_MSATS: u64 = 1;

/// Default adjustment rate in BPS (1250 = 12.5%). Matches `PricingCurve.sol` ADJUSTMENT_RATE_BPS.
pub const ADJUSTMENT_RATE_BPS: u64 = 1_250;

/// Compute the dynamic price for a single job.
///
/// `price = baseFee × (1 + γ × u / (1 − u))`
///
/// Utilization is capped at 99% to avoid division by zero.
/// All arithmetic in BPS fixed-point.
///
/// ```
/// use pura_bpe::pricing::compute_dynamic_price;
/// use pura_bpe::types::PricingInputs;
///
/// let inputs = PricingInputs {
///     queue_depth: 0,
///     smoothed_capacity: 100,
///     base_fee_msats: 100,
///     gamma_bps: 10_000, // γ = 1.0
/// };
/// // Zero utilization: price = baseFee × 1 = 100
/// assert_eq!(compute_dynamic_price(&inputs), 100);
/// ```
pub fn compute_dynamic_price(inputs: &PricingInputs) -> u64 {
    if inputs.smoothed_capacity == 0 {
        return inputs.base_fee_msats;
    }

    // Utilization in BPS: u = (queueDepth * BPS) / smoothedCapacity
    let mut util_bps = (inputs.queue_depth * BPS) / inputs.smoothed_capacity;
    if util_bps > MAX_UTILIZATION_BPS {
        util_bps = MAX_UTILIZATION_BPS;
    }

    // Congestion multiplier in BPS: BPS + γ × u / (BPS − u)
    // = BPS + (gamma_bps × util_bps) / (BPS − util_bps)
    let denominator = BPS - util_bps;
    let congestion_bps = BPS + (inputs.gamma_bps * util_bps) / denominator;

    // price = baseFee × congestion / BPS
    (inputs.base_fee_msats * congestion_bps) / BPS
}

/// Adjust base fee for the next epoch (EIP-1559 style).
///
/// If `epoch_demand > total_capacity`: increase by `adjustment_bps` (default 12.5%).
/// Otherwise: decrease by `adjustment_bps`, floored at `MIN_BASE_FEE_MSATS`.
///
/// ```
/// use pura_bpe::pricing::{adjust_base_fee, ADJUSTMENT_RATE_BPS, MIN_BASE_FEE_MSATS};
///
/// // Congested: 100 × 1.125 = 112 (rounded)
/// assert_eq!(adjust_base_fee(100, 200, 100, ADJUSTMENT_RATE_BPS), 112);
///
/// // Under capacity: 100 × 0.875 = 87 (rounded)
/// assert_eq!(adjust_base_fee(100, 50, 100, ADJUSTMENT_RATE_BPS), 87);
/// ```
pub fn adjust_base_fee(
    current_fee_msats: u64,
    epoch_demand: u64,
    total_capacity: u64,
    adjustment_bps: u64,
) -> u64 {
    if epoch_demand > total_capacity && total_capacity > 0 {
        // Congested — increase
        (current_fee_msats * (BPS + adjustment_bps)) / BPS
    } else {
        // Under capacity — decrease
        let decreased = (current_fee_msats * (BPS - adjustment_bps)) / BPS;
        if decreased < MIN_BASE_FEE_MSATS {
            MIN_BASE_FEE_MSATS
        } else {
            decreased
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::PricingInputs;

    #[test]
    fn zero_utilization_returns_base_fee() {
        let inputs = PricingInputs {
            queue_depth: 0,
            smoothed_capacity: 100,
            base_fee_msats: 100,
            gamma_bps: BPS,
        };
        assert_eq!(compute_dynamic_price(&inputs), 100);
    }

    #[test]
    fn zero_capacity_returns_base_fee() {
        let inputs = PricingInputs {
            queue_depth: 50,
            smoothed_capacity: 0,
            base_fee_msats: 100,
            gamma_bps: BPS,
        };
        assert_eq!(compute_dynamic_price(&inputs), 100);
    }

    #[test]
    fn fifty_percent_utilization() {
        // u = 0.5, γ = 1.0: multiplier = 1 + 1.0 × 0.5 / 0.5 = 2.0
        let inputs = PricingInputs {
            queue_depth: 50,
            smoothed_capacity: 100,
            base_fee_msats: 100,
            gamma_bps: BPS,
        };
        assert_eq!(compute_dynamic_price(&inputs), 200);
    }

    #[test]
    fn high_utilization_capped() {
        // u = 100/100 = 100%, capped at 99%
        // multiplier = 1 + 1.0 × 0.99 / 0.01 = 100.0
        let inputs = PricingInputs {
            queue_depth: 100,
            smoothed_capacity: 100,
            base_fee_msats: 100,
            gamma_bps: BPS,
        };
        assert_eq!(compute_dynamic_price(&inputs), 10000);
    }

    #[test]
    fn adjustment_congested_increases() {
        // 100 × (10000 + 1250) / 10000 = 100 × 1.125 = 112.5 → 112
        assert_eq!(adjust_base_fee(100, 200, 100, ADJUSTMENT_RATE_BPS), 112);
    }

    #[test]
    fn adjustment_under_capacity_decreases() {
        // 100 × (10000 - 1250) / 10000 = 100 × 0.875 = 87.5 → 87
        assert_eq!(adjust_base_fee(100, 50, 100, ADJUSTMENT_RATE_BPS), 87);
    }

    #[test]
    fn adjustment_floors_at_min() {
        assert_eq!(
            adjust_base_fee(1, 0, 100, ADJUSTMENT_RATE_BPS),
            MIN_BASE_FEE_MSATS
        );
    }

    #[test]
    fn price_scales_with_gamma() {
        // γ = 0.5 (5000 BPS), u = 50%: multiplier = 1 + 0.5 × 0.5 / 0.5 = 1.5
        let inputs = PricingInputs {
            queue_depth: 50,
            smoothed_capacity: 100,
            base_fee_msats: 100,
            gamma_bps: 5_000,
        };
        assert_eq!(compute_dynamic_price(&inputs), 150);
    }
}
