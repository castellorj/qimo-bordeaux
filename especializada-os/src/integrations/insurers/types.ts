/**
 * Contrato usado pela DEMO (cotação). O contrato completo de produção — com
 * transmissão de proposta, apólices, documentos, extrato de comissão e sinistros —
 * está em contract.ts (InsurerAdapterV2). Integração própria: um adapter por
 * seguradora, via API liberada, arquivo, integração autorizada ou manual.
 * NÃO há scraping nem automação que contorne termos de uso ou segurança.
 */
import type { AutoQuoteRequest, GenericQuoteRequest, IntegrationMethod, ProductLine, QuoteResult, Vehicle } from "@/domain/types";

export interface InsurerQuoteContext {
  vehicle?: Vehicle;
}

export interface InsurerAdapter {
  insurerId: string;
  adapterName: string;
  method: IntegrationMethod | "demo";
  lines: ProductLine[];
  /** true quando o adapter responde automaticamente; false = cotação manual/importada */
  automatic: boolean;
  quoteAuto?(req: AutoQuoteRequest, ctx: InsurerQuoteContext): Promise<QuoteResult>;
  quoteGeneric?(req: GenericQuoteRequest): Promise<QuoteResult>;
}
