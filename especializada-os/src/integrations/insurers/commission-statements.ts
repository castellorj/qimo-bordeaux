/**
 * Extrato de comissões por ARQUIVO — a integração que funciona desde o primeiro dia:
 * quase todas as seguradoras disponibilizam o extrato (CSV/XLSX/TXT) no portal do
 * corretor. O arquivo é baixado por uma pessoa e importado aqui (sem RPA), cada
 * seguradora com seu layout cadastrado, e o sistema concilia previsto × recebido.
 */
import type { Commission, DB } from "@/domain/types";
import { parseCSV } from "@/domain/engines/importer";
import { norm } from "@/lib/text";
import type { CommissionStatementLine } from "./contract";

export interface CommissionLayout {
  insurerId: string;
  columns: { policyNumber: string; amount: string; competence?: string; paidAt?: string; premiumBase?: string; rate?: string; installment?: string };
}

const SYN: Record<keyof CommissionLayout["columns"], string[]> = {
  rate: ["percentual", "% comissao", "taxa", "percentual comissao"],
  policyNumber: ["apolice", "n apolice", "numero apolice", "nº apolice", "apólice"],
  amount: ["comissao", "valor comissao", "vl comissao", "comissao liquida", "valor"],
  competence: ["competencia", "mes referencia", "referencia"],
  paidAt: ["data pagamento", "pagamento", "dt pagto", "data credito"],
  premiumBase: ["premio", "premio liquido", "base calculo"],
  installment: ["parcela", "n parcela"],
};

export function guessLayout(insurerId: string, headers: string[]): CommissionLayout {
  const cols: Partial<CommissionLayout["columns"]> = {};
  for (const [field, syns] of Object.entries(SYN) as [keyof CommissionLayout["columns"], string[]][]) {
    // escolhe o cabeçalho com o sinônimo mais específico (ex.: "valor comissão" vence "% comissão")
    let best: { h: string; score: number } | undefined;
    for (const x of headers) {
      if (Object.values(cols).includes(x)) continue;
      for (const sy of syns) {
        const nx = norm(x);
        const ns = norm(sy);
        const score = nx === ns ? 100 + ns.length - (x.includes("%") && field !== "rate" ? 50 : 0) : nx.includes(ns) ? ns.length : 0;
        if (score > (best?.score ?? 0)) best = { h: x, score };
      }
    }
    if (best) cols[field] = best.h;
  }
  return { insurerId, columns: { policyNumber: cols.policyNumber ?? headers[0], amount: cols.amount ?? headers[headers.length - 1], ...cols } };
}

