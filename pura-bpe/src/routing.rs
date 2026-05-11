//! Max-weight routing scheduler with ε-greedy exploration.
//!
//! Ported from `nvm/src/routing/router.ts`.
//!
//! Algorithm:
//! 1. Compute weighted scores for all candidates
//! 2. Adaptive exploration: if quality CV > threshold, double ε
//! 3. With probability ε, pick uniformly (explore); else pick max weight (exploit)
//! 4. Compute dynamic price for the selected agent

use alloc::vec::Vec;

use crate::pricing::compute_dynamic_price;
use crate::scoring::{adaptive_exploration_rate, compute_weight};
use crate::types::{AgentCapacity, PricingInputs, RoutingConfig, RoutingResult, BPS};

/// Route a job to the best available agent.
///
/// `quality_scores_bps` maps 1:1 with `candidates` — the quality score for each agent.
/// `all_quality_scores_bps` is the full list of known scores (for CV computation).
/// `rand_value` is a u64 in [0, BPS) used for the explore/exploit coin flip and
/// uniform selection. Pass in external randomness to keep this function deterministic
/// and testable.
///
/// Returns `None` if `candidates` is empty.
pub fn route_job(
    candidates: &[AgentCapacity],
    quality_scores_bps: &[u64],
    all_quality_scores_bps: &[u64],
    config: &RoutingConfig,
    rand_value: u64,
) -> Option<RoutingResult> {
    if candidates.is_empty() {
        return None;
    }

    let n = candidates.len();

    // Step 1: compute weighted scores
    let weights: Vec<u64> = candidates
        .iter()
        .zip(quality_scores_bps.iter())
        .map(|(agent, &quality)| {
            compute_weight(
                agent.smoothed_capacity,
                quality,
                agent.price_msats,
                config.price_normalization_msats,
            )
        })
        .collect();

    // Step 2: adaptive exploration
    let exploration_rate = adaptive_exploration_rate(
        all_quality_scores_bps,
        config.base_exploration_bps,
        config.max_exploration_bps,
        config.volatility_threshold_bps,
    );

    // Step 3: select — rand_value in [0, BPS)
    let (selected_index, explored) = if rand_value < exploration_rate {
        // Explore: uniform random using rand_value as entropy
        let idx = (rand_value as usize) % n;
        (idx, true)
    } else {
        // Exploit: max weight
        let mut best_idx = 0;
        let mut best_weight = weights[0];
        for (i, &w) in weights.iter().enumerate().skip(1) {
            if w > best_weight {
                best_weight = w;
                best_idx = i;
            }
        }
        (best_idx, false)
    };

    let selected = &candidates[selected_index];

    // Step 4: compute dynamic price
    let pricing_inputs = PricingInputs {
        queue_depth: selected.queue_depth,
        smoothed_capacity: selected.smoothed_capacity,
        base_fee_msats: config.pricing_base_fee_msats,
        gamma_bps: config.pricing_gamma_bps,
    };
    let price_msats = compute_dynamic_price(&pricing_inputs);

    Some(RoutingResult {
        selected_index,
        explored,
        routing_score_bps: weights[selected_index],
        price_msats,
        alternatives: n,
    })
}

