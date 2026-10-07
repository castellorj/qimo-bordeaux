/**
 * ESPECIALIZADA AI — motor da DEMO.
 * Interpreta a pergunta em português (regras de intenção), executa FERRAMENTAS
 * determinísticas sobre os dados e devolve a resposta com a origem dos dados.
 * Em produção, um LLM substitui apenas a etapa de interpretação/redação e
 * chama exatamente estas ferramentas (ver docs/AI_ARCHITECTURE.md).
 * Regra de ouro: se não há ferramenta/dado para responder, diz que não sabe.
 */
import type { DB, HealthQuoteRequest, PartyRef, ProductLine, User } from "../types";
import { daysBetween, ageOn } from "@/lib/dates";
import { money0, date, firstName } from "@/lib/format";
import { norm, providerSimilarity } from "@/lib/text";
import { lineLabel } from "../products";
import { can, canSeeParty } from "../rbac";
import { operationsQueue } from "./priority";
import { crossSellFor } from "./crosssell";
import { activePolicies, clientValue, insurerName, partyHref, partyName, partyPhone, policiesExpiring, policiesOfParty, sameParty } from "./queries";
import { plansForProvider, recommend, whatChanges } from "./health";
import { waLink } from "@/integrations/whatsapp";

export interface AssistantAnswer {
  intent: string;
  text: string;
  bullets?: string[];
  table?: { columns: string[]; rows: { cells: string[]; href?: string }[] };
  sources: string[];
  actions?: { label: string; href?: string; command?: "batch_renewals"; external?: boolean }[];
}

export const SUGGESTED_QUESTIONS = [
  "Quais clientes precisam de atenção hoje?",
  "Quem tem seguro vencendo este mês?",
  "Quem está aguardando proposta?",
  "Quais clientes têm Auto mas não Residencial?",
  "Qual plano atende a Família Pereira?",
  "Quais planos atendem o Hospital Atlântico D'Or?",
  "Compare os planos Bradesco Demo Prime e Amil Demo Plus",
  "Escreva um WhatsApp para o Thiago Mendes",
  "Quem está há mais de 5 dias sem resposta?",
  "Quanto temos de comissão prevista?",
  "Quais são nossos maiores clientes?",
  "Quais oportunidades comerciais temos hoje?",
  "Prepare uma proposta para a Fernanda Souza",
  "Renove todos os seguros que vencem nos próximos 30 dias",
];

const LINE_WORDS: [ProductLine, RegExp][] = [
  ["saude", /sa[uú]de/], ["auto", /\bauto(m[oó]vel)?\b|carro/], ["residencial", /residencial|resid[eê]ncia/], ["vida", /\bvida\b/],
  ["viagem", /viagem/], ["empresarial", /empresarial/], ["odonto", /odonto/], ["previdencia", /previd[eê]ncia/], ["rc", /\brc\b|responsabilidade civil/],
  ["cyber", /cyber/], ["nautico", /n[aá]utico|barco|embarca/], ["garantia", /garantia/],
];

function findLines(q: string): ProductLine[] {
  const found: { line: ProductLine; at: number }[] = [];
  for (const [l, rx] of LINE_WORDS) {
    const m = q.match(rx);
    if (m && m.index != null) found.push({ line: l, at: m.index });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.line);
}

function findParty(db: DB, q: string, user?: User | null): PartyRef | undefined {
  const nq = norm(q);
  let best: { ref: PartyRef; s: number } | undefined;
  for (const p of db.persons) {
    if (!canSeeParty(db, user, { type: "person", id: p.id })) continue;
    const n = norm(p.name);
    const parts = n.split(" ");
    const s = nq.includes(n) ? 3 : parts.length > 1 && nq.includes(parts[0]) && nq.includes(parts[parts.length - 1]) ? 2 : 0;
    const bonus = p.clientStatus ? 0.5 : 0;
    if (s && (!best || s + bonus > best.s)) best = { ref: { type: "person", id: p.id }, s: s + bonus };
  }
  for (const c of db.companies) {
    if (!canSeeParty(db, user, { type: "company", id: c.id })) continue;
    if (nq.includes(norm(c.tradeName)) || nq.includes(norm(c.tradeName.replace(/^empresa /i, "")))) {
      if (!best || 3 > best.s) best = { ref: { type: "company", id: c.id }, s: 3 };
    }
  }
  return best?.ref;
}

