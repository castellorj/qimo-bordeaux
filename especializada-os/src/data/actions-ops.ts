/**
 * Casos de uso das telas operacionais (Automações, Importação) — funções puras DB → DB.
 * Mesmo estilo de actions.ts: toda alteração relevante gera AuditLog.
 */
import type { Automation, DB, PartyRef, Person, Policy, ProductLine, User } from "@/domain/types";
import { nowISO } from "@/lib/dates";
import { digits } from "@/lib/format";
import { norm } from "@/lib/text";
import { PRODUCTS } from "@/domain/products";
import { runAutomations } from "@/domain/engines/automation";
import { brDate, type ImportRowResult } from "@/domain/engines/importer";
import { commissionsFor, createPerson, updatePerson } from "./actions";
import { audit, uid } from "./history";


// ───────── Automações personalizadas
export function createCustomAutomation(db: DB, user: User | null, data: Omit<Automation, "id" | "system" | "enabled">): { db: DB; id: string } {
  const id = uid("auto-custom");
  const automation: Automation = { ...data, id, enabled: true, system: false };
  const next: DB = { ...db, automations: [...db.automations, automation] };
  return { db: audit(next, user, { entity: "Automation", entityId: id, action: "create", summary: `Regra personalizada "${data.name}" criada`, source: "ui" }), id };
}

export function deleteCustomAutomation(db: DB, user: User | null, id: string): DB {
  const a = db.automations.find((x) => x.id === id);
  if (!a || a.system) return db; // nativas não podem ser apagadas
  return audit({ ...db, automations: db.automations.filter((x) => x.id !== id) }, user, { entity: "Automation", entityId: id, action: "delete", summary: `Regra personalizada "${a.name}" removida`, source: "ui" });
}

// ───────── Importação de carteira
export function parseMoneyBR(s?: string): number | undefined {
  if (!s) return undefined;
  const clean = s.replace(/[R$\s]/g, "");
  const v = clean.includes(",") ? Number(clean.replace(/\./g, "").replace(",", ".")) : Number(clean);
  return isNaN(v) ? undefined : v;
}

export function resolveLine(value?: string): ProductLine | undefined {
  if (!value) return undefined;
  const v = norm(value);
  return PRODUCTS.find((p) => norm(p.label) === v || norm(p.short) === v || p.line === v)?.line;
}

export function resolveInsurer(db: DB, value?: string) {
  if (!value) return undefined;
  const v = norm(value);
  return db.insurers.find((i) => norm(i.name) === v || norm(i.short) === v || norm(i.name).startsWith(v) || v.startsWith(norm(i.short)));
}

/** Cria uma apólice vinda de importação (carteira legada). Gera comissões previstas. */
export function createImportedPolicy(
  db: DB,
  user: User | null,
  data: Pick<Policy, "number" | "holder" | "insurerId" | "line" | "start" | "end" | "annualPremium" | "commissionPct"> & { status: Policy["status"]; ownerId?: string },
): { db: DB; id: string } {
  const id = uid("pol");
  const policy: Policy = {
    id, number: data.number, holder: data.holder, insurerId: data.insurerId, line: data.line, productName: `${PRODUCTS.find((p) => p.line === data.line)?.label ?? data.line} (importada)`,
    start: data.start, end: data.end, annualPremium: data.annualPremium, commissionPct: data.commissionPct, ownerId: data.ownerId ?? user?.id ?? "u-ana", status: data.status,
    dataSource: { kind: "importacao", at: nowISO(), by: user?.id }, demo: true,
  };
  const next: DB = { ...db, policies: [...db.policies, policy], commissions: [...db.commissions, ...commissionsFor(policy)] };
  return { db: audit(next, user, { entity: "Policy", entityId: id, action: "create", summary: `Apólice ${data.number} importada da carteira`, source: "importacao" }), id };
}

export interface ImportReport {
  created: { row: number; name: string; id: string }[];
  updated: { row: number; name: string; id: string; fields: string[] }[];
  ignored: { row: number; name: string; reason: string }[];
  conflicts: { row: number; name: string; field: string; current: string; incoming: string }[];
  policies: { row: number; number: string; id: string }[];
  policyIssues: { row: number; message: string }[];
  errors: { row: number; name: string; messages: string[] }[];
  renewalsCreated: number;
}

const FIELD_LABEL: Record<string, string> = { cpf: "CPF", birthDate: "Nascimento", phone: "Telefone", email: "E-mail" };

/**
 * Aplica as linhas revisadas. Regras:
 *  - "criar": cadastra cliente ativo (origem "Importação");
 *  - "atualizar": preenche SOMENTE campos vazios do cadastro; divergências viram
 *    "conflitos para revisão" e NÃO são alteradas (nunca sobrescrever em silêncio);
 *  - apólice só é criada com seguradora + nº + início + fim válidos e se o número ainda não existe.
 * No fim roda o motor de automações (renovações para apólices dentro das janelas).
 */
