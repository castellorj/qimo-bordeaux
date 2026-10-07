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

/** Diferenças determinísticas entre duas cotações (base → alternativa). */
export function resultDiff(base: QuoteResult, alt: QuoteResult, insurerName: (id: string) => string): string[] {
  const out: string[] = [];
  const d = alt.annualPremium - base.annualPremium;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  out.push(`${insurerName(alt.insurerId)} custa ${fmt(Math.abs(d))} ${d >= 0 ? "a mais" : "a menos"} por ano que ${insurerName(base.insurerId)}.`);
  if (base.deductible && alt.deductible && base.deductible !== alt.deductible) out.push(`Franquia ${alt.deductible > base.deductible ? "maior" : "menor"}: ${fmt(alt.deductible)} contra ${fmt(base.deductible)}.`);
  const onlyAlt = alt.assistance.filter((a) => !base.assistance.includes(a));
  if (onlyAlt.length) out.push(`Assistências adicionais: ${onlyAlt.join(", ")}.`);
  return out;
}
