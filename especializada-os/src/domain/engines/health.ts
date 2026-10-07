/**
 * Módulo SAÚDE — preço, rede, recomendação e comparação.
 * 100% determinístico: nenhum valor é estimado por IA. Textos explicativos são
 * montados a partir de diferenças estruturadas (ver whatChanges).
 */
import type { AgeBand, DB, HealthPlan, HealthQuoteRequest, NetworkService, Provider, ReimbursementLevel, Coverage } from "../types";
import { AGE_BANDS } from "../types";
import { distanceKm } from "@/lib/geo";
import { money0 } from "@/lib/format";

export function ageBand(age: number): AgeBand {
  if (age <= 18) return "0-18";
  if (age >= 59) return "59+";
  const idx = Math.floor((age - 19) / 5) + 1;
  return AGE_BANDS[Math.min(idx, 8)];
}

export function planMonthlyPrice(plan: HealthPlan, ages: number[]) {
  return ages.reduce((sum, a) => sum + plan.pricesByBand[ageBand(a)], 0);
}

export function planProviders(db: DB, planId: string) {
  const links = db.planProviders.filter((l) => l.planId === planId);
  return links
    .map((l) => ({ link: l, provider: db.providers.find((p) => p.id === l.providerId)! }))
    .filter((x) => x.provider);
}

export function plansForProvider(db: DB, providerId: string) {
  return db.planProviders
    .filter((l) => l.providerId === providerId)
    .map((l) => ({ link: l, plan: db.healthPlans.find((p) => p.id === l.planId)! }))
    .filter((x) => x.plan);
}

export function planCovers(db: DB, planId: string, providerId: string) {
  return db.planProviders.find((l) => l.planId === planId && l.providerId === providerId);
}

export function networkSource(db: DB, plan: HealthPlan) {
  return db.networkSources.find((s) => s.id === plan.networkSourceId);
}

export const REIMB_RANK: Record<ReimbursementLevel, number> = { nenhum: 0, basico: 1, intermediario: 2, alto: 3, premium: 4 };
export const COVERAGE_RANK: Record<Coverage, number> = { municipal: 0, regional: 1, estadual: 2, nacional: 3 };
export const REIMB_LABEL: Record<ReimbursementLevel, string> = { nenhum: "Sem reembolso", basico: "Básico", intermediario: "Intermediário", alto: "Alto", premium: "Premium" };
export const COVERAGE_LABEL: Record<Coverage, string> = { municipal: "Municipal", regional: "Regional", estadual: "Estadual", nacional: "Nacional" };
export const SERVICE_LABEL: Record<NetworkService, string> = { internacao: "Internação", "pronto-socorro": "Pronto-socorro", maternidade: "Maternidade", exames: "Exames", consultas: "Consultas" };

export interface PlanEvaluation {
  plan: HealthPlan;
  monthly: number;
  desiredCovered: Provider[];
  desiredMissing: Provider[];
  nearbyCount: number; // prestadores da rede num raio de 10 km
  nearbyHospitals: number;
  withinBudget: boolean | null;
  meetsHard: boolean;
  hardFailures: string[];
  networkScore: number; // 0..100
  valueScore: number; // 0..100
  stale: boolean; // fonte de rede expirada
}

export interface Recommendation {
  evaluations: PlanEvaluation[];
  picks: { key: "custo_beneficio" | "melhor_rede" | "economico" | "premium"; label: string; planId: string; reasons: string[] }[];
}

