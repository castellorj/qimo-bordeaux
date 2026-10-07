/**
 * Registro de adapters de seguradoras. Na DEMO todos usam a calculadora
 * simulada; em produção cada seguradora recebe o adapter real permitido
 * (API oficial, agregador contratado, importação ou manual).
 */
import type { InsurerAdapter } from "./types";
import { demoAutoQuote, demoGenericQuote, type DemoProfile } from "./adapters/demo-calculator";
import type { ProductLine } from "@/domain/types";

export const DEMO_PROFILES: (DemoProfile & { lines: ProductLine[] })[] = [
  { insurerId: "ins-atlantica", autoBaseRate: 3.1, commissionPct: 0.18, genericFactor: 1.0, assistance: ["Guincho 400 km", "Chaveiro", "Assistência residencial"], lines: ["auto", "residencial", "vida", "empresarial"] },
  { insurerId: "ins-horizonte", autoBaseRate: 2.85, commissionPct: 0.15, genericFactor: 0.95, assistance: ["Guincho 200 km", "Troca de pneu"], lines: ["auto", "residencial", "vida", "viagem"] },
  { insurerId: "ins-pilar", autoBaseRate: 3.4, commissionPct: 0.2, genericFactor: 1.12, assistance: ["Guincho ilimitado", "Motorista amigo", "Carro reserva premium"], lines: ["auto", "empresarial", "rc", "cyber", "garantia"] },
  { insurerId: "ins-bussola", autoBaseRate: 2.95, commissionPct: 0.17, genericFactor: 0.98, assistance: ["Guincho 300 km", "Martelinho de ouro"], declinesUsage: ["aplicativo"], lines: ["auto", "residencial", "condominio", "fianca"] },
  { insurerId: "ins-aurora", autoBaseRate: 3.0, commissionPct: 0.16, genericFactor: 1.04, assistance: ["Guincho 500 km", "Desconto em oficinas"], lines: ["auto", "vida", "previdencia", "viagem"] },
  { insurerId: "ins-meridiano", autoBaseRate: 3.25, commissionPct: 0.19, genericFactor: 1.08, assistance: ["Guincho 250 km"], manualOnly: true, lines: ["auto", "nautico", "transportes", "aeronautico"] },
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
