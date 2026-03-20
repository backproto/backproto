import type { Recipe, ProviderState, SimulationState, SimulationConfig } from "./types";

function computePrice(base: number, k: number, alpha: number, utilization: number): number {
  return base * (1 + k * Math.pow(utilization, alpha));
}

function initProviders(recipe: Recipe): ProviderState[] {
  const providers: ProviderState[] = [];
  for (const step of recipe.steps) {
    for (const p of step.providers) {
      providers.push({
        id: `${step.id}/${p.name}`,
        name: p.name,
        alive: true,
        capacity: 1.0,
        utilization: 0,
        earnings: 0,
        requestsHandled: 0,
        latencyMs: 50 + Math.random() * 100,
        pricingCurve: p.pricingCurve,
      });
    }
  }
  return providers;
}

function capacityWeightedRoute(providers: ProviderState[], maxShare: number): number[] {
  const alive = providers.filter((p) => p.alive);
  if (alive.length === 0) return providers.map(() => 0);

  const spareCapacities = providers.map((p) => {
    if (!p.alive) return 0;
    const spare = Math.max(0, p.capacity - p.utilization);
    const price = computePrice(
      p.pricingCurve.base,
      p.pricingCurve.k,
      p.pricingCurve.alpha,
      p.utilization
    );
    // Weight: spare capacity inversely weighted by price
    return spare / Math.max(price, 0.0001);
  });

  const total = spareCapacities.reduce((a, b) => a + b, 0);
  if (total === 0) return providers.map(() => 1 / providers.length);

  const weights = spareCapacities.map((sc) => Math.min(sc / total, maxShare));
  const wTotal = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / wTotal);
}

export function createSimulation(recipe: Recipe, config: SimulationConfig) {
  let state: SimulationState = {
    tick: 0,
    providers: initProviders(recipe),
    totalRequests: 0,
    completedRequests: 0,
    failedRequests: 0,
    allocationEfficiency: 1.0,
    sloCompliance: 1.0,
    reroutes: 0,
    gasCostEstimate: 0,
  };

  const maxShare = recipe.routing?.maxSharePerProvider ?? 0.7;
  const sloLatency = recipe.settlement?.penalties?.slo?.p95_latency_ms ?? 1500;

  function tick() {
    const requestsThisTick = Math.floor(
      config.loadFactor * state.providers.length * 10
    );

    const weights = capacityWeightedRoute(state.providers, maxShare);

    let completed = 0;
    let failed = 0;
    let reroutes = 0;

    for (let i = 0; i < requestsThisTick; i++) {
      // Pick a provider by weighted random
      const r = Math.random();
      let cumulative = 0;
      let targetIdx = 0;
      for (let j = 0; j < weights.length; j++) {
        cumulative += weights[j];
        if (r <= cumulative) {
          targetIdx = j;
          break;
        }
      }

      const provider = state.providers[targetIdx];
      if (!provider.alive || provider.utilization >= provider.capacity) {
        // Reroute: find the provider with most spare capacity
        const fallback = state.providers
          .filter((p) => p.alive && p.utilization < p.capacity)
          .sort((a, b) => (b.capacity - b.utilization) - (a.capacity - a.utilization))[0];

        if (fallback) {
          fallback.utilization = Math.min(
            fallback.capacity,
            fallback.utilization + 0.02
          );
          fallback.requestsHandled++;
          fallback.earnings += computePrice(
            fallback.pricingCurve.base,
            fallback.pricingCurve.k,
            fallback.pricingCurve.alpha,
            fallback.utilization
          );
          completed++;
          reroutes++;
        } else {
          failed++;
        }
      } else {
        provider.utilization = Math.min(
          provider.capacity,
          provider.utilization + 0.02
        );
        provider.requestsHandled++;
        provider.latencyMs =
          50 + 200 * Math.pow(provider.utilization, 2) + Math.random() * 30;
        provider.earnings += computePrice(
          provider.pricingCurve.base,
          provider.pricingCurve.k,
          provider.pricingCurve.alpha,
          provider.utilization
        );
        completed++;
      }
    }

    // Natural decay: utilization drops slightly each tick
    for (const p of state.providers) {
      if (p.alive) {
        p.utilization = Math.max(0, p.utilization - 0.03);
      }
    }

    const aliveProviders = state.providers.filter((p) => p.alive);
    const avgUtil =
      aliveProviders.length > 0
        ? aliveProviders.reduce((a, p) => a + p.utilization, 0) /
          aliveProviders.length
        : 0;
    const maxUtil =
      aliveProviders.length > 0
        ? Math.max(...aliveProviders.map((p) => p.utilization))
        : 0;
    const efficiency =
      maxUtil > 0 ? 1 - (maxUtil - avgUtil) / maxUtil : 1.0;

    const sloViolations = aliveProviders.filter(
      (p) => p.latencyMs > sloLatency
    ).length;
    const sloCompliance =
      aliveProviders.length > 0
        ? 1 - sloViolations / aliveProviders.length
        : 1.0;

    state = {
      tick: state.tick + 1,
      providers: [...state.providers],
      totalRequests: state.totalRequests + requestsThisTick,
      completedRequests: state.completedRequests + completed,
      failedRequests: state.failedRequests + failed,
      allocationEfficiency: efficiency,
      sloCompliance,
      reroutes: state.reroutes + reroutes,
      gasCostEstimate: state.gasCostEstimate + completed * 0.0003,
    };

    return state;
  }

  function killProvider(id: string) {
    const p = state.providers.find((p) => p.id === id);
    if (p) {
      p.alive = false;
      p.utilization = 0;
    }
  }

  function reviveProvider(id: string) {
    const p = state.providers.find((p) => p.id === id);
    if (p) {
      p.alive = true;
      p.capacity = 1.0;
    }
  }

  function degradeProvider(id: string, factor: number) {
    const p = state.providers.find((p) => p.id === id);
    if (p) {
      p.capacity = Math.max(0.1, p.capacity * factor);
    }
  }

  function spikeLoad(cfg: SimulationConfig): SimulationConfig {
    return { ...cfg, loadFactor: Math.min(1.0, cfg.loadFactor * 3) };
  }

  function getState() {
    return state;
  }

  return { tick, killProvider, reviveProvider, degradeProvider, spikeLoad, getState };
}