export function evaluatePlans(db: DB, req: HealthQuoteRequest): PlanEvaluation[] {
  const ages = req.beneficiaries.map((b) => b.age);
  const desired = req.desiredProviderIds.map((id) => db.providers.find((p) => p.id === id)).filter(Boolean) as Provider[];
  const origin = req.lat != null && req.lng != null ? { lat: req.lat, lng: req.lng } : null;

  const candidates = db.healthPlans.filter((p) => (req.segment === "pme" || req.segment === "empresarial" ? p.segment === "pme" || p.segment === "empresarial" : p.segment === "individual" || p.segment === "adesao"));
  const evals = candidates.map((plan) => {
    const monthly = planMonthlyPrice(plan, ages);
    const net = planProviders(db, plan.id);
    const netIds = new Set(net.map((n) => n.provider.id));
    const desiredCovered = desired.filter((d) => netIds.has(d.id));
    const desiredMissing = desired.filter((d) => !netIds.has(d.id));
    const near = origin ? net.filter((n) => distanceKm(origin, n.provider) <= 10) : net;
    const hardFailures: string[] = [];
    if (req.accommodation && req.accommodation === "apartamento" && plan.accommodation !== "apartamento") hardFailures.push("acomodação em enfermaria");
    if (req.coparticipation === "nao" && plan.coparticipation) hardFailures.push("possui coparticipação");
    if (req.reimbursement && REIMB_RANK[plan.reimbursement] < REIMB_RANK[req.reimbursement]) hardFailures.push(`reembolso abaixo do desejado (${REIMB_LABEL[plan.reimbursement]})`);
    if (req.coverage && COVERAGE_RANK[plan.coverage] < COVERAGE_RANK[req.coverage]) hardFailures.push(`abrangência ${COVERAGE_LABEL[plan.coverage].toLowerCase()}`);
    const src = networkSource(db, plan);
    const desiredRatio = desired.length ? desiredCovered.length / desired.length : 1;
    const nearScore = Math.min(1, near.length / 14);
    const networkScore = Math.round(100 * (desired.length ? 0.65 * desiredRatio + 0.35 * nearScore : nearScore));
    return {
      plan,
      monthly,
      desiredCovered,
      desiredMissing,
      nearbyCount: near.length,
      nearbyHospitals: near.filter((n) => n.provider.type === "hospital").length,
      withinBudget: req.budgetMonthly ? monthly <= req.budgetMonthly : null,
      meetsHard: hardFailures.length === 0,
      hardFailures,
      networkScore,
      valueScore: 0,
      stale: src?.status === "expirada",
    } satisfies PlanEvaluation;
  });

  // custo-benefício: qualidade (rede + reembolso + abrangência) por real gasto, normalizado
  const quality = (e: PlanEvaluation) => e.networkScore * 0.6 + REIMB_RANK[e.plan.reimbursement] * 6 + COVERAGE_RANK[e.plan.coverage] * 4 + (e.plan.accommodation === "apartamento" ? 6 : 0);
  const ratios = evals.map((e) => quality(e) / Math.max(1, e.monthly));
  const maxR = Math.max(...ratios, 0.0001);
  evals.forEach((e, i) => (e.valueScore = Math.round((100 * ratios[i]) / maxR)));
  return evals.sort((a, b) => Number(b.meetsHard) - Number(a.meetsHard) || b.valueScore - a.valueScore);
}

export function recommend(db: DB, req: HealthQuoteRequest): Recommendation {
  const evaluations = evaluatePlans(db, req);
  const insurerName = (id: string) => db.insurers.find((i) => i.id === id)?.short ?? "";
  const eligible = evaluations.filter((e) => e.meetsHard && (e.withinBudget !== false));
  const pool = eligible.length ? eligible : evaluations.filter((e) => e.meetsHard).length ? evaluations.filter((e) => e.meetsHard) : evaluations;
  const picks: Recommendation["picks"] = [];
  const reasonsFor = (e: PlanEvaluation) => {
    const r: string[] = [];
    r.push(`${money0(e.monthly)}/mês para ${req.beneficiaries.length} beneficiário${req.beneficiaries.length > 1 ? "s" : ""}`);
    if (req.desiredProviderIds.length) r.push(`atende ${e.desiredCovered.length} de ${req.desiredProviderIds.length} prestadores desejados${e.desiredMissing.length ? ` (não atende: ${e.desiredMissing.map((p) => p.name).join(", ")})` : ""}`);
    r.push(`${e.nearbyCount} prestadores da rede em até 10 km (${e.nearbyHospitals} hospitais)`);
    r.push(`${e.plan.accommodation === "apartamento" ? "Apartamento" : "Enfermaria"} · ${e.plan.coparticipation ? "com" : "sem"} coparticipação · reembolso ${REIMB_LABEL[e.plan.reimbursement].toLowerCase()} · ${COVERAGE_LABEL[e.plan.coverage].toLowerCase()}`);
    if (e.withinBudget === false) r.push(`acima do orçamento informado (${money0(req.budgetMonthly!)})`);
    if (e.stale) r.push("⚠ rede com fonte expirada — confirmar com a operadora");
    return r;
  };
  const by = <T,>(arr: T[], f: (x: T) => number) => [...arr].sort((a, b) => f(b) - f(a))[0];
  const cb = by(pool, (e) => e.valueScore);
  const net = by(pool, (e) => e.networkScore * 1000 - e.monthly / 100);
  const eco = by(pool, (e) => -e.monthly + e.networkScore / 1000);
  const prem = by(evaluations.filter((e) => e.meetsHard).length ? evaluations.filter((e) => e.meetsHard) : evaluations, (e) => e.plan.tier * 100000 + REIMB_RANK[e.plan.reimbursement] * 1000 + e.networkScore);
  if (cb) picks.push({ key: "custo_beneficio", label: "Melhor custo-benefício", planId: cb.plan.id, reasons: [`maior pontuação de qualidade por real investido (${cb.valueScore}/100)`, ...reasonsFor(cb)] });
  if (net) picks.push({ key: "melhor_rede", label: "Melhor rede", planId: net.plan.id, reasons: [`rede mais aderente ao perfil (${net.networkScore}/100)`, ...reasonsFor(net)] });
  if (eco) picks.push({ key: "economico", label: "Mais econômico", planId: eco.plan.id, reasons: ["menor mensalidade entre os planos que atendem aos critérios obrigatórios", ...reasonsFor(eco)] });
  if (prem) picks.push({ key: "premium", label: "Premium", planId: prem.plan.id, reasons: [`plano de categoria mais alta (${insurerName(prem.plan.insurerId)})`, ...reasonsFor(prem)] });
  return { evaluations, picks };
}