function findHousehold(db: DB, q: string) {
  const nq = norm(q);
  return db.households.find((h) => nq.includes(norm(h.name)) || nq.includes(norm(h.name.replace("Família ", "familia "))));
}

function findProvider(db: DB, text: string) {
  let best: { id: string; s: number } | undefined;
  for (const p of db.providers) {
    const s = Math.max(providerSimilarity(text, p.name), ...p.aliases.map((a) => providerSimilarity(text, a)));
    if (!best || s > best.s) best = { id: p.id, s };
  }
  return best && best.s >= 0.55 ? db.providers.find((p) => p.id === best!.id) : undefined;
}

function findPlans(db: DB, q: string) {
  const nq = norm(q);
  return db.healthPlans
    .map((p) => ({ p, idx: nq.indexOf(norm(p.name)) }))
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx)
    .map((x) => x.p);
}

function periodDays(q: string, today: string): { days: number; label: string } {
  const m = q.match(/pr[oó]ximos?\s+(\d+)\s+dias?/) ?? q.match(/(\d+)\s+dias/);
  if (m) return { days: Number(m[1]), label: `próximos ${m[1]} dias` };
  if (/semana/.test(q)) return { days: 7, label: "próximos 7 dias" };
  if (/m[eê]s/.test(q)) {
    const d = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
    return { days: d - Number(today.slice(8, 10)), label: "este mês" };
  }
  return { days: 30, label: "próximos 30 dias" };
}

