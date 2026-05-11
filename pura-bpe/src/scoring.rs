//! Scoring functions for the BPE routing algorithm.
//!
//! Ported from `nvm/src/routing/scoring.ts` and `BackpressurePool.sol`.
//!
//! Weight computation:
//!   `weight = effective_capacity × price_factor`
//!   `effective_capacity = smoothedCapacity × qualityScore / BPS`
//!   `price_factor = BPS / (BPS + priceMsats × BPS / priceNormalization)`
//!
//! Exploration blending:
//!   `blended = (1 − ε) × boltzmann + ε × uniform`
//! where ε adapts based on quality score volatility (coefficient of variation).

use crate::types::BPS;

/// Compute the BPE routing weight for a single agent.
///
/// All values in BPS fixed-point. Returns weight in BPS.
///
/// ```
/// use pura_bpe::scoring::compute_weight;
///
/// // capacity=1000, quality=10000 (100%), price=0, normalization=1000
/// // effective = 1000 * 10000 / 10000 = 1000
/// // price_factor = 10000 / (10000 + 0) = 10000
/// // weight = 1000 * 10000 / 10000 = 1000
/// assert_eq!(compute_weight(1000, 10_000, 0, 1000), 1000);
/// ```
pub fn compute_weight(
    smoothed_capacity: u64,
    quality_score_bps: u64,
    price_msats: u64,
    price_normalization_msats: u64,
) -> u64 {
    let effective_capacity = (smoothed_capacity * quality_score_bps) / BPS;

    let price_factor = if price_normalization_msats == 0 {
        BPS
    } else {
        let price_scaled = (price_msats * BPS) / price_normalization_msats;
        BPS * BPS / (BPS + price_scaled)
    };

    (effective_capacity * price_factor) / BPS
}

/// Coefficient of variation: std_dev / mean, returned in BPS.
///
/// Used to measure quality score volatility for adaptive exploration.
/// Returns 0 if fewer than 2 values or mean is 0.
///
/// ```
/// use pura_bpe::scoring::coefficient_of_variation;
///
/// // All same values: CV = 0
/// assert_eq!(coefficient_of_variation(&[5000, 5000, 5000]), 0);
/// ```
pub fn coefficient_of_variation(values: &[u64]) -> u64 {
    if values.len() < 2 {
        return 0;
    }

    let n = values.len() as u64;
    let sum: u64 = values.iter().sum();
    let mean = sum / n;

    if mean == 0 {
        return 0;
    }

    // Variance = Σ(v - mean)² / n, computed carefully to avoid overflow
    let variance_sum: u64 = values.iter().map(|&v| {
        let diff = v.abs_diff(mean);
        diff * diff
    }).sum();
    let variance = variance_sum / n;

    // CV = sqrt(variance) / mean, in BPS
    // isqrt approximation: Newton's method
    let std_dev = isqrt(variance);

    (std_dev * BPS) / mean
}

/// Compute effective exploration rate based on quality score volatility.
///
/// Base rate (default 500 BPS = 5%). If CV > threshold, rate doubles (capped at max).
/// Matches `BackpressurePool.sol` exploration rate adaptation.
///
/// ```
/// use pura_bpe::scoring::adaptive_exploration_rate;
///
/// // Low volatility: returns base rate
/// assert_eq!(adaptive_exploration_rate(&[5000, 5000, 5000], 500, 2000, 3000), 500);
///
/// // High volatility: returns doubled base rate
/// assert_eq!(adaptive_exploration_rate(&[1000, 9000, 1000], 500, 2000, 3000), 1000);
/// ```
pub fn adaptive_exploration_rate(
    quality_scores: &[u64],
    base_rate_bps: u64,
    max_rate_bps: u64,
    volatility_threshold_bps: u64,
) -> u64 {
    let cv = coefficient_of_variation(quality_scores);
    if cv > volatility_threshold_bps {
        let doubled = base_rate_bps * 2;
        if doubled > max_rate_bps { max_rate_bps } else { doubled }
    } else {
        base_rate_bps
    }
}

/// Integer square root via Newton's method.
fn isqrt(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = x.div_ceil(2);
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn weight_zero_price() {
        // No price cost: weight = effective_capacity
        assert_eq!(compute_weight(1000, BPS, 0, 1000), 1000);
    }

    #[test]
    fn weight_with_price() {
        // price = normalization: price_factor = BPS / (BPS + BPS) = 5000
        // weight = 1000 * 5000 / 10000 = 500
        assert_eq!(compute_weight(1000, BPS, 1000, 1000), 500);
    }

    #[test]
    fn weight_with_quality_penalty() {
        // quality = 50%: effective = 1000 * 5000 / 10000 = 500
        // price = 0: price_factor = BPS
        // weight = 500
        assert_eq!(compute_weight(1000, 5_000, 0, 1000), 500);
    }

    #[test]
    fn weight_zero_capacity() {
        assert_eq!(compute_weight(0, BPS, 100, 1000), 0);
    }

    #[test]
    fn cv_uniform_values() {
        assert_eq!(coefficient_of_variation(&[5000, 5000, 5000]), 0);
    }

    #[test]
    fn cv_single_value() {
        assert_eq!(coefficient_of_variation(&[5000]), 0);
    }

    #[test]
    fn cv_empty() {
        assert_eq!(coefficient_of_variation(&[]), 0);
    }

    #[test]
    fn cv_high_spread() {
        // [1000, 9000] → mean=5000, variance=(4000²+4000²)/2=16000000, std=4000
        // CV = 4000 * 10000 / 5000 = 8000
        let cv = coefficient_of_variation(&[1000, 9000]);
        assert_eq!(cv, 8000);
    }

    #[test]
    fn adaptive_rate_low_volatility() {
        assert_eq!(adaptive_exploration_rate(&[5000, 5000, 5000], 500, 2000, 3000), 500);
    }

    #[test]
    fn adaptive_rate_high_volatility() {
        assert_eq!(adaptive_exploration_rate(&[1000, 9000, 1000], 500, 2000, 3000), 1000);
    }

    #[test]
    fn adaptive_rate_capped_at_max() {
        // Very high volatility, but doubled rate exceeds max
        assert_eq!(adaptive_exploration_rate(&[1000, 9000], 1500, 2000, 3000), 2000);
    }

    #[test]
    fn isqrt_exact() {
        assert_eq!(isqrt(0), 0);
        assert_eq!(isqrt(1), 1);
        assert_eq!(isqrt(4), 2);
        assert_eq!(isqrt(9), 3);
        assert_eq!(isqrt(16000000), 4000);
    }
}
