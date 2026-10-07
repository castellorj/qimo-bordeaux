/**
 * Calculadora SIMULADA da DEMO. Gera prêmios plausíveis e determinísticos
 * para demonstrar o fluxo de multicálculo. NÃO representa tarifa de nenhuma
 * seguradora real — os nomes de seguradoras da DEMO são fictícios.
 */
import type { AutoQuoteRequest, GenericQuoteRequest, QuoteResult, Vehicle } from "@/domain/types";
import { lineLabel } from "@/domain/products";

export interface DemoProfile {
  insurerId: string;
  autoBaseRate: number; // % do valor FIPE
  commissionPct: number;
  assistance: string[];
  declinesUsage?: Vehicle["usage"][];
  manualOnly?: boolean; // simula seguradora sem integração (entrada manual)
  genericFactor: number;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000; // 0..1
}

const regionFactor = (cep: string) => {
  const p = Number(cep.replace(/\D/g, "").slice(0, 2));
  // CEPs 20-23 (Rio capital) — zonas com fatores ilustrativos
  const sub = Number(cep.replace(/\D/g, "").slice(0, 3));
  if (sub >= 220 && sub <= 224) return 1.0; // zona sul
  if (sub >= 225 && sub <= 228) return 1.08; // zona oeste/barra
  if (sub >= 200 && sub <= 219) return 1.15; // centro/norte
  if (p === 24) return 1.05; // Niterói
  return 1.1;
};

export function demoAutoQuote(p: DemoProfile, req: AutoQuoteRequest, v: Vehicle, adapterName: string): QuoteResult {
  const receivedAt = new Date().toISOString();
  const base = { id: `qr-${p.insurerId}-${v.id}-${Math.round(hash(JSON.stringify(req)) * 1e6)}`, insurerId: p.insurerId, assistance: p.assistance, commissionPct: p.commissionPct, source: { adapter: adapterName, method: "demo" as const, receivedAt } };
  if (p.manualOnly) {
    return { ...base, productName: "Auto (cotação manual)", annualPremium: 0, coverages: [], status: "manual_pendente", message: "Seguradora sem integração automática. Registrar cotação manualmente a partir do portal do corretor.", source: { ...base.source, method: "manual" } };
  }
  if (p.declinesUsage?.includes(req.usage)) {
    return { ...base, productName: "Auto", annualPremium: 0, coverages: [], status: "recusado", message: `Não aceita veículos de uso "${req.usage}".` };
  }
  const ageF = req.driverAge < 25 ? 1.55 : req.driverAge < 30 ? 1.2 : req.driverAge > 65 ? 1.15 : 1;
  const usageF = req.usage === "aplicativo" ? 1.45 : req.usage === "comercial" ? 1.25 : 1;
  const garageF = (req.garage.home ? 0.92 : 1.08) * (req.garage.work ? 0.97 : 1);
  const bonusF = 1 - Math.min(10, req.bonusClass) * 0.035;
  const dedF = req.deductible === "reduzida" ? 1.18 : req.deductible === "majorada" ? 0.86 : 1;
  const young = req.youngDriver ? 1.25 : 1;
  const casco = req.coverages.casco === "sem" ? 0 : req.coverages.casco === "110%" ? 1.08 : 1;
  const variation = 0.9 + hash(`${p.insurerId}:${v.model}:${v.yearModel}`) * 0.25;
  const cascoPremium = v.fipeValue * (p.autoBaseRate / 100) * casco * ageF * usageF * garageF * bonusF * dedF * young * regionFactor(req.overnightCep) * variation;
  const rcf = (req.coverages.rcfDanosMateriais + req.coverages.rcfDanosCorporais) * 0.0024 * variation;
  const app = req.coverages.app * 0.002;
  const extras = (req.coverages.vidros ? 240 : 0) + req.coverages.carroReserva * 9.5;
  const annual = Math.round((cascoPremium + rcf + app + extras) * 100) / 100;
  const deductible = Math.round(v.fipeValue * (req.deductible === "reduzida" ? 0.035 : req.deductible === "majorada" ? 0.085 : 0.055) * (0.92 + hash(p.insurerId + v.id) * 0.18));
  return {
    ...base,
    productName: "Auto Individual",
    annualPremium: annual,
    monthlyPremium: Math.round((annual / 10) * 100) / 100,
    deductible: req.coverages.casco === "sem" ? undefined : deductible,
    coverages: [
      { name: `Casco ${req.coverages.casco === "sem" ? "" : req.coverages.casco + " FIPE"}`.trim(), included: req.coverages.casco !== "sem", limit: req.coverages.casco === "sem" ? undefined : Math.round(v.fipeValue * casco) },
      { name: "RCF danos materiais", included: true, limit: req.coverages.rcfDanosMateriais },
      { name: "RCF danos corporais", included: true, limit: req.coverages.rcfDanosCorporais },
      { name: "APP por passageiro", included: req.coverages.app > 0, limit: req.coverages.app },
      { name: "Vidros", included: req.coverages.vidros },
      { name: `Carro reserva ${req.coverages.carroReserva} dias`, included: req.coverages.carroReserva > 0 },
    ],
    status: "ok",
  };
}

export function demoGenericQuote(p: DemoProfile, req: GenericQuoteRequest, adapterName: string): QuoteResult {
  const receivedAt = new Date().toISOString();
  const value = req.insuredValue ?? 100000;
  const rate = { vida: 0.0021, residencial: 0.0009, empresarial: 0.0035, viagem: 0.004, odonto: 0.01, condominio: 0.0011, fianca: 0.08, rc: 0.006, cyber: 0.012, transportes: 0.003, nautico: 0.018, aeronautico: 0.025, garantia: 0.009, previdencia: 0, equipamentos: 0.02, outros: 0.01 }[req.line] ?? 0.01;
  const annual = Math.max(180, Math.round(value * rate * p.genericFactor * (0.92 + hash(p.insurerId + req.line) * 0.2) * 100) / 100);
  return {
    id: `qr-${p.insurerId}-${req.line}-${Math.round(hash(JSON.stringify(req) + p.insurerId) * 1e6)}`,
    insurerId: p.insurerId,
    productName: `${lineLabel(req.line)} ${p.genericFactor > 1.05 ? "Completo" : "Essencial"}`,
    annualPremium: annual,
    monthlyPremium: Math.round((annual / 12) * 100) / 100,
    coverages: [{ name: "Cobertura básica", included: true, limit: value }],
    assistance: p.assistance,
    commissionPct: p.commissionPct,
    status: "ok",
    source: { adapter: adapterName, method: "demo", receivedAt },
  };
}
