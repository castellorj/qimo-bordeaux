/**
 * POLÍTICA DE RETENÇÃO (LGPD) — decisão: "de acordo com a LGPD".
 * A LGPD não fixa prazos: os dados são mantidos enquanto houver finalidade, obrigação
 * legal/regulatória ou exercício regular de direitos (arts. 7º, 15 e 16), e depois
 * eliminados ou anonimizados. Os prazos abaixo são a PROPOSTA padrão — validar com
 * jurídico/DPO. Em produção um job mensal executa o expurgo com relatório e aprovação.
 */
import type { DB } from "../types";
import { addMonths, daysBetween } from "@/lib/dates";

export interface RetentionRule {
  key: string;
  label: string;
  months: number | null; // null = enquanto durar a finalidade
  trigger: string;
  action: "manter" | "anonimizar" | "excluir";
  basis: string;
}

export const RETENTION_RULES: RetentionRule[] = [
  { key: "cliente_ativo", label: "Cadastro de clientes ativos", months: null, trigger: "Enquanto houver apólice, proposta ou relacionamento ativo", action: "manter", basis: "Execução de contrato e procedimentos preliminares (art. 7º, V)" },
  { key: "contratual", label: "Apólices, propostas aceitas, documentos contratuais e comissões", months: 60, trigger: "Após o fim da última vigência do cliente", action: "anonimizar", basis: "Obrigação legal/regulatória e exercício regular de direitos (art. 7º, II e VI; art. 16, I). 5 anos é o mínimo proposto; a guarda de documentos regulada pela SUSEP (Circular 605/2020) pode exigir prazos maiores para certos documentos — confirmar com jurídico" },
  { key: "saude_nao_convertida", label: "Dados de saúde de cotações não convertidas (beneficiários, idades, hospitais/médicos preferidos)", months: 6, trigger: "Após a última atualização da cotação", action: "excluir", basis: "Dado pessoal sensível (art. 11): minimização e eliminação ao fim da finalidade (art. 15, I)" },
  { key: "lead", label: "Leads não convertidos", months: 24, trigger: "Sem interação nem cotação no período", action: "anonimizar", basis: "Legítimo interesse/consentimento (art. 7º, IX e I); término do tratamento (art. 15)" },
  { key: "marketing", label: "Consentimento de marketing (WhatsApp/e-mail)", months: null, trigger: "Até a revogação; prova do opt-in/opt-out guardada 5 anos", action: "manter", basis: "Consentimento (art. 8º) e demonstração de conformidade (art. 6º, X)" },
  { key: "documentos_pessoais", label: "Documentos pessoais (RG, CNH, comprovantes) de ex-clientes", months: 60, trigger: "Após o fim da última vigência", action: "excluir", basis: "Necessidade e exercício regular de direitos (art. 6º, III; art. 16)" },
  { key: "auditoria", label: "Logs de auditoria e de acesso", months: 60, trigger: "Após o registro", action: "excluir", basis: "Segurança e prestação de contas (art. 6º, VII e X; art. 37). Marco Civil exige no mínimo 6 meses de logs de acesso (art. 15)" },
  { key: "backups", label: "Backups", months: 1, trigger: "Rotação de 35 dias", action: "excluir", basis: "Segurança (art. 46); itens expurgados não são restaurados para uso" },
];

export interface RetentionPreviewItem { rule: RetentionRule; count: number; examples: string[]; nextDue?: string }

/** Simula o que o job de expurgo faria hoje (nada é apagado na prévia). */
export function retentionPreview(db: DB, today: string): RetentionPreviewItem[] {
  const pol = (type: string, id: string) => db.policies.filter((p) => p.holder.type === type && p.holder.id === id);
  const lastEnd = (type: string, id: string) => pol(type, id).map((p) => p.end).sort().pop();
  const hasActive = (type: string, id: string) => pol(type, id).some((p) => p.status === "vigente" || p.status === "em_emissao");
  const out: RetentionPreviewItem[] = [];
  for (const rule of RETENTION_RULES) {
    let items: { name: string; due: string }[] = [];
    if (rule.key === "contratual" || rule.key === "documentos_pessoais") {
      items = db.persons.filter((p) => p.clientStatus && !hasActive("person", p.id) && lastEnd("person", p.id)).map((p) => ({ name: p.name, due: addMonths(lastEnd("person", p.id)!, rule.months!) }));
    } else if (rule.key === "saude_nao_convertida") {
      items = db.quotes.filter((q) => q.line === "saude" && !hasActive(q.party.type, q.party.id)).map((q) => ({ name: `Cotação saúde — ${q.party.type === "person" ? db.persons.find((p) => p.id === q.party.id)?.name : db.companies.find((c) => c.id === q.party.id)?.tradeName}`, due: addMonths(q.createdAt.slice(0, 10), 6) }));
    } else if (rule.key === "lead") {
      items = db.persons.filter((p) => p.clientStatus === "lead").map((p) => {
        const last = [p.clientSince ?? today, ...db.interactions.filter((i) => i.party.id === p.id).map((i) => i.at.slice(0, 10)), ...db.quotes.filter((q) => q.party.id === p.id).map((q) => q.createdAt.slice(0, 10))].sort().pop()!;
        return { name: p.name, due: addMonths(last, 24) };
      });
    } else if (rule.key === "auditoria") {
      items = db.audit.map((a) => ({ name: a.summary, due: addMonths(a.at.slice(0, 10), 60) }));
    }
    const dueNow = items.filter((i) => daysBetween(i.due, today) >= 0);
    const upcoming = items.filter((i) => daysBetween(i.due, today) < 0).sort((a, b) => a.due.localeCompare(b.due));
    out.push({ rule, count: dueNow.length, examples: dueNow.slice(0, 3).map((i) => i.name), nextDue: upcoming[0] ? `${upcoming[0].due}|${upcoming[0].name}` : undefined });
  }
  return out;
}
