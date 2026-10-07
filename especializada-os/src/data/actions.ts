/**
 * Casos de uso (application services) — funções puras DB → DB.
 * Na DEMO rodam no navegador; em produção as MESMAS regras rodam no servidor
 * (server actions / route handlers) sobre o repositório Postgres.
 * Toda alteração relevante gera AuditLog e, quando aplicável, dispara automações.
 */
import type {
  Commission, DB, DocumentRecord, ExtractedField, Opportunity, PartyRef, PipelineStage, Policy, Proposal,
  Quote, QuoteResult, Task, User, Person, Company,
} from "@/domain/types";
import { addDays, addMonths, nowISO, todayISO } from "@/lib/dates";
import { renewalChecklist, runAutomations } from "@/domain/engines/automation";
import { crossSellFor } from "@/domain/engines/crosssell";
import { partyName } from "@/domain/engines/queries";
import { lineLabel } from "@/domain/products";

import { audit, interaction, uid } from "./history";

export { uid };

function automate(db: DB) {
  return runAutomations(db, todayISO()).db;
}

// ───────── Clientes
export function createPerson(db: DB, user: User | null, data: Omit<Person, "id" | "demo">): { db: DB; id: string } {
  const id = uid("p");
  let next: DB = { ...db, persons: [...db.persons, { ...data, id, demo: true }] };
  next = audit(next, user, { entity: "Person", entityId: id, action: "create", summary: `Cliente ${data.name} cadastrado`, source: "ui" });
  next = clientCreatedAutomation(next, { type: "person", id });
  return { db: next, id };
}
export function createCompany(db: DB, user: User | null, data: Omit<Company, "id" | "demo">): { db: DB; id: string } {
  const id = uid("c");
  let next: DB = { ...db, companies: [...db.companies, { ...data, id, demo: true }] };
  next = audit(next, user, { entity: "Company", entityId: id, action: "create", summary: `Empresa ${data.tradeName} cadastrada`, source: "ui" });
  next = clientCreatedAutomation(next, { type: "company", id });
  return { db: next, id };
}
function clientCreatedAutomation(db: DB, ref: PartyRef): DB {
  const auto = db.automations.find((a) => a.id === "auto-client-created");
  if (!auto?.enabled) return db;
  const sugg = crossSellFor(db, ref, todayISO());
  return {
    ...db,
    automationRuns: [...db.automationRuns, { id: uid("run"), automationId: auto.id, at: nowISO(), summary: `Cliente ${partyName(db, ref)} analisado: ${sugg.length} oportunidade(s) sugerida(s)`, refs: [{ type: ref.type, id: ref.id }], minutesSaved: auto.minutesSavedPerRun }],
  };
}

