/** Consultas determinísticas reutilizadas por telas, Central e Especializada AI. */
import type { Asset, DB, PartyRef, Policy, ProductLine, Person, Company, Vehicle, Property } from "../types";
import { daysBetween } from "@/lib/dates";

export function partyName(db: DB, ref?: PartyRef) {
  if (!ref) return "—";
  return ref.type === "person" ? db.persons.find((p) => p.id === ref.id)?.name ?? "—" : db.companies.find((c) => c.id === ref.id)?.tradeName ?? "—";
}
export function partyHref(ref: PartyRef) {
  return ref.type === "person" ? `/clientes/${ref.id}` : `/empresas/${ref.id}`;
}
export function partyPhone(db: DB, ref: PartyRef) {
  return ref.type === "person" ? db.persons.find((p) => p.id === ref.id)?.whatsapp ?? db.persons.find((p) => p.id === ref.id)?.phone : db.companies.find((c) => c.id === ref.id)?.phone;
}
export function partyEmail(db: DB, ref: PartyRef) {
  return ref.type === "person" ? db.persons.find((p) => p.id === ref.id)?.email : db.companies.find((c) => c.id === ref.id)?.email;
}
export const sameParty = (a?: PartyRef, b?: PartyRef) => !!a && !!b && a.type === b.type && a.id === b.id;
export const insurerName = (db: DB, id?: string) => db.insurers.find((i) => i.id === id)?.short ?? "—";
export const userName = (db: DB, id?: string) => (id === "sistema" ? "Sistema" : db.users.find((u) => u.id === id)?.name ?? "—");

export function householdOf(db: DB, personId: string) {
  return db.households.find((h) => h.members.some((m) => m.personId === personId));
}
export function companiesOf(db: DB, personId: string) {
  return db.companyRelationships.filter((r) => r.personId === personId).map((r) => ({ rel: r, company: db.companies.find((c) => c.id === r.companyId)! }));
}
export function peopleOf(db: DB, companyId: string) {
  return db.companyRelationships.filter((r) => r.companyId === companyId).map((r) => ({ rel: r, person: db.persons.find((p) => p.id === r.personId)! }));
}
export function assetsOf(db: DB, ref: PartyRef): Asset[] {
  return db.assets.filter((a) => sameParty(a.owner, ref));
}
export function assetLabel(db: DB, a?: Asset) {
  if (!a) return "—";
  if (a.type === "vehicle") return `${a.make} ${a.model} ${a.yearModel} · ${a.plate}`;
  if (a.type === "property") {
    const ad = db.addresses.find((x) => x.id === a.addressId);
    return `${a.kind[0].toUpperCase() + a.kind.slice(1)} · ${ad?.district ?? ""}/${ad?.state ?? ""}`;
  }
  return `Embarcação ${a.name} (${a.lengthFt} pés)`;
}

/** Apólices em que a pessoa é titular OU beneficiária, e de suas empresas (opcional) */
export function policiesOfParty(db: DB, ref: PartyRef, includeBeneficiary = true): Policy[] {
  return db.policies.filter((p) => sameParty(p.holder, ref) || (includeBeneficiary && ref.type === "person" && p.beneficiaryIds?.includes(ref.id)));
}
export const activePolicies = (ps: Policy[]) => ps.filter((p) => p.status === "vigente" || p.status === "em_emissao");

export function householdPolicies(db: DB, householdId: string) {
  const hh = db.households.find((h) => h.id === householdId);
  if (!hh) return [];
  const ids = new Set(hh.members.map((m) => m.personId));
  return db.policies.filter((p) => (p.holder.type === "person" && ids.has(p.holder.id)) || p.beneficiaryIds?.some((b) => ids.has(b)));
}

export function isClient(x: Person | Company) {
  return x.clientStatus != null;
}

export function policiesExpiring(db: DB, today: string, days: number) {
  return db.policies
    .filter((p) => p.status === "vigente")
    .map((p) => ({ policy: p, days: daysBetween(today, p.end) }))
    .filter((x) => x.days >= 0 && x.days <= days)
    .sort((a, b) => a.days - b.days);
}

export function linesOf(db: DB, ref: PartyRef): Set<ProductLine> {
  return new Set(activePolicies(policiesOfParty(db, ref)).map((p) => p.line));
}

export function vehicleOf(db: DB, id?: string) {
  return db.assets.find((a) => a.id === id && a.type === "vehicle") as Vehicle | undefined;
}
export function propertyOf(db: DB, id?: string) {
  return db.assets.find((a) => a.id === id && a.type === "property") as Property | undefined;
}

export function clientValue(db: DB, ref: PartyRef) {
  return activePolicies(policiesOfParty(db, ref, false)).reduce((s, p) => s + p.annualPremium, 0);
}
