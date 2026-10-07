/**
 * Registro de adapters de seguradoras. Decisão: INTEGRAÇÃO PRÓPRIA (um adapter por
 * seguradora, sem agregador). Na DEMO os adapters usam a calculadora simulada;
 * em produção cada um é substituído pelo adapter real (API oficial/parceiro
 * liberada pela seguradora, importação de arquivo ou entrada manual).
 */
import type { InsurerAdapter } from "./types";
import { demoAutoQuote, demoGenericQuote, type DemoProfile } from "./adapters/demo-calculator";
import type { ProductLine } from "@/domain/types";

export const DEMO_PROFILES: (DemoProfile & { lines: ProductLine[] })[] = [
  { insurerId: "ins-porto", autoBaseRate: 3.1, commissionPct: 0.18, genericFactor: 1.0, assistance: ["Guincho 400 km", "Chaveiro", "Assistência residencial"], lines: ["auto", "residencial", "vida", "empresarial", "viagem", "fianca", "condominio"] },
  { insurerId: "ins-tokio", autoBaseRate: 2.85, commissionPct: 0.15, genericFactor: 0.95, assistance: ["Guincho 200 km", "Troca de pneu"], lines: ["auto", "residencial", "vida", "empresarial", "rc", "garantia", "transportes"] },
  { insurerId: "ins-allianz", autoBaseRate: 3.4, commissionPct: 0.2, genericFactor: 1.12, assistance: ["Guincho ilimitado", "Motorista amigo", "Carro reserva premium"], lines: ["auto", "residencial", "empresarial", "rc", "cyber", "transportes"] },
  { insurerId: "ins-hdi", autoBaseRate: 2.95, commissionPct: 0.17, genericFactor: 0.98, assistance: ["Guincho 300 km", "Martelinho de ouro"], declinesUsage: ["aplicativo"], lines: ["auto", "residencial", "empresarial", "rc"] },
  { insurerId: "ins-bradesco", autoBaseRate: 3.0, commissionPct: 0.16, genericFactor: 1.04, assistance: ["Guincho 500 km", "Desconto em oficinas"], lines: ["auto", "residencial", "vida", "previdencia", "empresarial"] },
  { insurerId: "ins-zurich", autoBaseRate: 3.25, commissionPct: 0.19, genericFactor: 1.08, assistance: ["Guincho 250 km"], manualOnly: true, lines: ["auto", "residencial", "vida", "empresarial", "rc"] },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const INSURER_ADAPTERS: InsurerAdapter[] = DEMO_PROFILES.map((p, i) => ({
  insurerId: p.insurerId,
  adapterName: `demo-calculator:${p.insurerId}`,
  method: p.manualOnly ? "manual" : "demo",
  lines: p.lines,
  automatic: !p.manualOnly,
  async quoteAuto(req, ctx) {
    await wait(350 + i * 260);
    return demoAutoQuote(p, req, ctx.vehicle!, `demo-calculator:${p.insurerId}`);
  },
  async quoteGeneric(req) {
    await wait(300 + i * 200);
    return demoGenericQuote(p, req, `demo-calculator:${p.insurerId}`);
  },
}));

export function adaptersFor(line: ProductLine) {
  return INSURER_ADAPTERS.filter((a) => a.lines.includes(line));
}

/**
 * Seguradoras do catálogo que atendem o ramo mas ainda não têm adapter (integração
 * própria não concluída) entram no comparativo como "cotação manual".
 */
export function manualPlaceholders(insurers: { id: string; lines: ProductLine[] }[], line: ProductLine): import("@/domain/types").QuoteResult[] {
  const withAdapter = new Set(adaptersFor(line).map((a) => a.insurerId));
  const receivedAt = new Date().toISOString();
  return insurers
    .filter((i) => i.lines.includes(line) && !withAdapter.has(i.id))
    .map((i) => ({ id: `qr-${i.id}-${line}-manual-${Date.now().toString(36)}`, insurerId: i.id, productName: "Cotação manual", annualPremium: 0, coverages: [], assistance: [], commissionPct: 0, status: "manual_pendente" as const, message: "Integração própria ainda não concluída — cotar no portal da seguradora e registrar o resultado.", source: { adapter: "entrada-manual", method: "manual" as const, receivedAt } }));
}