const num = (s?: string) => (s == null || s === "" ? undefined : Number(s.replace(/[R$\s%]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")));
const toISO = (s?: string) => { if (!s) return undefined; const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined; };
const toCompetence = (s?: string) => { if (!s) return undefined; const m = s.match(/^(\d{2})\/(\d{4})$/); return m ? `${m[2]}-${m[1]}` : /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : undefined; };

export function parseCommissionStatement(text: string, layout: CommissionLayout, fileName = "extrato"): { lines: CommissionStatementLine[]; errors: string[] } {
  const rows = parseCSV(text);
  if (rows.length < 2) return { lines: [], errors: ["Arquivo vazio ou sem cabeçalho"] };
  const head = rows[0];
  const idx = (h?: string) => (h ? head.indexOf(h) : -1);
  const errors: string[] = [];
  const lines: CommissionStatementLine[] = [];
  rows.slice(1).forEach((r, i) => {
    const g = (h?: string) => (idx(h) >= 0 ? r[idx(h)] : undefined);
    const policyNumber = g(layout.columns.policyNumber)?.trim();
    const amount = num(g(layout.columns.amount));
    const paidAt = toISO(g(layout.columns.paidAt));
    const competence = toCompetence(g(layout.columns.competence)) ?? paidAt?.slice(0, 7);
    if (!policyNumber || amount == null || isNaN(amount) || !competence) { errors.push(`Linha ${i + 2}: apólice, valor ou competência ausente/inválido`); return; }
    const rate = num(g(layout.columns.rate));
    lines.push({ insurerId: layout.insurerId, policyNumber, amount, competence, paidAt, premiumBase: num(g(layout.columns.premiumBase)), commissionRate: rate != null ? (rate > 1 ? rate / 100 : rate) : undefined, installment: num(g(layout.columns.installment)), sourceRef: `${fileName}#L${i + 2}` });
  });
  return { lines, errors };
}

export type ReconStatus = "conferida" | "divergente" | "apolice_nao_encontrada" | "sem_previsao";
export interface ReconLine { line: CommissionStatementLine; status: ReconStatus; policyId?: string; commission?: Commission; difference?: number }

const key = (s: string) => s.replace(/[^0-9A-Za-z]/g, "").toUpperCase();

/** Concilia o extrato com as comissões previstas. Tolerância: R$ 0,50 ou 0,5%. */
export function reconcile(db: DB, lines: CommissionStatementLine[]): { lines: ReconLine[]; missing: Commission[] } {
  const byNumber = new Map(db.policies.map((p) => [key(p.number), p]));
  const used = new Set<string>();
  const out: ReconLine[] = lines.map((line) => {
    const pol = byNumber.get(key(line.policyNumber));
    if (!pol || pol.insurerId !== line.insurerId) return { line, status: "apolice_nao_encontrada" };
    const c = db.commissions.find((x) => x.policyId === pol.id && x.competence === line.competence && !used.has(x.id));
    if (!c) return { line, status: "sem_previsao", policyId: pol.id };
    used.add(c.id);
    const diff = Math.round((line.amount - c.expected) * 100) / 100;
    const ok = Math.abs(diff) <= Math.max(0.5, c.expected * 0.005);
    return { line, status: ok ? "conferida" : "divergente", policyId: pol.id, commission: c, difference: diff };
  });
  const comps = new Set(lines.map((l) => l.competence));
  const insurerPolicies = new Set(db.policies.filter((p) => lines.some((l) => l.insurerId === p.insurerId)).map((p) => p.id));
  const missing = db.commissions.filter((c) => comps.has(c.competence) && insurerPolicies.has(c.policyId) && !used.has(c.id) && c.status !== "recebida");
  return { lines: out, missing };
}

/** Aplica a conciliação revisada: grava recebido/divergente; nada é alterado sem confirmação. */
export function applyReconciliation(db: DB, recon: ReconLine[], userId: string): DB {
  const upd = new Map<string, Partial<Commission>>();
  for (const r of recon) {
    if (!r.commission || (r.status !== "conferida" && r.status !== "divergente")) continue;
    upd.set(r.commission.id, { received: r.line.amount, receivedAt: r.line.paidAt ?? `${r.line.competence}-10`, status: r.status === "conferida" ? "recebida" : "divergente" });
  }
  const now = new Date().toISOString();
  return {
    ...db,
    commissions: db.commissions.map((c) => (upd.has(c.id) ? { ...c, ...upd.get(c.id) } : c)),
    audit: [{ id: `au-${Date.now().toString(36)}`, at: now, userId, entity: "Commission", entityId: "conciliacao", action: "update", summary: `Conciliação de extrato: ${[...upd.values()].filter((x) => x.status === "recebida").length} conferida(s), ${[...upd.values()].filter((x) => x.status === "divergente").length} divergente(s)`, source: "importacao" }, ...db.audit],
  };
}

/** Gera um extrato de exemplo coerente com a DEMO (algumas linhas divergentes e uma apólice desconhecida). */
export function sampleStatement(db: DB, insurerId: string, competence: string): string {
  const pols = db.policies.filter((p) => p.insurerId === insurerId);
  const rows = db.commissions.filter((c) => c.competence === competence && pols.some((p) => p.id === c.policyId)).map((c, i) => {
    const p = pols.find((x) => x.id === c.policyId)!;
    const amount = i % 4 === 1 ? c.expected * 0.8 : c.expected;
    return `${p.number};${competence.slice(5)}/${competence.slice(0, 4)};10/${competence.slice(5)}/${competence.slice(0, 4)};${(p.annualPremium / 12).toFixed(2).replace(".", ",")};${(p.commissionPct * 100).toFixed(0)};${amount.toFixed(2).replace(".", ",")}`;
  });
  rows.push(`XXX-AU-000000;${competence.slice(5)}/${competence.slice(0, 4)};10/${competence.slice(5)}/${competence.slice(0, 4)};300,00;15;45,00`);
  return ["Apólice;Competência;Data pagamento;Prêmio líquido;% Comissão;Valor comissão", ...rows].join("\n");
}
