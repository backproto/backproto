//! EWMA — Exponential Weighted Moving Average.
//!
//! Ported from `nvm/src/capacity/ewma.ts` and `CapacityRegistry.sol`.
//!
//! Formula: `C_smooth = α × C_raw + (1 − α) × C_smooth_prev`
//!
//! All arithmetic in BPS (α = 3000 means 0.30).
//! Reference: Jacobson (1988), "Congestion avoidance and control."

use crate::types::BPS;

/// Default smoothing factor: α = 0.3 (3000 BPS).
/// Matches `CapacityRegistry.sol` EWMA_ALPHA_BPS.
pub const DEFAULT_ALPHA_BPS: u64 = 3_000;

/// Compute one EWMA step in fixed-point BPS arithmetic.
///
/// If `prev` is `None` (first observation), returns `raw`.
///
/// ```
/// use pura_bpe::ewma::{ewma, DEFAULT_ALPHA_BPS};
///
/// // First observation returns raw
/// assert_eq!(ewma(1000, None, DEFAULT_ALPHA_BPS), 1000);
///
/// // Second observation blends: 0.3 * 800 + 0.7 * 1000 = 940
/// assert_eq!(ewma(800, Some(1000), DEFAULT_ALPHA_BPS), 940);
/// ```
pub fn ewma(raw: u64, prev: Option<u64>, alpha_bps: u64) -> u64 {
    match prev {
        None => raw,
        Some(p) => {
            // α × raw + (1 − α) × prev, all in BPS
            let weighted_raw = alpha_bps * raw;
            let weighted_prev = (BPS - alpha_bps) * p;
            (weighted_raw + weighted_prev) / BPS
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_observation_returns_raw() {
        assert_eq!(ewma(500, None, DEFAULT_ALPHA_BPS), 500);
        assert_eq!(ewma(0, None, DEFAULT_ALPHA_BPS), 0);
        assert_eq!(ewma(10_000, None, DEFAULT_ALPHA_BPS), 10_000);
    }

    #[test]
    fn blends_correctly() {
        // 0.3 * 800 + 0.7 * 1000 = 240 + 700 = 940
        assert_eq!(ewma(800, Some(1000), DEFAULT_ALPHA_BPS), 940);

        // 0.3 * 1200 + 0.7 * 1000 = 360 + 700 = 1060
        assert_eq!(ewma(1200, Some(1000), DEFAULT_ALPHA_BPS), 1060);
    }

    #[test]
    fn alpha_zero_ignores_new_value() {
        assert_eq!(ewma(999, Some(500), 0), 500);
    }

    #[test]
    fn alpha_full_takes_new_value() {
        assert_eq!(ewma(999, Some(500), BPS), 999);
    }

    #[test]
    fn converges_over_repeated_observations() {
        let mut smoothed = 1000u64;
        for _ in 0..20 {
            smoothed = ewma(500, Some(smoothed), DEFAULT_ALPHA_BPS);
        }
        // Should converge close to 500
        assert!(smoothed >= 498 && smoothed <= 502, "got {smoothed}");
    }
}