export function updatePerson(db: DB, user: User | null, id: string, patch: Partial<Person>): DB {
  const before = db.persons.find((p) => p.id === id);
  if (!before) return db;
  const changes = Object.entries(patch).filter(([k, v]) => (before as unknown as Record<string, unknown>)[k] !== v).map(([field, after]) => ({ field, before: (before as unknown as Record<string, unknown>)[field], after }));
  if (!changes.length) return db;
  const next = { ...db, persons: db.persons.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
  return audit(next, user, { entity: "Person", entityId: id, action: "update", summary: `Dados de ${before.name} atualizados`, changes, source: "ui" });
}

export function addToHousehold(db: DB, user: User | null, householdId: string | null, titularId: string, member: Omit<Person, "id" | "demo">, relation: import("@/domain/types").HouseholdRelation): DB {
  const pid = uid("p");
  let next: DB = { ...db, persons: [...db.persons, { ...member, id: pid, demo: true }] };
  if (householdId) {
    next = { ...next, households: next.households.map((h) => (h.id === householdId ? { ...h, members: [...h.members, { personId: pid, relation }] } : h)) };
  } else {
    const titular = db.persons.find((p) => p.id === titularId)!;
    const surname = titular.name.split(" ").slice(-1)[0];
    next = { ...next, households: [...next.households, { id: uid("h"), name: `Família ${surname}`, addressId: titular.addressId, members: [{ personId: titularId, relation: "titular" }, { personId: pid, relation }], demo: true }] };
  }
  return audit(next, user, { entity: "Household", entityId: householdId ?? titularId, action: "update", summary: `${member.name} adicionado(a) à família`, source: "ui" });
}

// ───────── CRM
export function moveOpportunity(db: DB, user: User | null, id: string, stage: PipelineStage, lostReason?: string): DB {
  const o = db.opportunities.find((x) => x.id === id);
  if (!o || o.stage === stage) return db;
  const at = nowISO();
  const next = { ...db, opportunities: db.opportunities.map((x) => (x.id === id ? { ...x, stage, lostReason: stage === "perdido" ? lostReason ?? x.lostReason : undefined, updatedAt: at, stageHistory: [...x.stageHistory, { stage, at, by: user?.id ?? "sistema" }] } : x)) };
  return audit(next, user, { entity: "Opportunity", entityId: id, action: "update", summary: `Oportunidade "${o.title}" movida para ${stage}`, changes: [{ field: "stage", before: o.stage, after: stage }], source: "ui" });
}

export function createOpportunity(db: DB, user: User | null, data: Pick<Opportunity, "title" | "party" | "line" | "estimatedPremium"> & Partial<Opportunity>): { db: DB; id: string } {
  const id = uid("o");
  const at = nowISO();
  const opp: Opportunity = { id, stage: "lead", ownerId: user?.id ?? "u-ana", origin: "manual", createdAt: at, updatedAt: at, stageHistory: [{ stage: data.stage ?? "lead", at, by: user?.id ?? "sistema" }], demo: true, ...data };
  return { db: audit({ ...db, opportunities: [...db.opportunities, opp] }, user, { entity: "Opportunity", entityId: id, action: "create", summary: `Oportunidade "${opp.title}" criada`, source: "ui" }), id };
}

// ───────── Cotações
export function saveQuote(db: DB, user: User | null, q: Omit<Quote, "id" | "createdAt" | "createdBy" | "demo">): { db: DB; id: string } {
  const id = uid("q");
  const quote: Quote = { ...q, id, createdAt: nowISO(), createdBy: user?.id ?? "u-ana", demo: true };
  let next: DB = { ...db, quotes: [quote, ...db.quotes] };
  // vincula/abre oportunidade no CRM
  let oppId = q.opportunityId;
  if (!oppId) {
    const existing = next.opportunities.find((o) => o.party.type === q.party.type && o.party.id === q.party.id && o.line === q.line && !["emitido", "perdido"].includes(o.stage));
    if (existing) oppId = existing.id;
    else {
      const best = q.results.filter((r) => r.status === "ok").sort((a, b) => a.annualPremium - b.annualPremium)[0];
      const r = createOpportunity(next, user, { title: `${lineLabel(q.line)} — ${partyName(next, q.party)}`, party: q.party, line: q.line, estimatedPremium: best?.annualPremium ?? 0, stage: "cotacao" });
      next = r.db;
      oppId = r.id;
    }
  }
  next = { ...next, quotes: next.quotes.map((x) => (x.id === id ? { ...x, opportunityId: oppId } : x)), opportunities: next.opportunities.map((o) => (o.id === oppId ? { ...o, quoteId: id } : o)) };
  const opp = next.opportunities.find((o) => o.id === oppId);
  if (opp && ["lead", "contato", "levantamento"].includes(opp.stage)) next = moveOpportunity(next, user, opp.id, "cotacao");
  // renovação vinculada avança
  if (opp?.renewalOfPolicyId) next = { ...next, renewals: next.renewals.map((r) => (r.policyId === opp.renewalOfPolicyId ? { ...r, status: "cotando", checklist: r.checklist.map((c) => (c.key === "cotacao" ? { ...c, done: true } : c)) } : r)) };
  next = interaction(next, { party: q.party, channel: "sistema", direction: "interno", summary: `Cotação de ${lineLabel(q.line)} calculada (${q.results.length} resultado(s))`, userId: user?.id });
  return { db: audit(next, user, { entity: "Quote", entityId: id, action: "create", summary: `Cotação de ${lineLabel(q.line)} criada`, source: "ui" }), id };
}

export function addManualResult(db: DB, user: User | null, quoteId: string, result: QuoteResult): DB {
  const next = { ...db, quotes: db.quotes.map((q) => (q.id === quoteId ? { ...q, results: q.results.map((r) => (r.insurerId === result.insurerId && r.status === "manual_pendente" ? result : r)) } : q)) };
  return audit(next, user, { entity: "Quote", entityId: quoteId, action: "update", summary: `Resultado manual registrado (${result.insurerId})`, source: "ui" });
}

// ───────── Propostas
export function createProposal(db: DB, user: User | null, data: { quoteId: string; optionResultIds: string[]; recommendedResultId?: string; recommendationReason?: string; need: string; validDays?: number }): { db: DB; id: string } {
  const q = db.quotes.find((x) => x.id === data.quoteId)!;
  const id = uid("pr");
  const code = `PRP-${todayISO().slice(0, 4)}-${String(150 + db.proposals.length).padStart(4, "0")}`;
  const pr: Proposal = { id, code, quoteId: q.id, party: q.party, line: q.line, optionResultIds: data.optionResultIds, recommendedResultId: data.recommendedResultId, recommendationReason: data.recommendationReason, need: data.need, status: "rascunho", validUntil: addDays(todayISO(), data.validDays ?? 10), createdAt: nowISO(), ownerId: user?.id ?? "u-ana", demo: true };
  let next: DB = { ...db, proposals: [pr, ...db.proposals], quotes: db.quotes.map((x) => (x.id === q.id ? { ...x, status: "proposta_gerada" } : x)) };
  if (q.opportunityId) next = { ...next, opportunities: next.opportunities.map((o) => (o.id === q.opportunityId ? { ...o, proposalId: id } : o)) };
  return { db: audit(next, user, { entity: "Proposal", entityId: id, action: "create", summary: `Proposta ${code} gerada`, source: "ui" }), id };
}

export function sendProposal(db: DB, user: User | null, id: string, channel: "whatsapp" | "email" | "link"): DB {
  const pr = db.proposals.find((p) => p.id === id);
  if (!pr) return db;
  let next: DB = { ...db, proposals: db.proposals.map((p) => (p.id === id ? { ...p, status: p.status === "rascunho" ? "enviada" : p.status, sentAt: p.sentAt ?? nowISO() } : p)) };
  const q = db.quotes.find((x) => x.id === pr.quoteId);
  if (q?.opportunityId) next = moveOpportunity(next, user, q.opportunityId, "proposta");
  const opp = next.opportunities.find((o) => o.id === q?.opportunityId);
  if (opp?.renewalOfPolicyId) next = { ...next, renewals: next.renewals.map((r) => (r.policyId === opp.renewalOfPolicyId ? { ...r, status: "proposta_enviada", checklist: r.checklist.map((c) => (c.key === "proposta" ? { ...c, done: true } : c)) } : r)) };
  next = interaction(next, { party: pr.party, channel: channel === "link" ? "sistema" : channel, direction: "saida", summary: `Proposta ${pr.code} enviada (${channel})`, userId: user?.id });
  return automate(audit(next, user, { entity: "Proposal", entityId: id, action: "update", summary: `Proposta ${pr.code} enviada por ${channel}`, source: "ui" }));
}

export function markProposalViewed(db: DB, id: string): DB {
  const pr = db.proposals.find((p) => p.id === id);
  if (!pr || pr.status !== "enviada") return db;
  return interaction({ ...db, proposals: db.proposals.map((p) => (p.id === id ? { ...p, status: "visualizada", viewedAt: nowISO() } : p)) }, { party: pr.party, channel: "sistema", direction: "interno", summary: `Proposta ${pr.code} visualizada pelo cliente` });
}

export function decideProposal(db: DB, user: User | null, id: string, decision: "aceita" | "recusada", resultId?: string): DB {
  const pr = db.proposals.find((p) => p.id === id);
  if (!pr) return db;
  let next: DB = { ...db, proposals: db.proposals.map((p) => (p.id === id ? { ...p, status: decision, decidedAt: nowISO(), acceptedResultId: decision === "aceita" ? resultId ?? p.recommendedResultId : undefined } : p)) };
  // follow-ups da proposta deixam de fazer sentido
  next = { ...next, tasks: next.tasks.map((t) => (t.status === "aberta" && t.related?.type === "proposal" && t.related.id === id && t.category === "follow_up" ? { ...t, status: "concluida", completedAt: nowISO() } : t)) };
  const q = db.quotes.find((x) => x.id === pr.quoteId);
  if (q?.opportunityId) next = moveOpportunity(next, user, q.opportunityId, decision === "aceita" ? "aprovado" : "perdido", decision === "recusada" ? "Proposta recusada pelo cliente" : undefined);
  next = interaction(next, { party: pr.party, channel: "sistema", direction: "interno", summary: `Proposta ${pr.code} ${decision}`, userId: user?.id });
  if (decision === "aceita") {
    next = { ...next, tasks: [...next.tasks, { id: uid("t"), title: `Transmitir proposta ${pr.code} e acompanhar emissão`, category: "emissao", party: pr.party, related: { type: "proposal", id }, due: todayISO(), ownerId: "u-bianca", status: "aberta", waitingOn: "seguradora", waitingSince: todayISO(), origin: "manual", createdAt: nowISO(), demo: true } satisfies Task] };
  }
  return audit(next, user, { entity: "Proposal", entityId: id, action: "update", summary: `Proposta ${pr.code} marcada como ${decision}`, changes: [{ field: "status", before: pr.status, after: decision }], source: "ui" });
}

// ───────── Apólices
export function commissionsFor(policy: Policy): Commission[] {
  const monthly = Math.round(((policy.annualPremium * policy.commissionPct) / 12) * 100) / 100;
  return Array.from({ length: 12 }, (_, k) => {
    const comp = addMonths(`${policy.start.slice(0, 7)}-01`, k).slice(0, 7);
    return { id: `cm-${policy.id}-${comp}`, policyId: policy.id, competence: comp, expected: monthly, status: "prevista" as const, demo: true as const };
  });
}

/** Emite apólice a partir de proposta aceita: arquiva, cria renovação programada e comissões. */
export function issuePolicyFromProposal(db: DB, user: User | null, proposalId: string, policyNumber: string): { db: DB; id: string } {
  const pr = db.proposals.find((p) => p.id === proposalId)!;
  const q = db.quotes.find((x) => x.id === pr.quoteId)!;
  const res = q.results.find((r) => r.id === (pr.acceptedResultId ?? pr.recommendedResultId))!;
  const opp = db.opportunities.find((o) => o.id === q.opportunityId);
  const prev = opp?.renewalOfPolicyId ? db.policies.find((p) => p.id === opp.renewalOfPolicyId) : undefined;
  const start = prev ? prev.end : todayISO();
  const id = uid("pol");
  const req = q.request as unknown as Record<string, unknown>;
  const policy: Policy = {
    id, number: policyNumber, holder: pr.party, insurerId: res.insurerId, line: pr.line, productName: res.productName, start, end: addDays(start, 365), annualPremium: res.annualPremium, commissionPct: res.commissionPct,
    ownerId: pr.ownerId, status: "vigente", insuredAssetId: (req.vehicleId as string) ?? prev?.insuredAssetId, healthPlanId: res.healthPlanId, beneficiaryIds: (req.beneficiaries as { personId?: string }[] | undefined)?.map((b) => b.personId!).filter(Boolean) ?? prev?.beneficiaryIds,
    deductible: res.deductible, proposalId, renewedFromId: prev?.id, dataSource: { kind: "proposta", at: nowISO(), by: user?.id }, demo: true,
  };
  let next: DB = { ...db, policies: [...db.policies.map((p) => (p.id === prev?.id ? { ...p, status: "renovada" as const } : p)), policy], commissions: [...db.commissions, ...commissionsFor(policy)] };
  next = { ...next, documents: [...next.documents, { id: uid("d"), name: `Apólice ${policyNumber}.pdf`, kind: "apolice", party: pr.party, policyId: id, sizeKb: 320, mime: "application/pdf", uploadedAt: nowISO(), uploadedBy: user?.id ?? "u-bianca", channel: "sistema", status: "arquivado", demo: true } satisfies DocumentRecord] };
  if (opp) next = moveOpportunity(next, user, opp.id, "emitido");
  if (prev) next = { ...next, renewals: next.renewals.map((r) => (r.policyId === prev.id ? { ...r, status: "renovada", checklist: r.checklist.map((c) => ({ ...c, done: true })) } : r)), tasks: next.tasks.map((t) => (t.status === "aberta" && ((t.related?.type === "renewal" && t.related.id === `ren-${prev.id}`) || (t.related?.type === "policy" && t.related.id === prev.id)) ? { ...t, status: "concluida", completedAt: nowISO() } : t)) };
  next = { ...next, tasks: next.tasks.map((t) => (t.status === "aberta" && t.related?.type === "proposal" && t.related.id === proposalId ? { ...t, status: "concluida", completedAt: nowISO() } : t)) };
  const auto = next.automations.find((a) => a.id === "auto-policy-issued")!;
  next = { ...next, automationRuns: [...next.automationRuns, { id: uid("run"), automationId: auto.id, at: nowISO(), summary: `Apólice ${policyNumber} emitida: documento arquivado, renovação programada para ${addDays(policy.end, -60)} e 12 comissões previstas`, refs: [{ type: "policy", id }], minutesSaved: auto.minutesSavedPerRun }] };
  next = interaction(next, { party: pr.party, channel: "sistema", direction: "interno", summary: `Apólice ${policyNumber} emitida (${lineLabel(pr.line)})`, userId: user?.id });
  // promove lead a cliente ativo
  if (pr.party.type === "person") next = { ...next, persons: next.persons.map((p) => (p.id === pr.party.id && p.clientStatus !== "ativo" ? { ...p, clientStatus: "ativo", clientSince: p.clientSince ?? todayISO() } : p)) };
  return { db: automate(audit(next, user, { entity: "Policy", entityId: id, action: "create", summary: `Apólice ${policyNumber} emitida a partir da proposta ${pr.code}`, source: "ui" })), id };
}

// ───────── Documentos / Document AI
export function addDocument(db: DB, user: User | null, doc: Omit<DocumentRecord, "id" | "demo" | "uploadedAt" | "uploadedBy">): { db: DB; id: string } {
  const id = uid("d");
  const next: DB = { ...db, documents: [{ ...doc, id, uploadedAt: nowISO(), uploadedBy: user?.id ?? "u-bianca", demo: true }, ...db.documents] };
  return { db: automate(audit(next, user, { entity: "Document", entityId: id, action: "create", summary: `Documento ${doc.name} recebido (${doc.channel})`, source: doc.extraction ? "document-ai" : "ui" })), id };
}

/** Confirmação humana do Document AI: aplica os campos revisados. */
export function confirmExtraction(db: DB, user: User | null, docId: string, fields: ExtractedField[], target: { party: PartyRef; mode: "nova_apolice" | "atualizar_apolice" | "somente_arquivar"; policyId?: string }): DB {
  const doc = db.documents.find((d) => d.id === docId);
  if (!doc) return db;
  const f = Object.fromEntries(fields.map((x) => [x.key, x.value]));
  let next: DB = { ...db, documents: db.documents.map((d) => (d.id === docId ? { ...d, party: target.party, status: "processado", extraction: d.extraction ? { ...d.extraction, fields, reviewedBy: user?.id } : { fields, parser: "manual", at: nowISO(), reviewedBy: user?.id } } : d)) };
  next = { ...next, tasks: next.tasks.map((t) => (t.status === "aberta" && t.related?.type === "document" && t.related.id === docId ? { ...t, status: "concluida", completedAt: nowISO() } : t)) };
  const insurer = db.insurers.find((i) => i.name === f.insurer);
  if (target.mode === "nova_apolice" && f.policyNumber && f.start && f.end && insurer) {
    const prev = db.policies.find((p) => p.status === "vigente" && p.holder.type === target.party.type && p.holder.id === target.party.id && p.line === f.line && p.insurerId === insurer.id);
    const id = uid("pol");
    const policy: Policy = {
      id, number: f.policyNumber, holder: target.party, insurerId: insurer.id, line: (f.line as Policy["line"]) ?? "outros", productName: `${lineLabel((f.line as Policy["line"]) ?? "outros")} (via Document AI)`, start: f.start, end: f.end,
      annualPremium: Number(f.premium ?? 0), commissionPct: f.commissionPct ? Number(f.commissionPct) / 100 : 0, ownerId: user?.id ?? "u-ana", status: f.start > todayISO() ? "em_emissao" : "vigente",
      capitalInsured: f.capital ? Number(f.capital) : undefined, deductible: f.deductible ? Number(f.deductible) : undefined, insuredAssetId: f.plate ? db.assets.find((a) => a.type === "vehicle" && a.plate === f.plate)?.id : prev?.insuredAssetId,
      renewedFromId: prev?.id, dataSource: { kind: "document-ai", at: nowISO(), by: user?.id }, demo: true,
    };
    next = { ...next, policies: [...next.policies.map((p) => (p.id === prev?.id ? { ...p, status: "renovada" as const } : p)), policy], commissions: [...next.commissions, ...commissionsFor(policy)], documents: next.documents.map((d) => (d.id === docId ? { ...d, policyId: id } : d)) };
    if (prev) {
      next = { ...next, renewals: next.renewals.map((r) => (r.policyId === prev.id ? { ...r, status: "renovada", checklist: r.checklist.map((c) => ({ ...c, done: true })) } : r)), tasks: next.tasks.map((t) => (t.status === "aberta" && ((t.related?.type === "renewal" && t.related.id === `ren-${prev.id}`) || (t.related?.type === "policy" && t.related.id === prev.id)) ? { ...t, status: "concluida", completedAt: nowISO() } : t)) };
      const oppR = next.opportunities.find((o) => o.renewalOfPolicyId === prev.id && !["emitido", "perdido"].includes(o.stage));
      if (oppR) next = moveOpportunity(next, user, oppR.id, "emitido");
    }
    const auto = next.automations.find((a) => a.id === "auto-policy-issued")!;
    next = { ...next, automationRuns: [...next.automationRuns, { id: uid("run"), automationId: auto.id, at: nowISO(), summary: `Apólice ${f.policyNumber} criada via Document AI (${fields.length} campos preenchidos automaticamente)${prev ? ", renovação anterior concluída" : ""}`, refs: [{ type: "policy", id }], minutesSaved: auto.minutesSavedPerRun + Math.round(fields.length * 0.5) }] };
    next = audit(next, user, { entity: "Policy", entityId: id, action: "create", summary: `Apólice ${f.policyNumber} criada a partir de documento revisado`, changes: fields.map((x) => ({ field: x.key, before: null, after: x.value })), source: "document-ai" });
  }
  next = interaction(next, { party: target.party, channel: "sistema", direction: "interno", summary: `Documento "${doc.name}" revisado e ${target.mode === "nova_apolice" ? "apólice cadastrada" : "arquivado"}`, userId: user?.id });
  return automate(audit(next, user, { entity: "Document", entityId: docId, action: "update", summary: `Extração do documento ${doc.name} confirmada por humano`, source: "document-ai" }));
}

// ───────── Tarefas
export function completeTask(db: DB, user: User | null, id: string): DB {
  const t = db.tasks.find((x) => x.id === id);
  if (!t) return db;
  return audit({ ...db, tasks: db.tasks.map((x) => (x.id === id ? { ...x, status: x.status === "aberta" ? "concluida" : "aberta", completedAt: x.status === "aberta" ? nowISO() : undefined } : x)) }, user, { entity: "Task", entityId: id, action: "update", summary: `Tarefa "${t.title}" ${t.status === "aberta" ? "concluída" : "reaberta"}`, source: "ui" });
}
export function createTask(db: DB, user: User | null, t: Omit<Task, "id" | "status" | "createdAt" | "demo" | "origin">): DB {
  const id = uid("t");
  return audit({ ...db, tasks: [...db.tasks, { ...t, id, status: "aberta", origin: "manual", createdAt: nowISO(), demo: true }] }, user, { entity: "Task", entityId: id, action: "create", summary: `Tarefa "${t.title}" criada`, source: "ui" });
}
export function snoozeTask(db: DB, id: string, days: number): DB {
  return { ...db, tasks: db.tasks.map((t) => (t.id === id ? { ...t, due: addDays(todayISO(), days) } : t)) };
}

// ───────── Renovações
export function updateRenewal(db: DB, user: User | null, id: string, patch: Partial<import("@/domain/types").Renewal>): DB {
  return audit({ ...db, renewals: db.renewals.map((r) => (r.id === id ? { ...r, ...patch } : r)) }, user, { entity: "Renewal", entityId: id, action: "update", summary: "Renovação atualizada", source: "ui" });
}
/** Renovação em lote (visão futura do briefing) — tudo fica para revisão humana. */
export function batchStartRenewals(db: DB, user: User | null, days: number): { db: DB; created: number } {
  const before = db.renewals.length;
  const windows = Array.from(new Set([...db.settings.renewalWindows, days]));
  const tmp = runAutomations({ ...db, settings: { ...db.settings, renewalWindows: windows } }, todayISO()).db;
  const next = { ...tmp, settings: db.settings };
  const created = next.renewals.length - before;
  next.renewals.forEach((r) => { if (r.status === "identificada" && !r.checklist.length) r.checklist = renewalChecklist(next.policies.find((p) => p.id === r.policyId)!); });
  return { db: audit(next, user, { entity: "Renewal", entityId: "lote", action: "automation", summary: `Renovação em lote (próximos ${days} dias): ${created} processo(s) iniciado(s) para revisão`, source: "ai-assistant" }), created };
}

// ───────── Configurações
export function setSettings(db: DB, user: User | null, patch: Partial<DB["settings"]>): DB {
  return audit({ ...db, settings: { ...db.settings, ...patch } }, user, { entity: "Settings", entityId: "org", action: "update", summary: "Configurações alteradas", changes: Object.keys(patch).map((k) => ({ field: k, before: (db.settings as unknown as Record<string, unknown>)[k], after: (patch as Record<string, unknown>)[k] })), source: "ui" });
}
export function toggleAutomation(db: DB, user: User | null, id: string): DB {
  const a = db.automations.find((x) => x.id === id)!;
  return audit({ ...db, automations: db.automations.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)) }, user, { entity: "Automation", entityId: id, action: "update", summary: `Automação "${a.name}" ${a.enabled ? "desativada" : "ativada"}`, source: "ui" });
}
export function logSensitiveView(db: DB, user: User | null, entity: string, entityId: string, what: string): DB {
  return audit(db, user, { entity, entityId, action: "view_sensitive", summary: `Visualização de ${what}`, source: "ui" });
}
