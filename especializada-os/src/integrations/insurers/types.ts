/**
 * Contrato de integração com seguradoras. Cada seguradora tem um adapter.
 * Métodos permitidos: API oficial, API de parceiro (ex.: agregador de multicálculo
 * contratado), integração autorizada, importação de arquivo ou entrada manual.
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
