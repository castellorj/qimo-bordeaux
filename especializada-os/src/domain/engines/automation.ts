/**
 * AUTOMATION ENGINE — TRIGGER + CONDITION + ACTION.
 * Idempotente: todo artefato criado tem ID determinístico derivado da origem,
 * então rodar o motor N vezes não duplica nada. Toda execução vira um
 * AutomationExecution com os minutos estimados economizados.
 */
import type { Automation, AutomationExecution, DB, Opportunity, Policy, Renewal, Task } from "../types";
import { addDays, daysBetween, nowISO } from "@/lib/dates";
import { lineLabel, PRODUCT } from "../products";
import { date as fmtDate } from "@/lib/format";

export const NATIVE_AUTOMATIONS: Automation[] = [
  { id: "auto-policy-created", name: "Apólice criada → programar renovação e comissões", description: "Ao cadastrar/emitir uma apólice, agenda a renovação na janela do ramo e gera a previsão de comissões por competência.", trigger: "policy.created", conditions: [], actions: ["create_renewal", "schedule_commission"], enabled: true, minutesSavedPerRun: 12, system: true },
  { id: "auto-days-to-end", name: "Faltam 90/60/30/15/7 dias → iniciar renovação", description: "Cria a renovação com os dados da apólice anterior, abre oportunidade no CRM e tarefas escalonadas conforme o vencimento se aproxima.", trigger: "policy.days_to_end", conditions: [{ field: "dias_para_vencer", op: "lte", value: 90 }], actions: ["create_renewal", "create_task"], enabled: true, minutesSavedPerRun: 25, system: true },
  { id: "auto-proposal-followup", name: "Proposta sem resposta → follow-up", description: "Se uma proposta enviada não tiver resposta após N dias (configurável), cria tarefa de follow-up para o corretor responsável.", trigger: "proposal.sent_no_reply", conditions: [{ field: "dias_sem_resposta", op: "gte", value: 3 }], actions: ["create_follow_up"], enabled: true, minutesSavedPerRun: 4, system: true },
  { id: "auto-doc-received", name: "Documento recebido → Document AI", description: "Classifica o documento, extrai os campos, identifica o cliente e cria tarefa de revisão humana quando há campo crítico ou baixa confiança.", trigger: "document.received", conditions: [], actions: ["classify_document", "create_task"], enabled: true, minutesSavedPerRun: 6, system: true },
  { id: "auto-client-created", name: "Cliente novo → verificar oportunidades", description: "Analisa ativos, família e empresas do cliente para sugerir oportunidades relevantes (sem disparo automático de mensagens).", trigger: "client.created", conditions: [], actions: ["check_cross_sell"], enabled: true, minutesSavedPerRun: 5, system: true },
  { id: "auto-policy-issued", name: "Apólice emitida → armazenar, extrair, atualizar", description: "Arquiva o PDF, extrai os dados, atualiza o cliente, cria a renovação e programa as comissões.", trigger: "policy.issued", conditions: [], actions: ["classify_document", "create_renewal", "schedule_commission"], enabled: true, minutesSavedPerRun: 18, system: true },
  { id: "auto-task-overdue", name: "Tarefa atrasada → avisar responsável", description: "Sobe a prioridade na Central de Operações e notifica o responsável (e o gestor após 2 dias).", trigger: "task.overdue", conditions: [{ field: "dias_atraso", op: "gte", value: 1 }], actions: ["notify_owner"], enabled: true, minutesSavedPerRun: 1, system: true },
];

export function renewalChecklist(policy: Policy): Renewal["checklist"] {
  const base = [
    { key: "dados", label: "Dados cadastrais confirmados (\"os dados continuam os mesmos?\")", done: false },
    { key: "mudancas", label: "Perguntar o que mudou desde a última vigência", done: false },
    { key: "cotacao", label: "Nova cotação / multicálculo", done: false },
    { key: "proposta", label: "Proposta comparativa enviada", done: false },
    { key: "emissao", label: "Renovação emitida e documentos arquivados", done: false },
  ];
  if (policy.line === "auto") base.splice(2, 0, { key: "condutores", label: "Condutores, uso e garagem confirmados", done: false });
  if (policy.line === "saude") base.splice(2, 0, { key: "beneficiarios", label: "Beneficiários e faixas etárias atualizados", done: false });
  return base;
}

export function partyName(db: DB, ref: { type: string; id: string }) {
  return ref.type === "person" ? db.persons.find((p) => p.id === ref.id)?.name ?? "—" : db.companies.find((c) => c.id === ref.id)?.tradeName ?? "—";
}

