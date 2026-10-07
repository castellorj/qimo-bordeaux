/**
 * Contrato v2 da INTEGRAÇÃO PRÓPRIA com seguradoras (produção).
 *
 * Cada seguradora implementa só as capacidades que ela liberar para a corretora.
 * O core nunca fala com a seguradora diretamente: só com este contrato, que
 * devolve dados NORMALIZADOS e com proveniência. Roda exclusivamente no servidor.
 *
 * Vias permitidas (por capacidade): API liberada pela seguradora, layout de
 * arquivo (importação), integração autorizada ou entrada manual. Sem scraping/RPA.
 */
import type { AutoQuoteRequest, GenericQuoteRequest, IntegrationMethod, PartyRef, ProductLine, QuoteResult } from "@/domain/types";

export type Capability = "quote" | "transmit_proposal" | "policy_status" | "documents" | "commission_statement" | "claims";

export interface CapabilityBinding {
  capability: Capability;
  method: IntegrationMethod;
  lines: ProductLine[];
  /** ex.: "API REST v2 (homologação)", "Extrato CSV mensal do portal" */
  description: string;
  status: "planejada" | "homologacao" | "producao" | "suspensa";
}

/** Erros normalizados — o orquestrador decide fallback (ex.: virar cotação manual). */
export type AdapterErrorKind = "auth" | "validation" | "declined" | "unavailable" | "rate_limited" | "timeout" | "mapping" | "unknown";
export class AdapterError extends Error {
  constructor(public kind: AdapterErrorKind, message: string, public insurerId: string, public retryable = kind === "unavailable" || kind === "rate_limited" || kind === "timeout", public raw?: unknown) {
    super(message);
  }
}

export interface ProposalTransmission {
  quoteResultId: string;
  insurerReference?: string; // nº do cálculo na seguradora
  holder: PartyRef;
  payment: { method: "boleto" | "cartao" | "debito"; installments: number };
  attachments: { kind: string; storageKey: string }[];
}
export interface TransmissionReceipt { proposalNumber: string; status: "recebida" | "em_analise" | "pendente_documento" | "recusada"; message?: string; receivedAt: string }

export interface PolicySnapshot {
  policyNumber: string;
  status: "vigente" | "cancelada" | "em_emissao" | "vencida";
  start: string;
  end: string;
  annualPremium: number;
  installmentsPaid?: number;
  endorsements?: { number: string; date: string; description: string }[];
  fetchedAt: string;
}

export interface InsurerDocument { kind: "apolice" | "boleto" | "carteirinha" | "endosso" | "condicoes_gerais"; fileName: string; mime: string; content: Uint8Array }

/** Linha normalizada de extrato de comissão (vinda de API ou de arquivo) */
export interface CommissionStatementLine {
  insurerId: string;
  policyNumber: string;
  installment?: number;
  competence: string; // YYYY-MM
  premiumBase?: number;
  commissionRate?: number; // 0..1
  amount: number;
  paidAt?: string;
  sourceRef: string; // arquivo/linha ou id da API
}

export interface ClaimStatus { claimNumber: string; policyNumber: string; status: string; updatedAt: string; nextStep?: string }

export interface InsurerAdapterV2 {
  insurerId: string;
  version: string;
  bindings: CapabilityBinding[];
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; detail?: string }>;
  quoteAuto?(req: AutoQuoteRequest, ctx: { vehicleFipeCode: string; vehicleValue: number }): Promise<QuoteResult>;
  quoteGeneric?(req: GenericQuoteRequest): Promise<QuoteResult>;
  transmitProposal?(p: ProposalTransmission): Promise<TransmissionReceipt>;
  getPolicy?(policyNumber: string): Promise<PolicySnapshot>;
  getDocument?(policyNumber: string, kind: InsurerDocument["kind"]): Promise<InsurerDocument>;
  commissionStatement?(competence: string): Promise<CommissionStatementLine[]>;
  claimStatus?(claimNumber: string): Promise<ClaimStatus>;
}

export function supports(a: InsurerAdapterV2, cap: Capability, line?: ProductLine) {
  return a.bindings.some((b) => b.capability === cap && b.status === "producao" && (!line || b.lines.includes(line)));
}
