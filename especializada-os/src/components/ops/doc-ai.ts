/** Utilitários de UI da Central de documentos / Document AI (puros, sem React). */
import type { DB, DocumentRecord, ExtractedField, PartyRef } from "@/domain/types";
import { digits } from "@/lib/format";
import { dice } from "@/lib/text";

export const KIND_LABEL: Record<DocumentRecord["kind"], string> = {
  apolice: "Apólice", proposta: "Proposta", boleto: "Boleto", carteirinha: "Carteirinha", documento_pessoal: "Documento pessoal",
  condicoes_gerais: "Condições gerais", comprovante: "Comprovante", crlv: "CRLV", tabela: "Tabela", outro: "Outro",
};
export const CHANNEL_LABEL: Record<DocumentRecord["channel"], string> = {
  upload: "Upload", email: "E-mail", whatsapp: "WhatsApp", importacao: "Importação", sistema: "Sistema",
};
export const STATUS_LABEL: Record<DocumentRecord["status"], string> = {
  arquivado: "Arquivado", aguardando_revisao: "Aguardando revisão", processado: "Processado",
};

export interface PartyMatch {
  party: PartyRef;
  by: "CPF" | "CNPJ" | "nome";
  certain: boolean; // true = documento bate exatamente; false = "possível" (similaridade de nome)
  score?: number;
}

/**
 * Identifica o cliente do documento: CPF/CNPJ exato (dígitos) ou, na falta,
 * similaridade de nome (sinalizada como "possível" — exige confirmação).
 */
export function identifyParty(db: DB, fields: ExtractedField[], canSee: (ref: PartyRef) => boolean): PartyMatch | undefined {
  const get = (k: string) => fields.find((f) => f.key === k)?.value;
  const cpf = get("cpf");
  if (cpf && digits(cpf).length === 11) {
    const p = db.persons.find((x) => digits(x.cpf) === digits(cpf));
    if (p && canSee({ type: "person", id: p.id })) return { party: { type: "person", id: p.id }, by: "CPF", certain: true };
  }
  const cnpj = get("cnpj");
  if (cnpj && digits(cnpj).length === 14) {
    const c = db.companies.find((x) => digits(x.cnpj) === digits(cnpj));
    if (c && canSee({ type: "company", id: c.id })) return { party: { type: "company", id: c.id }, by: "CNPJ", certain: true };
  }
  const name = get("insuredName");
  if (name) {
    let best: PartyMatch | undefined;
    for (const p of db.persons) {
      const s = dice(p.name, name);
      if (s >= 0.75 && (!best || s > (best.score ?? 0)) && canSee({ type: "person", id: p.id })) best = { party: { type: "person", id: p.id }, by: "nome", certain: false, score: s };
    }
    for (const c of db.companies) {
      const s = Math.max(dice(c.tradeName, name), dice(c.legalName, name));
      if (s >= 0.75 && (!best || s > (best.score ?? 0)) && canSee({ type: "company", id: c.id })) best = { party: { type: "company", id: c.id }, by: "nome", certain: false, score: s };
    }
    return best;
  }
  return undefined;
}

/** Tipo pelo nome do arquivo (arquivos não-texto na DEMO: só metadados). */
export function kindFromFileName(name: string): DocumentRecord["kind"] {
  const n = name.toLowerCase();
  if (/ap[oó]lice/.test(n)) return "apolice";
  if (/proposta/.test(n)) return "proposta";
  if (/boleto/.test(n)) return "boleto";
  if (/carteirinha/.test(n)) return "carteirinha";
  if (/crlv/.test(n)) return "crlv";
  if (/\b(rg|cnh|cpf|identidade)\b/.test(n)) return "documento_pessoal";
  if (/condi[cç][oõ]es/.test(n)) return "condicoes_gerais";
  if (/comprovante/.test(n)) return "comprovante";
  if (/tabela/.test(n)) return "tabela";
  return "outro";
}

export const isTextFile = (f: { name: string; type: string }) => /\.(txt|csv|md)$/i.test(f.name) || f.type.startsWith("text/");

export function sizeLabel(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1).replace(".", ",")} MB` : `${kb} KB`;
}
