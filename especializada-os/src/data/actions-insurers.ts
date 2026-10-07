/**
 * Catálogo de seguradoras/operadoras e onboarding da INTEGRAÇÃO PRÓPRIA
 * (decisão de negócio: um adapter por seguradora, sem agregador de multicálculo).
 */
import type { DB, Insurer, ProductLine, User } from "@/domain/types";
import { audit, uid } from "./history";

/** Etapas para colocar uma seguradora em integração própria. Sem scraping: só vias autorizadas. */
export const INTEGRATION_STEPS: { key: string; label: string; hint: string }[] = [
  { key: "convenio", label: "Código de corretor / convênio ativo", hint: "Corretora cadastrada e produzindo com a seguradora." },
  { key: "solicitacao", label: "Acesso técnico solicitado", hint: "Pedido formal ao comercial/TI da seguradora por API ou layout de arquivo (cotação, emissão, extratos)." },
  { key: "contrato", label: "Termos de uso / contrato de dados assinados", hint: "Inclui cláusulas LGPD (operador/controlador) e limites de uso." },
  { key: "homologacao", label: "Credenciais de homologação no cofre", hint: "Chaves guardadas no servidor (secrets manager), nunca no navegador." },
  { key: "adapter", label: "Adapter desenvolvido e testado", hint: "Normaliza a resposta da seguradora para o formato único do comparador." },
  { key: "producao", label: "Em produção com monitoramento", hint: "Alertas de erro/latência; queda automática para cotação manual." },
];

function insurerAudit(db: DB, user: User | null, entityId: string, summary: string): DB {
  return audit(db, user, { entity: "Insurer", entityId, action: "update", summary, source: "ui" });
}

export function addInsurer(db: DB, user: User | null, data: { name: string; short: string; color: string; lines: ProductLine[] }): DB {
  const id = uid("ins");
  const ins: Insurer = { id, ...data, integration: { method: "manual", status: "nao_configurada", note: "Integração própria a desenvolver — depende de acesso/API liberado pela seguradora" }, integrationSteps: {}, custom: true, demo: true };
  return insurerAudit({ ...db, insurers: [...db.insurers, ins] }, user, id, `Seguradora ${data.name} adicionada ao catálogo`);
}

export function updateInsurer(db: DB, user: User | null, id: string, patch: Partial<Pick<Insurer, "name" | "short" | "color" | "lines">>): DB {
  const ins = db.insurers.find((i) => i.id === id);
  if (!ins) return db;
  return insurerAudit({ ...db, insurers: db.insurers.map((i) => (i.id === id ? { ...i, ...patch } : i)) }, user, id, `Cadastro de ${ins.name} atualizado`);
}

export function toggleIntegrationStep(db: DB, user: User | null, id: string, key: string): DB {
  const ins = db.insurers.find((i) => i.id === id);
  if (!ins) return db;
  const steps = { ...(ins.integrationSteps ?? {}), [key]: !ins.integrationSteps?.[key] };
  const label = INTEGRATION_STEPS.find((s) => s.key === key)?.label ?? key;
  return insurerAudit({ ...db, insurers: db.insurers.map((i) => (i.id === id ? { ...i, integrationSteps: steps } : i)) }, user, id, `${ins.name}: etapa "${label}" ${steps[key] ? "concluída" : "reaberta"}`);
}
