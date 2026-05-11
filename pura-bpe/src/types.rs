//! Shared types used across the BPE crate.

/// Basis points denominator (10_000). All BPS-scaled values divide by this.
pub const BPS: u64 = 10_000;

/// 1e18 fixed-point scale, matching Solidity's 1e18 arithmetic.
pub const SCALE_1E18: u64 = 1_000_000_000_000_000_000;

/// Capacity state for a single agent/node.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AgentCapacity {
    /// Unique identifier (pubkey, address, etc.).
    pub id: u64,
    /// EWMA-smoothed capacity.
    pub smoothed_capacity: u64,
    /// Current queue depth (in-flight requests).
    pub queue_depth: u64,
    /// Maximum concurrent capacity declared.
    pub max_concurrent: u64,
    /// Current price in msats.
    pub price_msats: u64,
}

/// Inputs for the congestion pricing formula.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PricingInputs {
    /// Current queue depth.
    pub queue_depth: u64,
    /// EWMA-smoothed capacity.
    pub smoothed_capacity: u64,
    /// Base fee in msats.
    pub base_fee_msats: u64,
    /// Price sensitivity γ in BPS (10_000 = 1.0).
    pub gamma_bps: u64,
}

/// Result of the max-weight routing decision.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RoutingResult {
    /// Index of the selected agent in the candidates slice.
    pub selected_index: usize,
    /// Whether the selection was an exploration (uniform random) vs exploitation (max weight).
    pub explored: bool,
    /// Routing score (weight) of the selected agent, in BPS.
    pub routing_score_bps: u64,
    /// Dynamic price for this request in msats.
    pub price_msats: u64,
    /// Number of candidate agents considered.
    pub alternatives: usize,
}

/// Quality metrics for a single agent on a task type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QualityMetrics {
    /// Completion rate in BPS (10_000 = 100%).
    pub completion_rate_bps: u64,
    /// EWMA-smoothed average latency in milliseconds.
    pub avg_latency_ms: u64,
    /// Error rate in BPS.
    pub error_rate_bps: u64,
    /// Satisfaction score in BPS.
    pub satisfaction_bps: u64,
    /// Composite quality score in BPS.
    pub quality_score_bps: u64,
    /// Total tasks observed.
    pub total_tasks: u64,
    /// Total errors observed.
    pub total_errors: u64,
}

impl Default for QualityMetrics {
    fn default() -> Self {
        Self {
            completion_rate_bps: BPS,
            avg_latency_ms: 0,
            error_rate_bps: 0,
            satisfaction_bps: BPS,
            quality_score_bps: BPS,
            total_tasks: 0,
            total_errors: 0,
        }
    }
}

/// Configuration for the routing algorithm.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RoutingConfig {
    /// Price normalization factor in msats.
    pub price_normalization_msats: u64,
    /// Base exploration rate in BPS (500 = 5%).
    pub base_exploration_bps: u64,
    /// Maximum exploration rate in BPS (2000 = 20%).
    pub max_exploration_bps: u64,
    /// CV threshold for doubling exploration, in BPS (e.g. 3000 = 0.30).
    pub volatility_threshold_bps: u64,
    /// Base fee for pricing in msats.
    pub pricing_base_fee_msats: u64,
    /// Gamma for pricing in BPS (10_000 = 1.0).
    pub pricing_gamma_bps: u64,
}

impl Default for RoutingConfig {
    fn default() -> Self {
        Self {
            price_normalization_msats: 1000,
            base_exploration_bps: 500,     // 5%
            max_exploration_bps: 2000,     // 20%
            volatility_threshold_bps: 3000, // CV > 0.30 triggers doubled exploration
            pricing_base_fee_msats: 100,
            pricing_gamma_bps: BPS,        // γ = 1.0
        }
    }
}