/// Compute Boltzmann-blended shares for a set of agents.
///
/// `shares_1e18[i] = (1 − ε) × boltzmann[i] + ε × (1/N)`
///
/// This matches `BackpressurePool.sol` `rebalanceWithShares()`.
/// Boltzmann weight: `exp(capacity / temperature)`. Since we avoid floats,
/// we approximate with capacity-proportional shares (equivalent to T → ∞).
/// For finite temperature, the caller should supply pre-computed Boltzmann
/// shares; this function handles the exploration blending.
///
/// Returns shares in BPS (sum ≈ BPS).
pub fn blend_boltzmann_shares(
    boltzmann_shares_bps: &[u64],
    exploration_rate_bps: u64,
) -> Vec<u64> {
    let n = boltzmann_shares_bps.len();
    if n == 0 {
        return Vec::new();
    }

    let uniform_share_bps = BPS / (n as u64);
    let exploit_weight = BPS - exploration_rate_bps;

    boltzmann_shares_bps
        .iter()
        .map(|&share| {
            (exploit_weight * share + exploration_rate_bps * uniform_share_bps) / BPS
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::AgentCapacity;

    fn make_agent(id: u64, capacity: u64, price: u64) -> AgentCapacity {
        AgentCapacity {
            id,
            smoothed_capacity: capacity,
            queue_depth: 0,
            max_concurrent: capacity,
            price_msats: price,
        }
    }

    #[test]
    fn empty_candidates_returns_none() {
        let config = RoutingConfig::default();
        assert!(route_job(&[], &[], &[], &config, 5000).is_none());
    }

    #[test]
    fn single_candidate_always_selected() {
        let candidates = [make_agent(1, 1000, 100)];
        let quality = [BPS];
        let config = RoutingConfig::default();

        let result = route_job(&candidates, &quality, &quality, &config, 5000).unwrap();
        assert_eq!(result.selected_index, 0);
        assert_eq!(result.alternatives, 1);
    }

    #[test]
    fn exploit_picks_highest_weight() {
        let candidates = [
            make_agent(1, 500, 100),
            make_agent(2, 1000, 100), // higher capacity → higher weight
            make_agent(3, 200, 100),
        ];
        let quality = [BPS, BPS, BPS];
        let config = RoutingConfig::default();

        // rand_value = 9000 > max exploration rate → exploit
        let result = route_job(&candidates, &quality, &quality, &config, 9000).unwrap();
        assert_eq!(result.selected_index, 1);
        assert!(!result.explored);
    }

    #[test]
    fn explore_picks_uniform() {
        let candidates = [
            make_agent(1, 500, 100),
            make_agent(2, 1000, 100),
            make_agent(3, 200, 100),
        ];
        let quality = [BPS, BPS, BPS];
        let mut config = RoutingConfig::default();
        config.base_exploration_bps = 5000; // 50% exploration to guarantee explore branch

        // rand_value = 100 < 5000 → explore; 100 % 3 = 1
        let result = route_job(&candidates, &quality, &quality, &config, 100).unwrap();
        assert_eq!(result.selected_index, 1);
        assert!(result.explored);
    }

    #[test]
    fn price_affects_selection() {
        let candidates = [
            make_agent(1, 1000, 5000), // high price
            make_agent(2, 1000, 10),   // low price → higher weight
        ];
        let quality = [BPS, BPS];
        let config = RoutingConfig::default();

        let result = route_job(&candidates, &quality, &quality, &config, 9000).unwrap();
        assert_eq!(result.selected_index, 1); // low price wins
    }

    #[test]
    fn blend_shares_pure_exploit() {
        // ε = 0: shares unchanged
        let shares = blend_boltzmann_shares(&[7000, 3000], 0);
        assert_eq!(shares, vec![7000, 3000]);
    }

    #[test]
    fn blend_shares_pure_explore() {
        // ε = BPS: all uniform
        let shares = blend_boltzmann_shares(&[7000, 3000], BPS);
        assert_eq!(shares, vec![5000, 5000]);
    }

    #[test]
    fn blend_shares_mixed() {
        // ε = 500 (5%): (1-0.05) × boltzmann + 0.05 × uniform
        // agent 0: 9500 * 7000 / 10000 + 500 * 5000 / 10000 = 6650 + 250 = 6900
        // agent 1: 9500 * 3000 / 10000 + 500 * 5000 / 10000 = 2850 + 250 = 3100
        let shares = blend_boltzmann_shares(&[7000, 3000], 500);
        assert_eq!(shares, vec![6900, 3100]);
    }

    #[test]
    fn blend_shares_empty() {
        assert!(blend_boltzmann_shares(&[], 500).is_empty());
    }
}