export function ask(db: DB, question: string, today: string, user?: User | null): AssistantAnswer {
  const q = norm(question);
  const vis = (ref: PartyRef) => canSeeParty(db, user, ref);

  // ── Visão futura: renovação em lote (deixa tudo para revisão humana)
  if (/renov(e|ar)\s+todos/.test(q)) {
    const { days, label } = periodDays(q, today);
    const list = policiesExpiring(db, today, days).filter((x) => vis(x.policy.holder));
    return {
      intent: "batch_renewals",
      text: `Encontrei ${list.length} apólices vigentes que vencem nos ${label}. Posso iniciar o processo de renovação de todas: recuperar os dados anteriores, abrir oportunidade no CRM, montar o checklist ("o que mudou?") e criar as tarefas. Nada é enviado ao cliente sem revisão humana.`,
      table: { columns: ["Cliente", "Ramo", "Seguradora", "Vence", "Prêmio atual", "Renovação"], rows: list.map(({ policy: p, days: d }) => ({ cells: [partyName(db, p.holder), lineLabel(p.line), insurerName(db, p.insurerId), `${date(p.end)} (${d}d)`, money0(p.annualPremium), db.renewals.find((r) => r.policyId === p.id)?.status.replace("_", " ") ?? "não iniciada"], href: `/apolices/${p.id}` })) },
      sources: ["Apólices com status vigente e fim de vigência no período", "Renovações já abertas"],
      actions: [{ label: `Iniciar renovação das ${list.length} apólices (revisão humana)`, command: "batch_renewals" }, { label: "Abrir Renovações", href: "/renovacoes" }],
    };
  }

  // ── Comparar planos
  if (/compar/.test(q) && findPlans(db, q).length >= 2) {
    const [a, b] = findPlans(db, q);
    const ages = [38, 40, 8];
    return {
      intent: "compare_plans",
      text: `Comparação ${a.name} × ${b.name} (preço calculado para uma família de referência: 38, 40 e 8 anos — ajuste no comparador).`,
      bullets: whatChanges(db, a, b, ages),
      sources: [`Tabelas de preço por faixa ANS (${a.name}, ${b.name})`, "Rede credenciada importada (ver data da fonte em Rede Credenciada)"],
      actions: [{ label: "Abrir comparador completo", href: `/rede?modo=comparar&planos=${a.id},${b.id}` }],
    };
  }

  // ── Planos que atendem um hospital/prestador
  if (/planos?.*(atend|aceit|cobr)|(atend|aceit).*planos?/.test(q) && !/familia/.test(q)) {
    const after = question.replace(/.*?(atendem|atende|aceitam|aceita|cobrem|cobre)\s+(o|a|os|as)?\s*/i, "");
    const prov = findProvider(db, after || question);
    if (prov) {
      const list = plansForProvider(db, prov.id);
      return {
        intent: "plans_for_provider",
        text: `${list.length} plano(s) cadastrado(s) atendem ${prov.name} (${prov.district}).`,
        table: { columns: ["Plano", "Operadora", "Serviços", "Fonte da rede"], rows: list.map(({ plan, link }) => { const src = db.networkSources.find((s) => s.id === link.sourceId); return { cells: [plan.name, insurerName(db, plan.insurerId), link.services.join(", "), `${src?.label} · ${date(src?.importedAt)}${src?.status === "expirada" ? " ⚠ expirada" : ""}`], href: `/rede?modo=plano&plano=${plan.id}` }; }) },
        sources: ["Vínculos plano × prestador da rede credenciada importada"],
        actions: [{ label: "Ver no mapa", href: `/rede?modo=prestador&prestador=${prov.id}` }],
      };
    }
  }

  // ── Qual plano atende esta família
  if (/plano/.test(q) && /familia/.test(q)) {
    const hh = findHousehold(db, q);
    if (!hh) return { intent: "plan_for_family", text: "Qual família? Ex.: \"Qual plano atende a Família Pereira?\"", sources: [] };
    const addr = db.addresses.find((a) => a.id === hh.addressId);
    const req: HealthQuoteRequest = { line: "saude", segment: "individual", city: addr?.city ?? "Rio de Janeiro", addressId: addr?.id, lat: addr?.lat, lng: addr?.lng, desiredProviderIds: [], beneficiaries: hh.members.map((m) => { const p = db.persons.find((x) => x.id === m.personId)!; return { personId: p.id, name: p.name, age: ageOn(p.birthDate, today) }; }), accommodation: "apartamento" };
    const rec = recommend(db, req);
    return {
      intent: "plan_for_family",
      text: `${hh.name}: ${req.beneficiaries.length} vidas (${req.beneficiaries.map((b) => `${firstName(b.name)} ${b.age}`).join(", ")}), endereço em ${addr?.district}. Sem hospitais preferidos informados ainda — usei apartamento e proximidade da rede (10 km). Para refinar (hospitais, orçamento, reembolso), abra a cotação.`,
      table: { columns: ["Categoria", "Plano", "Mensal (família)", "Rede ≤10 km"], rows: rec.picks.map((p) => { const e = rec.evaluations.find((x) => x.plan.id === p.planId)!; return { cells: [p.label, `${e.plan.name} (${insurerName(db, e.plan.insurerId)})`, money0(e.monthly), `${e.nearbyCount} prestadores`] }; }) },
      sources: ["Idades calculadas a partir das datas de nascimento cadastradas", "Tabelas por faixa etária ANS dos planos", "Geolocalização da rede credenciada"],
      actions: [{ label: "Abrir cotação de saúde da família", href: `/cotacoes/nova?ramo=saude&familia=${hh.id}` }],
    };
  }

  // ── Vencimentos
  if (/venc/.test(q) && !/sem resposta/.test(q)) {
    const { days, label } = periodDays(q, today);
    const lines = findLines(q);
    const list = policiesExpiring(db, today, days).filter((x) => vis(x.policy.holder) && (!lines.length || lines.includes(x.policy.line)));
    return {
      intent: "expiring",
      text: list.length ? `${list.length} apólice(s) vencem nos ${label}${lines.length ? ` (${lines.map(lineLabel).join(", ")})` : ""}, somando ${money0(list.reduce((s, x) => s + x.policy.annualPremium, 0))} em prêmio anual.` : `Nenhuma apólice vigente vence nos ${label}.`,
      table: { columns: ["Cliente", "Ramo", "Seguradora", "Vencimento", "Prêmio", "Renovação"], rows: list.map(({ policy: p, days: d }) => ({ cells: [partyName(db, p.holder), lineLabel(p.line), insurerName(db, p.insurerId), `${date(p.end)} · ${d}d`, money0(p.annualPremium), db.renewals.find((r) => r.policyId === p.id)?.status.replace(/_/g, " ") ?? "—"], href: `/apolices/${p.id}` })) },
      sources: ["Apólices (status vigente, campo fim de vigência)"],
      actions: [{ label: "Abrir Renovações", href: "/renovacoes" }],
    };
  }

  // ── Sem resposta há mais de N dias
  if (/sem resposta|sem retorno|nao respond/.test(q)) {
    const n = Number(q.match(/(\d+)\s*dias/)?.[1] ?? 5);
    const props = db.proposals.filter((p) => (p.status === "enviada" || p.status === "visualizada") && p.sentAt && daysBetween(p.sentAt.slice(0, 10), today) > n && vis(p.party));
    const tasks = db.tasks.filter((t) => t.status === "aberta" && t.waitingOn === "cliente" && t.waitingSince && daysBetween(t.waitingSince, today) > n && (!t.party || vis(t.party)));
    const rows = [
      ...props.map((p) => ({ cells: [partyName(db, p.party), `Proposta ${p.code}`, `${daysBetween(p.sentAt!.slice(0, 10), today)} dias`, p.status], href: `/propostas/${p.id}` })),
      ...tasks.map((t) => ({ cells: [partyName(db, t.party), t.title, `${daysBetween(t.waitingSince!, today)} dias`, "aguardando cliente"], href: t.party ? partyHref(t.party) : "/tarefas" })),
    ];
    return { intent: "no_reply", text: rows.length ? `${rows.length} item(ns) sem resposta do cliente há mais de ${n} dias.` : `Ninguém está há mais de ${n} dias sem resposta. Com o follow-up automático, propostas sem retorno viram tarefa após ${db.settings.followUpDays} dias.`, table: rows.length ? { columns: ["Cliente", "Item", "Esperando", "Status"], rows } : undefined, sources: ["Propostas enviadas (data de envio)", "Tarefas aguardando cliente (data de início da espera)"] };
  }

  // ── Aguardando proposta / propostas abertas
  if (/aguardando|propostas? (abertas|em aberto)|esperando proposta/.test(q)) {
    const props = db.proposals.filter((p) => ["enviada", "visualizada", "rascunho"].includes(p.status) && vis(p.party));
    const opps = db.opportunities.filter((o) => ["levantamento", "cotacao"].includes(o.stage) && vis(o.party));
    return {
      intent: "awaiting_proposal",
      text: `${opps.length} cliente(s) aguardam proposta (em levantamento/cotação) e ${props.length} proposta(s) estão abertas aguardando decisão.`,
      table: { columns: ["Cliente", "Item", "Situação", "Desde"], rows: [
        ...opps.map((o) => ({ cells: [partyName(db, o.party), o.title, o.stage === "cotacao" ? "Em cotação — falta gerar proposta" : "Levantamento de dados", date(o.createdAt.slice(0, 10))], href: o.quoteId ? `/cotacoes/${o.quoteId}` : partyHref(o.party) })),
        ...props.map((p) => ({ cells: [partyName(db, p.party), `Proposta ${p.code}`, p.status === "rascunho" ? "Rascunho — não enviada" : p.status === "visualizada" ? "Cliente visualizou" : "Enviada", date((p.sentAt ?? p.createdAt).slice(0, 10))], href: `/propostas/${p.id}` })),
      ] },
      sources: ["Oportunidades do CRM (etapas levantamento/cotação)", "Propostas (status rascunho/enviada/visualizada)"],
    };
  }

  // ── Têm X mas não Y
  const lines = findLines(q);
  if (lines.length >= 2 && /(mas|e)\s+(nao|sem)|sem\s/.test(q)) {
    const [hasL, lacksL] = lines;
    const clients: PartyRef[] = [...db.persons.filter((p) => p.clientStatus === "ativo").map((p) => ({ type: "person" as const, id: p.id })), ...db.companies.filter((c) => c.clientStatus === "ativo").map((c) => ({ type: "company" as const, id: c.id }))].filter(vis);
    const res = clients.filter((c) => { const ls = new Set(activePolicies(policiesOfParty(db, c)).map((p) => p.line)); return ls.has(hasL) && !ls.has(lacksL); });
    return {
      intent: "cross_gap",
      text: `${res.length} cliente(s) têm ${lineLabel(hasL)} ativo e não têm ${lineLabel(lacksL)}.`,
      table: { columns: ["Cliente", "Apólices ativas", "Sinal"], rows: res.map((c) => { const sugg = crossSellFor(db, c, today).find((s) => s.line === lacksL); return { cells: [partyName(db, c), [...new Set(activePolicies(policiesOfParty(db, c)).map((p) => lineLabel(p.line)))].join(", "), sugg?.reason ?? "—"], href: partyHref(c) }; }) },
      sources: ["Apólices ativas por cliente (titular ou beneficiário)", "Regras de cross-sell (ativos cadastrados)"],
    };
  }

  // ── Atenção hoje
  if (/atencao|prioridade|o que (eu )?(preciso|devo)|fazer hoje/.test(q)) {
    const items = operationsQueue(db, today, user).slice(0, 10);
    return {
      intent: "attention_today",
      text: `Os ${items.length} itens mais prioritários agora, ordenados pela Central de Operações:`,
      table: { columns: ["Cliente", "O quê", "Por quê", "Prioridade"], rows: items.map((i) => ({ cells: [partyName(db, i.party), i.task.title, i.reasons.join(" · ") || i.primary, String(i.score)], href: i.party ? partyHref(i.party) : "/operacoes" })) },
      sources: ["Tarefas abertas (vencimento, espera, valor em jogo)", "Vencimento das apólices relacionadas"],
      actions: [{ label: "Abrir Central de Operações", href: "/operacoes" }],
    };
  }

  // ── Comissão prevista
  if (/comiss/.test(q)) {
    if (!can(db, user, "commissions.view")) return { intent: "commission_forecast", text: "Seu perfil não tem acesso a informações de comissão (liberadas apenas para o Administrador).", sources: ["Perfis e permissões"] };
    const month = today.slice(0, 7);
    const visPol = new Set(db.policies.filter((p) => vis(p.holder)).map((p) => p.id));
    const cs = db.commissions.filter((c) => visPol.has(c.policyId));
    const byMonth = new Map<string, { exp: number; rec: number }>();
    for (const c of cs.filter((c) => c.competence >= month)) {
      const m = byMonth.get(c.competence) ?? { exp: 0, rec: 0 };
      m.exp += c.expected;
      m.rec += c.received ?? 0;
      byMonth.set(c.competence, m);
    }
    const pending = cs.filter((c) => c.status === "atrasada" || c.status === "divergente");
    return {
      intent: "commission_forecast",
      text: `Comissão prevista para ${month}: ${money0(byMonth.get(month)?.exp ?? 0)} (recebido até agora: ${money0(byMonth.get(month)?.rec ?? 0)}). Há ${pending.length} parcela(s) atrasadas ou divergentes somando ${money0(pending.reduce((s, c) => s + c.expected - (c.received ?? 0), 0))} de diferença.`,
      table: { columns: ["Competência", "Prevista", "Recebida"], rows: [...byMonth.entries()].sort().map(([m, v]) => ({ cells: [m, money0(v.exp), money0(v.rec)], href: "/comissoes" })) },
      sources: ["Comissões por competência (prêmio × % de comissão da apólice)", "Baixas de recebimento registradas"],
    };
  }

  // ── Maiores clientes
  if (/maiores clientes|melhores clientes|top clientes|maior(es)? carteira/.test(q)) {
    const clients: PartyRef[] = [...db.persons.filter((p) => p.clientStatus).map((p) => ({ type: "person" as const, id: p.id })), ...db.companies.map((c) => ({ type: "company" as const, id: c.id }))].filter(vis);
    const ranked = clients.map((c) => ({ c, v: clientValue(db, c), n: activePolicies(policiesOfParty(db, c, false)).length })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 10);
    return { intent: "top_clients", text: "Maiores clientes por prêmio anual ativo (apólices em que são titulares):", table: { columns: ["Cliente", "Apólices ativas", "Prêmio anual"], rows: ranked.map((x) => ({ cells: [partyName(db, x.c), String(x.n), money0(x.v)], href: partyHref(x.c) })) }, sources: ["Apólices vigentes por titular"] };
  }

  // ── Oportunidades
  if (/oportunidade|cross|vender mais/.test(q)) {
    const clients: PartyRef[] = [...db.persons.filter((p) => p.clientStatus === "ativo").map((p) => ({ type: "person" as const, id: p.id })), ...db.companies.map((c) => ({ type: "company" as const, id: c.id }))].filter(vis);
    const sugg = clients.flatMap((c) => crossSellFor(db, c, today)).filter((s) => s.strength === "alta");
    const open = db.opportunities.filter((o) => !["emitido", "perdido"].includes(o.stage) && vis(o.party));
    return {
      intent: "opportunities",
      text: `${open.length} oportunidades abertas no CRM (${money0(open.reduce((s, o) => s + o.estimatedPremium, 0))} em prêmio estimado) e ${sugg.length} sugestões fortes de cross-sell baseadas na carteira (sem disparo automático).`,
      table: { columns: ["Cliente", "Produto", "Motivo"], rows: sugg.map((s) => ({ cells: [partyName(db, s.party), lineLabel(s.line), s.reason], href: partyHref(s.party) })) },
      sources: ["Regras de cross-sell sobre ativos, família, empresas e apólices ativas", "CRM"],
      actions: [{ label: "Abrir CRM", href: "/crm" }],
    };
  }

  // ── Escrever WhatsApp
  if (/whats|mensagem|escrev/.test(q)) {
    const party = findParty(db, question, user);
    if (!party) return { intent: "draft_whatsapp", text: "Para qual cliente? Ex.: \"Escreva um WhatsApp para o Thiago Mendes\".", sources: [] };
    const name = firstName(partyName(db, party));
    const prop = db.proposals.filter((p) => sameParty(p.party, party) && ["enviada", "visualizada", "rascunho"].includes(p.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const ren = policiesExpiring(db, today, 60).find((x) => sameParty(x.policy.holder, party));
    const docTask = db.tasks.find((t) => t.status === "aberta" && sameParty(t.party, party) && t.category === "documento");
    let msg: string;
    let basis: string;
    if (prop) { msg = `Olá, ${name}! Tudo bem? Aqui é da Especializada Seguros. Conseguiu ver a proposta ${prop.code} de ${lineLabel(prop.line)}? Posso esclarecer alguma dúvida ou ajustar alguma opção? Ela é válida até ${date(prop.validUntil)}.`; basis = `Proposta ${prop.code} (${prop.status})`; }
    else if (docTask) { msg = `Olá, ${name}! Para darmos sequência, você pode nos enviar por aqui: ${docTask.title.replace(/^Solicitar /i, "")}? Obrigado!`; basis = `Tarefa: ${docTask.title}`; }
    else if (ren) { msg = `Olá, ${name}! Seu seguro ${lineLabel(ren.policy.line)} vence em ${date(ren.policy.end)}. Já estamos preparando a renovação — algo mudou desde o ano passado (endereço, condutores, uso)? Se estiver tudo igual, é só responder "tudo igual".`; basis = `Apólice ${ren.policy.number} vence em ${ren.days} dias`; }
    else { msg = `Olá, ${name}! Tudo bem? Aqui é da Especializada Seguros. Passando para saber se podemos ajudar em algo.`; basis = "Sem pendências abertas — mensagem genérica"; }
    return { intent: "draft_whatsapp", text: "Rascunho (revise antes de enviar):", bullets: [msg], sources: [basis], actions: [{ label: "Abrir no WhatsApp", href: waLink(partyPhone(db, party), msg), external: true }, { label: "Ver cliente", href: partyHref(party) }] };
  }

  // ── Preparar proposta
  if (/propost/.test(q) && /prepar|gera|cri|mont/.test(q)) {
    const party = findParty(db, question, user);
    if (!party) return { intent: "prepare_proposal", text: "Para qual cliente? Ex.: \"Prepare uma proposta para a Fernanda Souza\".", sources: [] };
    const quote = db.quotes.filter((x) => sameParty(x.party, party) && x.results.some((r) => r.status === "ok")).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!quote) return { intent: "prepare_proposal", text: `${partyName(db, party)} não tem cotação calculada. Uma proposta precisa de uma cotação com resultados — inicie uma nova cotação.`, sources: ["Cotações do cliente"], actions: [{ label: "Nova cotação", href: `/cotacoes/nova?cliente=${party.id}` }] };
    return { intent: "prepare_proposal", text: `Encontrei a cotação de ${lineLabel(quote.line)} de ${date(quote.createdAt.slice(0, 10))} com ${quote.results.filter((r) => r.status === "ok").length} opções. Abra a cotação, selecione as opções e clique em "Gerar proposta" — a recomendação e o comparativo são montados automaticamente.`, sources: [`Cotação ${quote.id}`], actions: [{ label: "Abrir cotação", href: `/cotacoes/${quote.id}` }] };
  }

  // ── Cadastre / cotação (visão futura)
  if (/cadastr|cota[cç]/.test(q)) {
    const line = findLines(q)[0] ?? "saude";
    return { intent: "start_quote", text: `Posso abrir o fluxo de cotação de ${lineLabel(line)}. O sistema reaproveita tudo o que já conhece do cliente (CPF, nascimento, endereço, família, veículos) e pergunta só o que falta.`, sources: [], actions: [{ label: `Nova cotação de ${lineLabel(line)}`, href: `/cotacoes/nova?ramo=${line}` }, { label: "Novo cliente", href: "/clientes?novo=1" }] };
  }

  // ── Cliente específico
  const party = findParty(db, question, user);
  if (party) {
    const pols = activePolicies(policiesOfParty(db, party));
    return { intent: "client_summary", text: `${partyName(db, party)}: ${pols.length} apólice(s) ativa(s).`, table: { columns: ["Ramo", "Seguradora", "Produto", "Vencimento"], rows: pols.map((p) => ({ cells: [lineLabel(p.line), insurerName(db, p.insurerId), p.productName, date(p.end)], href: `/apolices/${p.id}` })) }, sources: ["Apólices do cliente"], actions: [{ label: "Abrir Cliente 360º", href: partyHref(party) }] };
  }

  return {
    intent: "unknown",
    text: "Não encontrei uma consulta correspondente nos dados do sistema — prefiro não responder a inventar. Tente uma destas perguntas:",
    bullets: SUGGESTED_QUESTIONS.slice(0, 8),
    sources: [],
  };
}

