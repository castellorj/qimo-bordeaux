/** Comparador de cotações (multicálculo) — pontuação transparente e determinística. */
import type { QuoteResult } from "../types";

export function coverageScore(r: QuoteResult) {
  return r.coverages.filter((c) => c.included).length * 10 + r.coverages.reduce((s, c) => s + (c.included && c.limit ? Math.log10(c.limit) : 0), 0) + r.assistance.length * 3;
}

/** Score 0..100: preço 60% · cobertura 25% · franquia 15% */
export function scoreResults(results: QuoteResult[]) {
  const ok = results.filter((r) => r.status === "ok");
  const minP = Math.min(...ok.map((r) => r.annualPremium));
  const maxC = Math.max(...ok.map(coverageScore), 1);
  const minD = Math.min(...ok.map((r) => r.deductible ?? 0));
  return new Map(ok.map((r) => [r.id, Math.round(100 * (0.6 * (minP / r.annualPremium) + 0.25 * (coverageScore(r) / maxC) + 0.15 * (r.deductible ? minD / r.deductible : 1)))]));
}
