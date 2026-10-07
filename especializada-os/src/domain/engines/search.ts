/**
 * Busca global (cliente, CPF, CNPJ, telefone, placa, apólice, seguradora,
 * plano, hospital, empresa, produto). DEMO: em memória com normalização.
 * Produção: Postgres (unaccent + pg_trgm + tsvector) atrás de SearchProvider.
 */
import type { DB, User } from "../types";
import { norm } from "@/lib/text";
import { digits } from "@/lib/format";
import { PRODUCTS } from "../products";
import { canSeeParty } from "../rbac";
import { partyName } from "./queries";

export interface SearchHit { type: string; label: string; sub: string; href: string; score: number }

export function globalSearch(db: DB, q: string, user?: User | null, limit = 12): SearchHit[] {
  const nq = norm(q);
  const dq = digits(q);
  if (nq.length < 2 && dq.length < 3) return [];
  const hits: SearchHit[] = [];
  const score = (text: string) => {
    const t = norm(text);
    if (t === nq) return 100;
    if (t.startsWith(nq)) return 80;
    if (t.split(" ").some((w) => w.startsWith(nq))) return 65;
    if (t.includes(nq)) return 50;
    return 0;
  };
  const dscore = (val?: string) => (dq.length >= 3 && val && digits(val).includes(dq) ? 90 : 0);
  for (const p of db.persons) {
    if (!canSeeParty(db, user, { type: "person", id: p.id })) continue;
    const s = Math.max(score(p.name), dscore(p.cpf), dscore(p.phone), dscore(p.whatsapp), p.email && norm(p.email).includes(nq) ? 60 : 0);
    if (s) hits.push({ type: p.clientStatus ? "Cliente" : "Pessoa", label: p.name, sub: [p.clientStatus === "lead" ? "Lead" : p.profession, p.email].filter(Boolean).join(" · "), href: `/clientes/${p.id}`, score: s + (p.clientStatus ? 5 : 0) });
  }
  for (const c of db.companies) {
    if (!canSeeParty(db, user, { type: "company", id: c.id })) continue;
    const s = Math.max(score(c.tradeName), score(c.legalName), dscore(c.cnpj));
    if (s) hits.push({ type: "Empresa", label: c.tradeName, sub: c.legalName, href: `/empresas/${c.id}`, score: s });
  }
  for (const h of db.households) {
    const s = score(h.name);
    if (s) hits.push({ type: "Família", label: h.name, sub: `${h.members.length} membros`, href: `/familias/${h.id}`, score: s - 5 });
  }
  for (const a of db.assets) {
    if (a.type !== "vehicle") continue;
    if (!canSeeParty(db, user, a.owner)) continue;
    const plate = a.plate.replace("-", "").toLowerCase();
    const s = plate.includes(nq.replace(/[\s-]/g, "")) && nq.length >= 3 ? 95 : Math.max(score(`${a.make} ${a.model}`) - 10, 0);
    if (s > 0) hits.push({ type: "Veículo", label: `${a.make} ${a.model} · ${a.plate}`, sub: partyName(db, a.owner), href: a.owner.type === "person" ? `/clientes/${a.owner.id}` : `/empresas/${a.owner.id}`, score: s });
  }
  for (const p of db.policies) {
    if (!canSeeParty(db, user, p.holder)) continue;
    const s = norm(p.number).includes(nq) && nq.length >= 3 ? 92 : 0;
    if (s) hits.push({ type: "Apólice", label: p.number, sub: `${p.productName} · ${partyName(db, p.holder)}`, href: `/apolices/${p.id}`, score: s });
  }
  for (const pr of db.proposals) {
    if (norm(pr.code).includes(nq) && nq.length >= 3) hits.push({ type: "Proposta", label: pr.code, sub: partyName(db, pr.party), href: `/propostas/${pr.id}`, score: 90 });
  }
  for (const i of db.insurers) {
    const s = Math.max(score(i.name), score(i.short));
    if (s) hits.push({ type: "Seguradora", label: i.name, sub: i.lines.length + " ramos", href: `/seguradoras#${i.id}`, score: s - 5 });
  }
  for (const hp of db.healthPlans) {
    const s = score(hp.name);
    if (s) hits.push({ type: "Plano", label: hp.name, sub: db.insurers.find((i) => i.id === hp.insurerId)?.name ?? "", href: `/rede?modo=plano&plano=${hp.id}`, score: s - 3 });
  }
  for (const pv of db.providers) {
    const s = Math.max(score(pv.name), ...pv.aliases.map(score));
    if (s) hits.push({ type: "Prestador", label: pv.name, sub: `${pv.type} · ${pv.district}`, href: `/rede?modo=prestador&prestador=${pv.id}`, score: s - 2 });
  }
  for (const pm of PRODUCTS) {
    const s = score(pm.label);
    if (s) hits.push({ type: "Produto", label: pm.label, sub: "Ver apólices do ramo", href: `/apolices?ramo=${pm.line}`, score: s - 10 });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