/** "O QUE MUDA?" — resumo determinístico das diferenças entre dois planos. */
export function whatChanges(db: DB, a: HealthPlan, b: HealthPlan, ages: number[], focusProviderIds: string[] = []): string[] {
  const out: string[] = [];
  const pa = planMonthlyPrice(a, ages);
  const pb = planMonthlyPrice(b, ages);
  const diff = pb - pa;
  const nameA = a.name;
  const nameB = b.name;
  if (Math.abs(diff) >= 1) out.push(`${nameB} custa ${money0(Math.abs(diff))} ${diff > 0 ? "a mais" : "a menos"} por mês que ${nameA} (${money0(Math.abs(diff) * 12)} por ano).`);
  else out.push(`${nameA} e ${nameB} têm a mesma mensalidade.`);
  const netA = new Set(planProviders(db, a.id).map((x) => x.provider.id));
  const netB = new Set(planProviders(db, b.id).map((x) => x.provider.id));
  const focus = focusProviderIds.length ? focusProviderIds : db.providers.filter((p) => p.type === "hospital" || p.type === "maternidade").map((p) => p.id);
  const onlyB = focus.filter((id) => netB.has(id) && !netA.has(id)).map((id) => db.providers.find((p) => p.id === id)!.name);
  const onlyA = focus.filter((id) => netA.has(id) && !netB.has(id)).map((id) => db.providers.find((p) => p.id === id)!.name);
  if (onlyB.length) out.push(`${nameB} inclui ${onlyB.join(", ")}, que não ${onlyB.length > 1 ? "estão" : "está"} em ${nameA}.`);
  if (onlyA.length) out.push(`${nameA} inclui ${onlyA.join(", ")}, que não ${onlyA.length > 1 ? "estão" : "está"} em ${nameB}.`);
  if (!onlyA.length && !onlyB.length) out.push("Os dois planos atendem os mesmos hospitais e maternidades considerados.");
  if (a.reimbursement !== b.reimbursement) {
    const better = REIMB_RANK[b.reimbursement] > REIMB_RANK[a.reimbursement] ? b : a;
    const worse = better === b ? a : b;
    out.push(`Reembolso: ${better.name} é ${REIMB_LABEL[better.reimbursement].toLowerCase()} (consulta até ${money0(better.reimbursementConsultation)}) contra ${REIMB_LABEL[worse.reimbursement].toLowerCase()}${worse.reimbursementConsultation ? ` (${money0(worse.reimbursementConsultation)})` : ""} em ${worse.name}.`);
  }
  if (a.accommodation !== b.accommodation) out.push(`Acomodação: ${a.name} é ${a.accommodation}, ${b.name} é ${b.accommodation}.`);
  if (a.coparticipation !== b.coparticipation) out.push(`Coparticipação: ${a.coparticipation ? a.name : b.name} cobra coparticipação; ${a.coparticipation ? b.name : a.name} não.`);
  if (a.coverage !== b.coverage) out.push(`Abrangência: ${a.name} é ${COVERAGE_LABEL[a.coverage].toLowerCase()}, ${b.name} é ${COVERAGE_LABEL[b.coverage].toLowerCase()}.`);
  return out;
}
