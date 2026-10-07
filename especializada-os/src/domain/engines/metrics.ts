/** Indicadores do dashboard — todos calculados a partir dos dados (clicáveis). */
import type { DB, User } from "../types";
import { daysBetween } from "@/lib/dates";
import { canSeeParty } from "../rbac";

export function dashboardMetrics(db: DB, today: string, user?: User | null) {
  const vis = <T extends { party?: { type: "person" | "company"; id: string }; holder?: { type: "person" | "company"; id: string } }>(x: T) => canSeeParty(db, user, x.party ?? x.holder);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const persons = db.persons.filter((p) => canSeeParty(db, user, { type: "person", id: p.id }));
  const companies = db.companies.filter((c) => canSeeParty(db, user, { type: "company", id: c.id }));
  const policies = db.policies.filter(vis);
  const active = policies.filter((p) => p.status === "vigente");
  const opps = db.opportunities.filter(vis);
  const props = db.proposals.filter(vis);
  const polIds = new Set(policies.map((p) => p.id));
  const comms = db.commissions.filter((c) => polIds.has(c.policyId));
  const monthC = comms.filter((c) => c.competence === month);
  const salesMonth = db.policies.filter(vis).filter((p) => p.start.slice(0, 7) === month && p.status !== "renovada");
  const won = opps.filter((o) => o.stage === "emitido" || o.stage === "emissao" || o.stage === "aprovado").length;
  const lost = opps.filter((o) => o.stage === "perdido").length;
  const renew = (d: number) => active.filter((p) => { const x = daysBetween(today, p.end); return x >= 0 && x <= d; });
  const minutes = db.automationRuns.filter((r) => daysBetween(r.at.slice(0, 10), today) <= 30).reduce((s, r) => s + r.minutesSaved, 0);
  return {
    activeClients: persons.filter((p) => p.clientStatus === "ativo").length + companies.filter((c) => c.clientStatus === "ativo").length,
    leads: persons.filter((p) => p.clientStatus === "lead").length + opps.filter((o) => o.stage === "lead").length,
    proposalsOpen: props.filter((p) => ["rascunho", "enviada", "visualizada"].includes(p.status)).length,
    proposalsWaiting: props.filter((p) => p.status === "enviada" || p.status === "visualizada").length,
    proposalsApproved: props.filter((p) => p.status === "aceita").length,
    proposalsLost: props.filter((p) => p.status === "recusada" || p.status === "expirada").length + lost,
    activePolicies: active.length,
    activePremium: active.reduce((s, p) => s + p.annualPremium, 0),
    salesMonth: salesMonth.reduce((s, p) => s + p.annualPremium, 0),
    salesMonthCount: salesMonth.length,
    commissionExpectedMonth: monthC.reduce((s, c) => s + c.expected, 0),
    commissionReceivedMonth: monthC.reduce((s, c) => s + (c.received ?? 0), 0),
    commissionYearReceived: comms.filter((c) => c.competence.startsWith(year)).reduce((s, c) => s + (c.received ?? 0), 0),
    conversion: won + lost ? won / (won + lost) : 0,
    renew30: renew(30), renew60: renew(60), renew90: renew(90),
    openTasks: db.tasks.filter((t) => t.status === "aberta" && (!t.party || canSeeParty(db, user, t.party))).length,
    overdueTasks: db.tasks.filter((t) => t.status === "aberta" && t.due < today && (!t.party || canSeeParty(db, user, t.party))).length,
    pendingDocs: db.documents.filter((d) => d.status === "aguardando_revisao").length,
    hoursSaved30: minutes / 60,
    automationRuns30: db.automationRuns.filter((r) => daysBetween(r.at.slice(0, 10), today) <= 30).length,
  };
}

export function groupSum<T>(items: T[], key: (x: T) => string, val: (x: T) => number) {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + val(it));
  return [...m.entries()].map(([k, v]) => ({ key: k, value: v })).sort((a, b) => b.value - a.value);
}
