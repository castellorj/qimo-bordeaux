/**
 * Document AI — extração de campos.
 * DEMO: extrator determinístico (regex + heurísticas) sobre documentos de TEXTO.
 * Produção: OCR/parse de PDF + LLM com saída estruturada (JSON schema), sempre
 * com confiança por campo e confirmação humana para campos críticos.
 * Nada é inventado: campo não encontrado = campo ausente.
 */
import type { DocumentKind, ExtractedField } from "@/domain/types";

export interface DocumentParser {
  name: string;
  parse(input: { fileName: string; text: string; knownInsurers: { id: string; name: string }[] }): Promise<ParseResult>;
}

export interface ParseResult {
  kind: DocumentKind;
  kindConfidence: number;
  fields: ExtractedField[];
  insurerId?: string;
  parser: string;
}

const RX = {
  policy: /ap[óo]lice\s*(?:n[º°o.]*|n[úu]mero)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9.\-/]{5,})/i,
  proposal: /proposta\s*(?:n[º°o.]*|n[úu]mero)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9.\-/]{4,})/i,
  cpf: /\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/,
  cnpj: /\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/,
  insuredName: /(?:segurado|titular|estipulante|cliente)\s*[:\-]\s*([A-ZÀ-Úa-zà-ú][A-Za-zÀ-ú .']{3,60})/i,
  period: /vig[êe]ncia\s*[:\-]?\s*(?:de\s*)?(\d{2}\/\d{2}\/\d{4})\s*(?:a|até|-)\s*(\d{2}\/\d{2}\/\d{4})/i,
  premium: /pr[êe]mio\s*(?:total|l[íi]quido|anual)?\s*[:\-]?\s*R\$\s*([\d.]+,\d{2})/i,
  deductible: /franquia\s*[:\-]?\s*R\$\s*([\d.]+,\d{2})/i,
  commission: /comiss[ãa]o\s*[:\-]?\s*([\d,]+)\s*%/i,
  plate: /\bplaca\s*[:\-]?\s*([A-Z]{3}-?\d[A-Z0-9]\d{2})\b/i,
  capital: /capital\s*segurado\s*[:\-]?\s*R\$\s*([\d.]+,\d{2})/i,
  dueDate: /vencimento\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i,
  amount: /valor\s*(?:do documento|a pagar|total)?\s*[:\-]?\s*R\$\s*([\d.]+,\d{2})/i,
};

const LINE_HINTS: [string, RegExp][] = [
  ["auto", /\b(autom[óo]vel|auto|ve[íi]culo|placa|fipe)\b/i],
  ["saude", /\b(sa[úu]de|plano de sa[úu]de|benefici[áa]rios|ans)\b/i],
  ["residencial", /\b(residencial|resid[êe]ncia|im[óo]vel)\b/i],
  ["vida", /\b(seguro de vida|capital segurado|vida)\b/i],
  ["empresarial", /\b(empresarial|estabelecimento comercial)\b/i],
];

export function brDateToISO(d: string) {
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}
export const brMoneyToNumber = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

export const regexParser: DocumentParser = {
  name: "demo-regex-extractor@1",
  async parse({ fileName, text, knownInsurers }) {
    const fields: ExtractedField[] = [];
    const add = (key: string, label: string, value: string | undefined, confidence: number) => {
      if (value) fields.push({ key, label, value: value.trim(), confidence });
    };
    const t = text.replace(/ /g, " ");
    const lower = t.toLowerCase();

    let kind: DocumentKind = "outro";
    let kindConfidence = 0.4;
    if (/ap[óo]lice/i.test(t) && RX.period.test(t)) { kind = "apolice"; kindConfidence = 0.95; }
    else if (/proposta/i.test(t)) { kind = "proposta"; kindConfidence = 0.85; }
    else if (/boleto|linha digit[áa]vel|c[óo]digo de barras/i.test(t)) { kind = "boleto"; kindConfidence = 0.9; }
    else if (/carteirinha|cart[ãa]o do benefici[áa]rio/i.test(t)) { kind = "carteirinha"; kindConfidence = 0.85; }
    else if (/crlv|certificado de registro/i.test(t)) { kind = "crlv"; kindConfidence = 0.85; }
    else if (/condi[çc][õo]es gerais/i.test(t)) { kind = "condicoes_gerais"; kindConfidence = 0.8; }

    // nome completo primeiro (ex.: "Bradesco Saúde" antes de "Bradesco Seguros"); depois o nome sem sufixo
    const insurer =
      [...knownInsurers].sort((a, b) => b.name.length - a.name.length).find((i) => lower.includes(i.name.toLowerCase())) ??
      knownInsurers.find((i) => { const core = i.name.toLowerCase().replace(/ (seguros|seguradora|saúde|do brasil)$/, ""); return core.length >= 4 && lower.includes(core); });
    if (insurer) add("insurer", "Seguradora", insurer.name, 0.92);

    const line = LINE_HINTS.find(([, rx]) => rx.test(t));
    if (line) add("line", "Ramo", line[0], 0.8);

    add("policyNumber", "Nº da apólice", t.match(RX.policy)?.[1], 0.93);
    if (kind === "proposta") add("proposalNumber", "Nº da proposta", t.match(RX.proposal)?.[1], 0.85);
    add("insuredName", "Segurado", t.match(RX.insuredName)?.[1]?.split(/\s{2,}|\n/)[0], 0.75);
    const cnpj = t.match(RX.cnpj)?.[1];
    if (cnpj) add("cnpj", "CNPJ", cnpj, 0.97);
    else add("cpf", "CPF", t.match(RX.cpf)?.[1], 0.97);
    const period = t.match(RX.period);
    if (period) {
      add("start", "Início de vigência", brDateToISO(period[1]), 0.9);
      add("end", "Fim de vigência", brDateToISO(period[2]), 0.9);
    }
    const prem = t.match(RX.premium)?.[1];
    if (prem) add("premium", "Prêmio anual", String(brMoneyToNumber(prem)), 0.88);
    const ded = t.match(RX.deductible)?.[1];
    if (ded) add("deductible", "Franquia", String(brMoneyToNumber(ded)), 0.85);
    const com = t.match(RX.commission)?.[1];
    if (com) add("commissionPct", "Comissão (%)", com.replace(",", "."), 0.7);
    add("plate", "Placa", t.match(RX.plate)?.[1]?.toUpperCase(), 0.9);
    const cap = t.match(RX.capital)?.[1];
    if (cap) add("capital", "Capital segurado", String(brMoneyToNumber(cap)), 0.85);
    if (kind === "boleto") {
      const due = t.match(RX.dueDate)?.[1];
      if (due) add("dueDate", "Vencimento", brDateToISO(due), 0.9);
      const amt = t.match(RX.amount)?.[1];
      if (amt) add("amount", "Valor", String(brMoneyToNumber(amt)), 0.88);
    }
    // nome do arquivo como pista fraca
    if (!fields.some((f) => f.key === "line")) {
      const fromName = LINE_HINTS.find(([, rx]) => rx.test(fileName));
      if (fromName) add("line", "Ramo", fromName[0], 0.5);
    }
    return { kind, kindConfidence, fields, insurerId: insurer?.id, parser: this.name };
  },
};

/** Abaixo disso, o campo exige revisão humana explícita */
export const CONFIDENCE_REVIEW_THRESHOLD = 0.85;
/** Campos críticos sempre exigem confirmação humana antes de gravar */
export const CRITICAL_FIELDS = ["policyNumber", "cpf", "cnpj", "start", "end", "premium", "commissionPct"];