export function runAutomations(input: DB, today: string): { db: DB; runs: AutomationExecution[] } {
  const db: DB = { ...input, renewals: [...input.renewals], tasks: [...input.tasks], opportunities: [...input.opportunities], automationRuns: [...input.automationRuns], interactions: [...input.interactions] };
  const runs: AutomationExecution[] = [];
  const enabled = (id: string) => db.automations.find((a) => a.id === id)?.enabled;
  const at = nowISO();
  const log = (automationId: string, summary: string, refs: AutomationExecution["refs"]) => {
    const a = db.automations.find((x) => x.id === automationId)!;
    const run = { id: `run-${automationId}-${refs.map((r) => r.id).join("-")}`, automationId, at, summary, refs, minutesSaved: a.minutesSavedPerRun };
    if (!db.automationRuns.some((r) => r.id === run.id)) {
      db.automationRuns.push(run);
      runs.push(run);
    }
  };
  const taskExists = (id: string) => db.tasks.some((t) => t.id === id);
  const addTask = (t: Omit<Task, "demo" | "createdAt" | "status">) => {
    if (taskExists(t.id)) return false;
    db.tasks.push({ ...t, status: "aberta", createdAt: at, demo: true });
    return true;
  };

  // ── 1. Renovação por janela de vencimento
  if (enabled("auto-days-to-end")) {
    const windows = [...db.settings.renewalWindows].sort((a, b) => a - b); // [7,15,30,60,90]
    const maxWin = Math.max(...windows);
    for (const pol of db.policies) {
      if (pol.status !== "vigente" && pol.status !== "vencida") continue;
      const days = daysBetween(today, pol.end);
      if (days > maxWin || days < -30) continue;
      if (db.policies.some((p) => p.renewedFromId === pol.id)) continue; // já renovada
      const holder = partyName(db, pol.holder);
      let ren = db.renewals.find((r) => r.policyId === pol.id);
      if (!ren) {
        const oppId = `o-ren-${pol.id}`;
        ren = { id: `ren-${pol.id}`, policyId: pol.id, status: "identificada", dueDate: pol.end, opportunityId: oppId, checklist: renewalChecklist(pol), createdBy: "automacao", createdAt: at, demo: true };
        db.renewals.push(ren);
        if (!db.opportunities.some((o) => o.id === oppId)) {
          const opp: Opportunity = { id: oppId, title: `Renovação ${lineLabel(pol.line)} — ${pol.productName}`, party: pol.holder, line: pol.line, stage: "levantamento", ownerId: pol.ownerId, estimatedPremium: pol.annualPremium, insurerId: pol.insurerId, origin: "renovacao", renewalOfPolicyId: pol.id, createdAt: at, updatedAt: at, stageHistory: [{ stage: "levantamento", at, by: "sistema" }], demo: true };
          db.opportunities.push(opp);
        }
        log("auto-days-to-end", `Renovação de ${lineLabel(pol.line)} (${holder}) iniciada com os dados da apólice ${pol.number}`, [{ type: "policy", id: pol.id }, { type: "renewal", id: ren.id }]);
      }
      if (["proposta_enviada", "renovada", "nao_renovada"].includes(ren.status)) continue;
      // uma tarefa aberta por renovação, escalonada pela janela atual
      const current = days < 0 ? 0 : windows.find((w) => days <= w)!;
      const taskId = `t-ren-${pol.id}-w${current}`;
      if (taskExists(taskId)) continue;
      const manual = db.tasks.some((t) => t.status === "aberta" && t.origin === "manual" && t.related?.type === "policy" && t.related.id === pol.id);
      if (manual) continue;
      db.tasks.forEach((t, i) => {
        if (t.status === "aberta" && t.id.startsWith(`t-ren-${pol.id}-w`)) db.tasks[i] = { ...t, status: "concluida", completedAt: at, description: (t.description ?? "") + " (substituída por tarefa mais urgente)" };
      });
      const title = days < 0 ? `Apólice ${lineLabel(pol.line)} vencida há ${-days} dias — renovar` : current >= 60 ? `Iniciar renovação ${lineLabel(pol.line)} — vence ${fmtDate(pol.end)}` : `Renovação ${lineLabel(pol.line)} em ${days} dias — sem proposta enviada`;
      addTask({ id: taskId, title, category: "renovacao", party: pol.holder, related: { type: "renewal", id: ren.id }, due: current >= 60 ? addDays(today, Math.min(5, days - PRODUCT[pol.line].renewalLeadDays > 0 ? 5 : 1)) : today, ownerId: pol.ownerId, value: pol.annualPremium, origin: { automationId: "auto-days-to-end" } });
    }
  }

  // ── 2. Proposta sem resposta
  if (enabled("auto-proposal-followup")) {
    for (const pr of db.proposals) {
      if (!(pr.status === "enviada" || pr.status === "visualizada") || !pr.sentAt) continue;
      const waited = daysBetween(pr.sentAt.slice(0, 10), today);
      if (waited < db.settings.followUpDays) continue;
      const id = `t-fu-${pr.id}`;
      if (addTask({ id, title: `Follow-up: proposta ${pr.code} sem resposta há ${waited} dias${pr.status === "visualizada" ? " (cliente já visualizou)" : ""}`, category: "follow_up", party: pr.party, related: { type: "proposal", id: pr.id }, due: today, ownerId: pr.ownerId, waitingOn: "cliente", waitingSince: pr.sentAt.slice(0, 10), value: db.quotes.find((q) => q.id === pr.quoteId)?.results.find((r) => r.id === pr.recommendedResultId)?.annualPremium, origin: { automationId: "auto-proposal-followup" } }))
        log("auto-proposal-followup", `Follow-up criado para a proposta ${pr.code} (${partyName(db, pr.party)})`, [{ type: "proposal", id: pr.id }]);
    }
  }

  // ── 3. Documento aguardando revisão
  if (enabled("auto-doc-received")) {
    for (const d of db.documents) {
      if (d.status !== "aguardando_revisao") continue;
      const id = `t-doc-${d.id}`;
      if (addTask({ id, title: `Revisar dados extraídos: ${d.name}`, category: "revisao", party: d.party, related: { type: "document", id: d.id }, due: today, ownerId: "u-bianca", origin: { automationId: "auto-doc-received" } }))
        log("auto-doc-received", `Documento "${d.name}" classificado (${d.kind}) e enviado para revisão`, [{ type: "document", id: d.id }]);
    }
  }

  return { db, runs };
}
