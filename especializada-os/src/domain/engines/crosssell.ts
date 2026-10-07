/**
 * Cross-sell determinístico e explicável. Sugere oportunidades a partir de
 * sinais reais (ativos sem seguro, dependentes sem vida, empresa sem saúde…).
 * Nunca dispara mensagem automática — só sugere ao corretor.
 */
import type { DB, PartyRef, ProductLine } from "../types";
import { activePolicies, assetsOf, companiesOf, householdOf, policiesOfParty, sameParty } from "./queries";
import { ageOn } from "@/lib/dates";

export interface CrossSellSuggestion {
  line: ProductLine;
  reason: string;
  strength: "alta" | "media";
  party: PartyRef;
}

export function crossSellFor(db: DB, ref: PartyRef, today: string): CrossSellSuggestion[] {
  const out: CrossSellSuggestion[] = [];
  const pols = activePolicies(policiesOfParty(db, ref));
  const has = (l: ProductLine) => pols.some((p) => p.line === l);
  const openOpp = (l: ProductLine) => db.opportunities.some((o) => sameParty(o.party, ref) && o.line === l && !["emitido", "perdido"].includes(o.stage));
  const push = (s: CrossSellSuggestion) => { if (!openOpp(s.line)) out.push(s); };
  const assets = assetsOf(db, ref);
  const insuredAssets = new Set(db.policies.filter((p) => p.status === "vigente").map((p) => p.insuredAssetId));

  for (const a of assets) {
    if (a.type === "property" && !insuredAssets.has(a.id) && a.use !== "comercial") push({ line: "residencial", reason: `Possui imóvel (${a.kind}, uso ${a.use}) sem seguro residencial ativo`, strength: "alta", party: ref });
    if (a.type === "vehicle" && !insuredAssets.has(a.id)) push({ line: "auto", reason: `Veículo ${a.make} ${a.model} ${a.yearModel} sem apólice ativa`, strength: "alta", party: ref });
    if (a.type === "boat" && !insuredAssets.has(a.id)) push({ line: "nautico", reason: `Embarcação ${a.name} sem seguro náutico`, strength: "alta", party: ref });
  }
  if (ref.type === "person") {
    const person = db.persons.find((p) => p.id === ref.id)!;
    const hh = householdOf(db, ref.id);
    const isTitular = hh?.members.find((m) => m.personId === ref.id)?.relation === "titular";
    const dependents = hh?.members.filter((m) => m.relation === "filho(a)" || m.relation === "cônjuge") ?? [];
    const age = ageOn(person.birthDate, today);
    if (isTitular && dependents.length && !has("vida") && age < 65) push({ line: "vida", reason: `Titular com ${dependents.length} dependente(s) e sem seguro de vida`, strength: "alta", party: ref });
    if (!has("saude") && !hh?.members.some((m) => db.policies.some((p) => p.status === "vigente" && p.line === "saude" && p.beneficiaryIds?.includes(m.personId)))) push({ line: "saude", reason: "Nenhum membro da família com plano de saúde ativo na carteira", strength: "media", party: ref });
    if (companiesOf(db, ref.id).some((c) => c.rel.role === "sócio") && !has("vida") && age < 65) {
      // já coberto pela regra de dependentes, se aplicável
      if (!out.some((o) => o.line === "vida")) push({ line: "vida", reason: "Sócio de empresa sem seguro de vida (proteção de renda/sucessão)", strength: "media", party: ref });
    }
    if (person.profession && /m[ée]dic|dentist|advogad|engenheir|arquitet/i.test(person.profession) && !has("rc")) push({ line: "rc", reason: `Profissão (${person.profession}) com exposição a responsabilidade civil profissional`, strength: "media", party: ref });
    if (age >= 25 && age <= 60 && pols.length >= 2 && !has("previdencia")) push({ line: "previdencia", reason: "Cliente com relacionamento consolidado (2+ apólices) e sem previdência", strength: "media", party: ref });
  } else {
    const c = db.companies.find((x) => x.id === ref.id)!;
    if (c.employees >= 3 && !has("saude")) push({ line: "saude", reason: `${c.employees} funcionários e sem plano de saúde empresarial`, strength: "alta", party: ref });
    if (c.employees >= 5 && !has("vida")) push({ line: "vida", reason: `${c.employees} funcionários sem vida em grupo (benefício e exigência de convenções)`, strength: "alta", party: ref });
    if (!has("empresarial")) push({ line: "empresarial", reason: "Sem seguro empresarial para o estabelecimento", strength: "alta", party: ref });
    if (c.employees >= 10 && !has("cyber")) push({ line: "cyber", reason: "Empresa com dados de clientes/funcionários sem seguro cyber", strength: "media", party: ref });
    if (!has("rc") && /sa[úu]de|constru|alimenta/i.test(c.sector)) push({ line: "rc", reason: `Setor (${c.sector}) com exposição relevante a RC`, strength: "media", party: ref });
  }
  return out;
}