export function applyImport(db: DB, user: User | null, rows: ImportRowResult[], today: string): { db: DB; report: ImportReport } {
  const report: ImportReport = { created: [], updated: [], ignored: [], conflicts: [], policies: [], policyIssues: [], errors: [], renewalsCreated: 0 };
  let next = db;
  const renewalsBefore = db.renewals.length;

  for (const r of rows) {
    const line = r.index + 2; // linha da planilha (cabeçalho = 1)
    const v = r.values;
    const name = v.name ?? "(sem nome)";
    if (r.errors.length) report.errors.push({ row: line, name, messages: r.errors });
    if (r.action === "ignorar") {
      report.ignored.push({ row: line, name, reason: r.errors.length ? "Erros de validação" : "Ignorada na revisão" });
      continue;
    }
    let holder: PartyRef | undefined;
    if (r.action === "criar") {
      const data: Omit<Person, "id" | "demo"> = {
        name: v.name ?? "", cpf: v.cpf ?? "", birthDate: v.birthDate ? brDate(v.birthDate) ?? "" : "", phone: v.phone, whatsapp: v.phone, email: v.email,
        ownerId: user?.id, clientStatus: "ativo", clientSince: today, source: "Importação",
      };
      const res = createPerson(next, user, data);
      next = res.db;
      holder = { type: "person", id: res.id };
      report.created.push({ row: line, name, id: res.id });
    } else if (r.action === "atualizar" && r.match) {
      holder = { type: r.match.type, id: r.match.id };
      if (r.match.type === "person") {
        const p = next.persons.find((x) => x.id === r.match!.id);
        if (p) {
          const incoming: Partial<Record<"cpf" | "birthDate" | "phone" | "email", string>> = {
            cpf: v.cpf, birthDate: v.birthDate ? brDate(v.birthDate) ?? undefined : undefined, phone: v.phone, email: v.email,
          };
          const patch: Partial<Person> = {};
          const filled: string[] = [];
          (Object.keys(incoming) as (keyof typeof incoming)[]).forEach((k) => {
            const inc = incoming[k];
            if (!inc) return;
            const cur = (p[k] as string | undefined) ?? "";
            const same = k === "email" ? cur.toLowerCase() === inc.toLowerCase() : k === "birthDate" ? cur === inc : digits(cur) === digits(inc) && digits(cur) !== "";
            if (!cur) {
              patch[k] = inc;
              if (k === "phone" && !p.whatsapp) patch.whatsapp = inc;
              filled.push(FIELD_LABEL[k]);
            } else if (!same) {
              const curCmp = k === "phone" ? digits(cur).slice(-9) : cur;
              const incCmp = k === "phone" ? digits(inc).slice(-9) : inc;
              if (curCmp !== incCmp) report.conflicts.push({ row: line, name: p.name, field: FIELD_LABEL[k], current: cur, incoming: inc });
            }
          });
          if (filled.length) next = updatePerson(next, user, p.id, patch);
          report.updated.push({ row: line, name: p.name, id: p.id, fields: filled });
        }
      } else {
        report.updated.push({ row: line, name: r.match.name, id: r.match.id, fields: [] });
      }
    }

    // apólice
    if (holder && (v.policyNumber || v.insurer)) {
      const insurer = resolveInsurer(next, v.insurer);
      const start = v.start ? brDate(v.start) : null;
      const end = v.end ? brDate(v.end) : null;
      const pline = resolveLine(v.line) ?? "outros";
      if (!v.policyNumber || !insurer || !start || !end) {
        const missing = [!v.policyNumber && "nº da apólice", !insurer && (v.insurer ? `seguradora "${v.insurer}" não reconhecida` : "seguradora"), !start && "início de vigência", !end && "fim de vigência"].filter(Boolean).join(", ");
        report.policyIssues.push({ row: line, message: `Apólice não criada — faltando: ${missing}` });
      } else if (next.policies.some((p) => p.number === v.policyNumber)) {
        report.policyIssues.push({ row: line, message: `Apólice ${v.policyNumber} já existe no sistema — não duplicada` });
      } else {
        const res = createImportedPolicy(next, user, {
          number: v.policyNumber, holder, insurerId: insurer.id, line: pline, start, end, annualPremium: parseMoneyBR(v.premium) ?? 0,
          commissionPct: v.commissionPct ? (parseMoneyBR(v.commissionPct.replace("%", "")) ?? 0) / 100 : 0,
          status: end < today ? "vencida" : start > today ? "em_emissao" : "vigente",
        });
        next = res.db;
        report.policies.push({ row: line, number: v.policyNumber, id: res.id });
      }
    }
  }

  next = runAutomations(next, today).db;
  report.renewalsCreated = next.renewals.length - renewalsBefore;
  next = audit(next, user, {
    entity: "Import", entityId: uid("imp"), action: "create",
    summary: `Importação de carteira: ${report.created.length} criado(s), ${report.updated.length} atualizado(s), ${report.ignored.length} ignorado(s), ${report.policies.length} apólice(s), ${report.conflicts.length} conflito(s) para revisão`,
    source: "importacao",
  });
  return { db: next, report };
}
