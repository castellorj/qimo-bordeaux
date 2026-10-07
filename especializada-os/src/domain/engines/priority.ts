/**
 * CENTRAL DE OPERAÇÕES — classifica e ordena automaticamente o que a equipe
 * precisa fazer. Pontuação transparente: atraso, proximidade, valor em jogo,
 * tempo de espera.
 */
import type { DB, PartyRef, Task, User } from "../types";
import { daysBetween } from "@/lib/dates";
import { canSeeParty } from "../rbac";

export type Bucket = "urgente" | "hoje" | "semana" | "aguardando_cliente" | "aguardando_seguradora" | "renovacoes" | "documentos" | "followups" | "pendencias";
export const BUCKETS: { key: Bucket; label: string; hint: string }[] = [
  { key: "urgente", label: "Urgente", hint: "Atrasadas, vencimentos em até 7 dias, apólices vencidas" },
  { key: "hoje", label: "Hoje", hint: "Vencem hoje" },
  { key: "semana", label: "Esta semana", hint: "Próximos 7 dias" },
  { key: "aguardando_cliente", label: "Aguardando cliente", hint: "Bola com o cliente — acompanhar" },
  { key: "aguardando_seguradora", label: "Aguardando seguradora", hint: "Bola com a seguradora/operadora" },
  { key: "renovacoes", label: "Renovações", hint: "Processos de renovação abertos" },
  { key: "documentos", label: "Documentos pendentes", hint: "Revisões do Document AI e documentos solicitados" },
  { key: "followups", label: "Follow-ups", hint: "Propostas e contatos para retomar" },
  { key: "pendencias", label: "Pendências", hint: "Financeiro, conciliação e outras" },
];

export interface OpsItem {
  task: Task;
  score: number;
  buckets: Bucket[];
  primary: Bucket;
  dueIn: number;
  waitingDays?: number;
  reasons: string[];
  party?: PartyRef;
}

export function operationsQueue(db: DB, today: string, user?: User | null, onlyMine = false): OpsItem[] {
  const items: OpsItem[] = [];
  for (const t of db.tasks) {
    if (t.status !== "aberta") continue;
    if (onlyMine && user && t.ownerId !== user.id) continue;
    if (user && t.party && !canSeeParty(db, user, t.party)) continue;
    const dueIn = daysBetween(today, t.due);
    const waitingDays = t.waitingSince ? daysBetween(t.waitingSince, today) : undefined;
    const reasons: string[] = [];
    let score = 0;
    const buckets: Bucket[] = [];

    // vencimento de apólice relacionado (renovação)
    let policyDays: number | undefined;
    if (t.related?.type === "renewal") {
      const ren = db.renewals.find((r) => r.id === t.related!.id);
      if (ren) policyDays = daysBetween(today, ren.dueDate);
    } else if (t.related?.type === "policy") {
      const pol = db.policies.find((p) => p.id === t.related!.id);
      if (pol) policyDays = daysBetween(today, pol.end);
    }

    if (dueIn < 0) { score += 60 + Math.min(30, -dueIn * 8); reasons.push(`atrasada há ${-dueIn} dia${-dueIn > 1 ? "s" : ""}`); }
    else if (dueIn === 0) { score += 40; reasons.push("vence hoje"); }
    else if (dueIn <= 7) { score += 20 - dueIn * 2; }
    if (policyDays != null) {
      if (policyDays < 0) { score += 70; reasons.push(`apólice vencida há ${-policyDays} dias`); }
      else if (policyDays <= 7) { score += 55; reasons.push(`apólice vence em ${policyDays} dias`); }
      else if (policyDays <= 15) { score += 30; reasons.push(`apólice vence em ${policyDays} dias`); }
      else if (policyDays <= 30) { score += 15; }
    }
    if (t.value) { score += Math.min(25, Math.log10(Math.max(10, t.value)) * 5); if (t.value >= 10000) reasons.push(`prêmio em jogo ${Math.round(t.value / 1000)} mil`); }
    if (waitingDays != null && waitingDays >= 3) { score += Math.min(20, waitingDays * 3); reasons.push(`aguardando há ${waitingDays} dias`); }

    const urgent = dueIn < 0 || (policyDays != null && policyDays <= 7);
    if (urgent) buckets.push("urgente");
    if (dueIn === 0) buckets.push("hoje");
    else if (dueIn > 0 && dueIn <= 7) buckets.push("semana");
    if (t.waitingOn === "cliente") buckets.push("aguardando_cliente");
    if (t.waitingOn === "seguradora") buckets.push("aguardando_seguradora");
    if (t.category === "renovacao") buckets.push("renovacoes");
    if (t.category === "documento" || t.category === "revisao") buckets.push("documentos");
    if (t.category === "follow_up") buckets.push("followups");
    if (t.category === "pendencia" || t.category === "emissao") buckets.push("pendencias");
    const primary: Bucket = urgent ? "urgente" : dueIn === 0 ? "hoje" : t.waitingOn === "cliente" ? "aguardando_cliente" : t.waitingOn === "seguradora" ? "aguardando_seguradora" : dueIn <= 7 ? "semana" : buckets[0] ?? "semana";
    items.push({ task: t, score: Math.round(score), buckets, primary, dueIn, waitingDays, reasons, party: t.party });
  }
  return items.sort((a, b) => b.score - a.score);
}
