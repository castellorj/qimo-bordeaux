/**
 * DATA IMPORT CENTER — upload → identificar colunas → matching → duplicados →
 * preview → validação → importação → relatório. Nada crítico é importado às cegas.
 */
import type { DB } from "../types";
import { digits } from "@/lib/format";
import { norm, dice } from "@/lib/text";

export type TargetField = "name" | "cpf" | "cnpj" | "birthDate" | "phone" | "email" | "cep" | "insurer" | "line" | "policyNumber" | "start" | "end" | "premium" | "commissionPct" | "plate" | "ignore";
export const TARGET_LABEL: Record<TargetField, string> = {
  name: "Nome / Razão social", cpf: "CPF", cnpj: "CNPJ", birthDate: "Nascimento", phone: "Telefone", email: "E-mail", cep: "CEP", insurer: "Seguradora", line: "Ramo",
  policyNumber: "Nº apólice", start: "Início vigência", end: "Fim vigência", premium: "Prêmio", commissionPct: "Comissão %", plate: "Placa", ignore: "— Ignorar —",
};
const SYNONYMS: Record<Exclude<TargetField, "ignore">, string[]> = {
  name: ["nome", "cliente", "segurado", "razao social", "nome completo"],
  cpf: ["cpf", "documento", "cpf cliente"],
  cnpj: ["cnpj"],
  birthDate: ["nascimento", "data nascimento", "dt nasc", "data de nascimento"],
  phone: ["telefone", "celular", "fone", "whatsapp", "tel"],
  email: ["email", "e mail", "correio"],
  cep: ["cep"],
  insurer: ["seguradora", "operadora", "cia"],
  line: ["ramo", "produto", "tipo seguro"],
  policyNumber: ["apolice", "numero apolice", "n apolice", "nº apolice"],
  start: ["inicio", "inicio vigencia", "vigencia inicial", "data inicio"],
  end: ["fim", "fim vigencia", "vencimento", "vigencia final", "termino"],
  premium: ["premio", "valor", "premio liquido", "premio total"],
  commissionPct: ["comissao", "comissao %", "percentual comissao"],
  plate: ["placa"],
};

export function parseCSV(text: string): string[][] {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  return lines.map((l) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === sep && !q) { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  });
}

export function guessMapping(headers: string[]): { field: TargetField; confidence: number }[] {
  return headers.map((h) => {
    const nh = norm(h);
    let best: TargetField = "ignore";
    let bestS = 0;
    for (const [f, syns] of Object.entries(SYNONYMS) as [TargetField, string[]][]) {
      for (const s of syns) {
        const sc = nh === s ? 1 : nh.includes(s) || s.includes(nh) ? 0.85 : dice(nh, s);
        if (sc > bestS) { bestS = sc; best = f; }
      }
    }
    return bestS >= 0.6 ? { field: best, confidence: Math.round(bestS * 100) / 100 } : { field: "ignore", confidence: 0 };
  });
}

export function brDate(s: string) {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}
export function cpfValid(cpf: string) {
  const d = digits(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export interface ImportRowResult {
  index: number;
  values: Partial<Record<TargetField, string>>;
  errors: string[];
  warnings: string[];
  match?: { type: "person" | "company"; id: string; name: string; by: string };
  action: "criar" | "atualizar" | "ignorar";
}

export function analyzeRows(db: DB, rows: string[][], mapping: TargetField[]): ImportRowResult[] {
  const seenCpf = new Map<string, number>();
  return rows.map((row, index) => {
    const values: Partial<Record<TargetField, string>> = {};
    mapping.forEach((f, i) => { if (f !== "ignore" && row[i] != null && row[i] !== "") values[f] = row[i]; });
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!values.name) errors.push("Nome ausente");
    if (values.cpf && !cpfValid(values.cpf)) errors.push("CPF inválido");
    if (values.birthDate && !brDate(values.birthDate)) errors.push("Data de nascimento inválida");
    if (values.start && !brDate(values.start)) errors.push("Início de vigência inválido");
    if (values.end && !brDate(values.end)) errors.push("Fim de vigência inválido");
    if (values.premium && isNaN(Number(values.premium.replace(/[R$\s.]/g, "").replace(",", ".")))) errors.push("Prêmio não numérico");
    if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) warnings.push("E-mail com formato suspeito");
    if (values.cpf) {
      const d = digits(values.cpf);
      if (seenCpf.has(d)) warnings.push(`CPF repetido na linha ${seenCpf.get(d)! + 2}`);
      seenCpf.set(d, index);
    }
    // matching com a base
    let match: ImportRowResult["match"];
    if (values.cpf) {
      const p = db.persons.find((x) => digits(x.cpf) === digits(values.cpf!));
      if (p) match = { type: "person", id: p.id, name: p.name, by: "CPF" };
    }
    if (!match && values.cnpj) {
      const c = db.companies.find((x) => digits(x.cnpj) === digits(values.cnpj!));
      if (c) match = { type: "company", id: c.id, name: c.tradeName, by: "CNPJ" };
    }
    if (!match && values.email) {
      const p = db.persons.find((x) => x.email && x.email.toLowerCase() === values.email!.toLowerCase());
      if (p) match = { type: "person", id: p.id, name: p.name, by: "e-mail" };
    }
    if (!match && values.phone) {
      const d = digits(values.phone).slice(-9);
      const p = db.persons.find((x) => (x.phone && digits(x.phone).endsWith(d)) || (x.whatsapp && digits(x.whatsapp).endsWith(d)));
      if (p && d.length === 9) match = { type: "person", id: p.id, name: p.name, by: "telefone" };
    }
    if (!match && values.name) {
      const p = db.persons.find((x) => dice(x.name, values.name!) > 0.9);
      if (p) { match = { type: "person", id: p.id, name: p.name, by: "nome (similar)" }; warnings.push("Correspondência apenas por nome — confirme"); }
    }
    const action: ImportRowResult["action"] = errors.length ? "ignorar" : match ? "atualizar" : "criar";
    return { index, values, errors, warnings, match, action };
  });
}

export const SAMPLE_IMPORT_CSV = `Nome;CPF;Nascimento;Celular;E-mail;CEP;Seguradora;Ramo;Apólice;Início;Fim;Prêmio
Beatriz Monteiro;529.982.247-25;12/03/1985;(21) 98111-2233;beatriz.m@exemplo.demo;22290-030;Tokio Marine;Residencial;TOK-RE-900112;01/02/2026;01/02/2027;1.120,00
Larissa Campos;{{CPF:p-larissa}};;(21) 99109-8765;larissa.campos@exemplo.demo;22230-061;Tokio Marine;Residencial;TOK-RE-552901;;;
Otávio Prado;111.111.111-11;05/07/1979;(21) 97777-0000;otavio@exemplo;20540-001;HDI Seguros;Auto;BUS-AU-332211;10/11/2025;10/11/2026;3.980,00
Joao da Silva;;;21998761234;;;;;;;;
Helena Brito;153.509.460-56;30/09/1990;(21) 96666-1212;helena.b@exemplo.demo;22440-000;Bradesco Seguros;Vida;BRA-VI-120044;15/01/2026;15/01/2027;890,00`;
