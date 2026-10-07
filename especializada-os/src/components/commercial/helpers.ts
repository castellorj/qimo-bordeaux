/**
 * Helpers compartilhados das telas comerciais (propostas, apólices, renovações,
 * comissões, relatórios). Tudo determinístico, calculado a partir do DB.
 */
import type { DB, IntegrationMethod, Proposal, ProductLine, Quote, QuoteResult, RenewalStatus, HealthPlan } from "@/domain/types";
import { money0 } from "@/lib/format";

export interface ProposalOptions {
  quote?: Quote;
  options: QuoteResult[];
  recommended?: QuoteResult;
  accepted?: QuoteResult;
}

/** Opções da proposta, na ordem definida, a partir dos resultados da cotação vinculada. */
export function proposalOptions(db: DB, pr: Proposal): ProposalOptions {
  const quote = db.quotes.find((q) => q.id === pr.quoteId);
  if (!quote) return { options: [] };
  const options = pr.optionResultIds.map((rid) => quote.results.find((r) => r.id === rid)).filter((r): r is QuoteResult => !!r);
  return {
    quote,
    options,
    recommended: options.find((o) => o.id === pr.recommendedResultId),
    accepted: options.find((o) => o.id === pr.acceptedResultId),
  };
}

export function healthPlanOf(db: DB, r?: QuoteResult): HealthPlan | undefined {
  return r?.healthPlanId ? db.healthPlans.find((p) => p.id === r.healthPlanId) : undefined;
}

export function optionLabel(db: DB, r: QuoteResult) {
  return `${db.insurers.find((i) => i.id === r.insurerId)?.short ?? "—"} · ${r.productName}`;
}

/** Sugestão de número de apólice (o usuário confirma/edita). Ex.: ATL-AU-482913 */
export function suggestPolicyNumber(db: DB, insurerId: string, line: ProductLine) {
  const short = db.insurers.find((i) => i.id === insurerId)?.short ?? "SEG";
  const ins = short.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  const ln = line.normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 2).toUpperCase();
  const digits = String(Math.floor(100000 + Math.random() * 900000));
  return `${ins}-${ln}-${digits}`;
}

/**
 * "O que muda?" para ramos não-saúde: diferenças estruturadas entre a opção
 * recomendada (a) e outra opção (b) — prêmio, franquia, coberturas e assistências.
 */
export function optionDiffs(db: DB, a: QuoteResult, b: QuoteResult): string[] {
  const out: string[] = [];
  const nameA = optionLabel(db, a);
  const nameB = optionLabel(db, b);
  const diff = b.annualPremium - a.annualPremium;
  if (Math.abs(diff) >= 1) out.push(`${nameB} custa ${money0(Math.abs(diff))} ${diff > 0 ? "a mais" : "a menos"} por ano que ${nameA}.`);
  else out.push(`Mesmo prêmio anual que ${nameA}.`);

  if (a.deductible != null && b.deductible != null && Math.abs(a.deductible - b.deductible) >= 1) {
    const d = b.deductible - a.deductible;
    out.push(`Franquia ${d > 0 ? "maior" : "menor"}: ${money0(b.deductible)} contra ${money0(a.deductible)} (${d > 0 ? "+" : "−"}${money0(Math.abs(d))}).`);
  } else if (a.deductible != null && b.deductible != null) {
    out.push(`Mesma franquia (${money0(a.deductible)}).`);
  }

  const incA = new Map(a.coverages.filter((c) => c.included).map((c) => [c.name, c]));
  const incB = new Map(b.coverages.filter((c) => c.included).map((c) => [c.name, c]));
  const onlyB = [...incB.keys()].filter((k) => !incA.has(k));
  const onlyA = [...incA.keys()].filter((k) => !incB.has(k));
  if (onlyB.length) out.push(`Inclui ${onlyB.join(", ")}, que não ${onlyB.length > 1 ? "constam" : "consta"} na recomendada.`);
  if (onlyA.length) out.push(`Não inclui ${onlyA.join(", ")}, presente${onlyA.length > 1 ? "s" : ""} na recomendada.`);
  const limitDiffs = [...incB.entries()]
    .filter(([k, c]) => incA.has(k) && c.limit != null && incA.get(k)!.limit != null && c.limit !== incA.get(k)!.limit)
    .map(([k, c]) => `${k}: ${money0(c.limit)} contra ${money0(incA.get(k)!.limit)}`);
  if (limitDiffs.length) out.push(`Limites diferentes — ${limitDiffs.join("; ")}.`);

  const asA = new Set(a.assistance);
  const asB = new Set(b.assistance);
  const assistOnlyB = b.assistance.filter((x) => !asA.has(x));
  const assistOnlyA = a.assistance.filter((x) => !asB.has(x));
  if (assistOnlyB.length) out.push(`Assistência adicional: ${assistOnlyB.join(", ")}.`);
  if (assistOnlyA.length) out.push(`Sem ${assistOnlyA.join(", ")} (disponível na recomendada).`);
  if (!onlyA.length && !onlyB.length && !limitDiffs.length && !assistOnlyA.length && !assistOnlyB.length) out.push("Coberturas e assistências equivalentes às da recomendada.");
  return out;
}

export const RENEWAL_NEXT_STEP: Record<RenewalStatus, string> = {
  identificada: "Perguntar ao cliente o que mudou",
  coletando_dados: "Iniciar nova cotação",
  cotando: "Gerar proposta comparativa",
  proposta_enviada: "Follow-up / aguardando decisão",
  renovada: "Concluída — renovação emitida",
  nao_renovada: "Encerrada — registrar motivo da perda",
};

export const INTEGRATION_INFO: Record<IntegrationMethod, { label: string; explain: string }> = {
  api_oficial: { label: "API oficial", explain: "A seguradora publica uma API oficial; cotação e emissão trafegam direto, com contrato e credenciais próprias da corretora." },
  api_parceiro: { label: "API de parceiro", explain: "Integração via parceiro homologado (ex.: agregador de multicálculo) com contrato; os preços chegam pela API do parceiro." },
  integracao_autorizada: { label: "Integração autorizada", explain: "Troca de dados autorizada formalmente pela seguradora (arquivos ou endpoints dedicados), conforme contrato." },
  importacao: { label: "Importação de arquivos", explain: "A operadora fornece planilhas, PDFs ou CSVs (tabelas, rede, extratos) que a equipe importa e o sistema versiona com data de validade." },
  manual: { label: "Manual", explain: "Sem via técnica legítima disponível: o sistema cria uma tarefa e a cotação é feita no portal pelo corretor, registrando o resultado." },
};

// ───────── CSV
export type CsvCell = string | number | null | undefined;

function csvEscape(v: CsvCell) {
  if (v == null) return "";
  const s = typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",")) : v;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Gera CSV (separador ";", decimal com vírgula, BOM para Excel pt-BR) e dispara o download. */
export function downloadCSV(filename: string, header: string[], rows: CsvCell[][]) {
  const body = [header, ...rows].map((r) => r.map(csvEscape).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function monthLabel(ym: string) {
  const names = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${names[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;
}
