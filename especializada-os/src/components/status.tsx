"use client";
import { Badge } from "./ui";
import type { PipelineStage, PolicyStatus, ProposalStatus, RenewalStatus } from "@/domain/types";

export const STAGE_LABEL: Record<PipelineStage, string> = {
  lead: "Lead", contato: "Contato realizado", levantamento: "Levantamento", cotacao: "Cotação", proposta: "Proposta enviada",
  negociacao: "Negociação", aprovado: "Aprovado", emissao: "Emissão", emitido: "Emitido", perdido: "Perdido",
};
export function StageBadge({ stage }: { stage: PipelineStage }) {
  const tone = stage === "perdido" ? "danger" : stage === "emitido" ? "ok" : ["aprovado", "emissao"].includes(stage) ? "violet" : ["proposta", "negociacao"].includes(stage) ? "warn" : "brand";
  return <Badge tone={tone}>{STAGE_LABEL[stage]}</Badge>;
}
const POL: Record<PolicyStatus, [string, "ok" | "danger" | "neutral" | "warn" | "brand"]> = {
  vigente: ["Vigente", "ok"], vencida: ["Vencida", "danger"], cancelada: ["Cancelada", "neutral"], renovada: ["Renovada", "neutral"], em_emissao: ["Em emissão", "brand"],
};
export function PolicyStatusBadge({ status }: { status: PolicyStatus }) {
  return <Badge tone={POL[status][1]} dot>{POL[status][0]}</Badge>;
}
const PROP: Record<ProposalStatus, [string, "ok" | "danger" | "neutral" | "warn" | "brand" | "violet"]> = {
  rascunho: ["Rascunho", "neutral"], enviada: ["Enviada", "brand"], visualizada: ["Visualizada", "violet"], aceita: ["Aceita", "ok"], recusada: ["Recusada", "danger"], expirada: ["Expirada", "warn"],
};
export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge tone={PROP[status][1]} dot>{PROP[status][0]}</Badge>;
}
const REN: Record<RenewalStatus, [string, "ok" | "danger" | "neutral" | "warn" | "brand" | "violet"]> = {
  identificada: ["Identificada", "neutral"], coletando_dados: ["Coletando dados", "brand"], cotando: ["Cotando", "violet"], proposta_enviada: ["Proposta enviada", "warn"], renovada: ["Renovada", "ok"], nao_renovada: ["Não renovada", "danger"],
};
export function RenewalStatusBadge({ status }: { status: RenewalStatus }) {
  return <Badge tone={REN[status][1]} dot>{REN[status][0]}</Badge>;
}
export function DaysBadge({ days }: { days: number }) {
  const tone = days < 0 ? "danger" : days <= 7 ? "danger" : days <= 15 ? "warn" : days <= 30 ? "warn" : "neutral";
  return <Badge tone={tone}>{days < 0 ? `vencida há ${-days}d` : days === 0 ? "vence hoje" : `${days} dias`}</Badge>;
}
