//! Quality scoring — 4-component weighted composite.
//!
//! Ported from `QualityOracle.sol`.
//!
//! Components and weights (sum to BPS = 10_000):
//!   - Completion rate: 40% (4000 BPS)
//!   - Latency: 20% (2000 BPS) — linear decay from BPS at 0ms to 0 at LATENCY_MAX_MS
//!   - Error rate: 20% (2000 BPS) — BPS minus error_rate_bps
//!   - Satisfaction: 20% (2000 BPS) — direct BPS value

use crate::types::{BPS, QualityMetrics};
use crate::ewma::DEFAULT_ALPHA_BPS;

/// Quality scoring weights (must sum to BPS).
pub const WEIGHT_COMPLETION: u64 = 4_000;
pub const WEIGHT_LATENCY: u64 = 2_000;
pub const WEIGHT_ERROR: u64 = 2_000;
pub const WEIGHT_SATISFACTION: u64 = 2_000;

/// At this latency (ms), the latency component equals 50% of BPS.
pub const LATENCY_REFERENCE_MS: u64 = 2_000;

/// Beyond this latency (ms), the latency component is 0.
pub const LATENCY_MAX_MS: u64 = 10_000;

/// Quality score below this threshold triggers slashing (3000 BPS = 30%).
pub const SLASH_QUALITY_THRESHOLD_BPS: u64 = 3_000;

/// Minimum observations before quality score is considered meaningful.
pub const MIN_OBSERVATIONS: u64 = 5;

/// Compute the latency component. Linear decay from BPS at 0ms to 0 at LATENCY_MAX_MS.
fn latency_component(avg_latency_ms: u64) -> u64 {
    if avg_latency_ms >= LATENCY_MAX_MS {
        return 0;
    }
    ((LATENCY_MAX_MS - avg_latency_ms) * BPS) / LATENCY_MAX_MS
}

/// Compute the error component. BPS at 0 errors, decays linearly.
fn error_component(error_rate_bps: u64) -> u64 {
    BPS.saturating_sub(error_rate_bps)
}

/// Compute the composite quality score from metrics.
///
/// Returns the quality score in BPS (0..=10_000).
///
/// ```
/// use pura_bpe::quality::compute_quality;
/// use pura_bpe::types::QualityMetrics;
///
/// let metrics = QualityMetrics::default(); // perfect scores
/// assert_eq!(compute_quality(&metrics), 10_000);
/// ```
pub fn compute_quality(metrics: &QualityMetrics) -> u64 {
    let lat = latency_component(metrics.avg_latency_ms);
    let err = error_component(metrics.error_rate_bps);

    let score = (WEIGHT_COMPLETION * metrics.completion_rate_bps
        + WEIGHT_LATENCY * lat
        + WEIGHT_ERROR * err
        + WEIGHT_SATISFACTION * metrics.satisfaction_bps)
        / BPS;

    if score > BPS { BPS } else { score }
}

/// Report a latency observation and update metrics in-place.
/// Uses EWMA smoothing matching `QualityOracle.sol`.
pub fn report_latency(metrics: &mut QualityMetrics, latency_ms: u64) {
    metrics.total_tasks += 1;

    if metrics.avg_latency_ms == 0 && metrics.total_tasks == 1 {
        metrics.avg_latency_ms = latency_ms;
    } else {
        metrics.avg_latency_ms = crate::ewma::ewma(
            latency_ms,
            Some(metrics.avg_latency_ms),
            DEFAULT_ALPHA_BPS,
        );
    }
}

/// Report an error and update metrics in-place.
pub fn report_error(metrics: &mut QualityMetrics) {
    metrics.total_errors += 1;
    if metrics.total_tasks > 0 {
        metrics.error_rate_bps = (metrics.total_errors * BPS) / metrics.total_tasks;
    }
}

/// Recompute the composite quality score and store it in metrics.
pub fn update_quality(metrics: &mut QualityMetrics) {
    metrics.quality_score_bps = compute_quality(metrics);
}

/// Check whether the agent should be slashed for low quality.
pub fn should_slash(metrics: &QualityMetrics) -> bool {
    metrics.quality_score_bps < SLASH_QUALITY_THRESHOLD_BPS
        && metrics.total_tasks >= MIN_OBSERVATIONS
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::QualityMetrics;

    #[test]
    fn perfect_metrics_score_is_bps() {
        let m = QualityMetrics::default();
        assert_eq!(compute_quality(&m), BPS);
    }

    #[test]
    fn max_latency_zeroes_latency_component() {
        let m = QualityMetrics {
            avg_latency_ms: LATENCY_MAX_MS,
            ..Default::default()
        };
        // 40% × 10000 + 20% × 0 + 20% × 10000 + 20% × 10000 = 8000
        assert_eq!(compute_quality(&m), 8_000);
    }

    #[test]
    fn full_errors_zeroes_error_component() {
        let m = QualityMetrics {
            error_rate_bps: BPS,
            ..Default::default()
        };
        // 40% × 10000 + 20% × 10000 + 20% × 0 + 20% × 10000 = 8000
        assert_eq!(compute_quality(&m), 8_000);
    }

    #[test]
    fn zero_completion_rate() {
        let m = QualityMetrics {
            completion_rate_bps: 0,
            ..Default::default()
        };
        // 40% × 0 + 20% × 10000 + 20% × 10000 + 20% × 10000 = 6000
        assert_eq!(compute_quality(&m), 6_000);
    }

    #[test]
    fn worst_possible_score() {
        let m = QualityMetrics {
            completion_rate_bps: 0,
            avg_latency_ms: LATENCY_MAX_MS,
            error_rate_bps: BPS,
            satisfaction_bps: 0,
            quality_score_bps: 0,
            total_tasks: 10,
            total_errors: 10,
        };
        assert_eq!(compute_quality(&m), 0);
    }

    #[test]
    fn report_latency_ewma_smoothing() {
        let mut m = QualityMetrics::default();
        report_latency(&mut m, 1000);
        assert_eq!(m.avg_latency_ms, 1000);
        assert_eq!(m.total_tasks, 1);

        report_latency(&mut m, 2000);
        // 0.3 * 2000 + 0.7 * 1000 = 600 + 700 = 1300
        assert_eq!(m.avg_latency_ms, 1300);
        assert_eq!(m.total_tasks, 2);
    }

    #[test]
    fn report_error_updates_rate() {
        let mut m = QualityMetrics {
            total_tasks: 10,
            ..Default::default()
        };
        report_error(&mut m);
        // 1/10 = 1000 BPS
        assert_eq!(m.error_rate_bps, 1_000);
        assert_eq!(m.total_errors, 1);
    }

    #[test]
    fn slash_threshold() {
        let bad = QualityMetrics {
            quality_score_bps: 2_000,
            total_tasks: 10,
            ..Default::default()
        };
        assert!(should_slash(&bad));

        let good = QualityMetrics {
            quality_score_bps: 5_000,
            total_tasks: 10,
            ..Default::default()
        };
        assert!(!should_slash(&good));

        let too_few = QualityMetrics {
            quality_score_bps: 2_000,
            total_tasks: 3,
            ..Default::default()
        };
        assert!(!should_slash(&too_few));
    }
}
