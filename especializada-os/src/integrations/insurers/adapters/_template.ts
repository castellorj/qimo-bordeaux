/**
 * MODELO de adapter de integração própria. Copie para adapters/<seguradora>.ts
 * quando a seguradora liberar o acesso técnico e preencha os mapeamentos a partir
 * da DOCUMENTAÇÃO OFICIAL recebida. Nenhum endpoint aqui é real.
 *
 * Checklist antes de ir para produção:
 *  1. Credenciais de homologação no cofre (credentials.ts) — nunca no código.
 *  2. Mapeamento request → formato da seguradora (CEP, FIPE, condutor, coberturas).
 *  3. Mapeamento resposta → QuoteResult normalizado (prêmio, franquia, coberturas, assistências, comissão).
 *  4. Testes de contrato com respostas reais anonimizadas (tests/insurer-contract.test.ts).
 *  5. Monitoramento (healthCheck) e fallback para cotação manual.
 */
import type { AutoQuoteRequest, QuoteResult } from "@/domain/types";
import { AdapterError, type InsurerAdapterV2 } from "../contract";
import { envVault } from "../credentials";
import { insurerFetch } from "../http";

const INSURER_ID = "ins-exemplo";
const BASE_URL = process.env.INSURER_EXEMPLO_BASE_URL ?? ""; // fornecido pela seguradora

/** Formato da seguradora (preencher conforme a documentação dela). */
interface InsurerQuoteResponse { numeroCalculo: string; premioTotal: number; franquia?: number; coberturas: { nome: string; lmi?: number }[]; assistencias?: string[]; percentualComissao?: number }

export function toInsurerRequest(req: AutoQuoteRequest, ctx: { vehicleFipeCode: string; vehicleValue: number }, brokerCode: string) {
  return {
    corretor: brokerCode,
    veiculo: { codigoFipe: ctx.vehicleFipeCode, valor: ctx.vehicleValue, uso: req.usage },
    cepPernoite: req.overnightCep.replace(/\D/g, ""),
    condutor: { idade: req.driverAge, condutorJovem: req.youngDriver },
    bonus: req.bonusClass,
    coberturas: { casco: req.coverages.casco, rcfDm: req.coverages.rcfDanosMateriais, rcfDc: req.coverages.rcfDanosCorporais, app: req.coverages.app, vidros: req.coverages.vidros, carroReserva: req.coverages.carroReserva },
    franquia: req.deductible,
  };
}

export function fromInsurerResponse(r: InsurerQuoteResponse, receivedAt: string): QuoteResult {
  if (typeof r.premioTotal !== "number" || r.premioTotal <= 0) throw new AdapterError("mapping", "Resposta sem prêmio válido", INSURER_ID);
  return {
    id: `qr-${INSURER_ID}-${r.numeroCalculo}`,
    insurerId: INSURER_ID,
    productName: "Auto",
    annualPremium: r.premioTotal,
    deductible: r.franquia,
    coverages: r.coberturas.map((c) => ({ name: c.nome, limit: c.lmi, included: true })),
    assistance: r.assistencias ?? [],
    commissionPct: (r.percentualComissao ?? 0) / 100,
    status: "ok",
    source: { adapter: `${INSURER_ID}@1`, method: "api_oficial", receivedAt, reference: r.numeroCalculo },
  };
}

export const exampleAdapter: InsurerAdapterV2 = {
  insurerId: INSURER_ID,
  version: "0.0.0-modelo",
  bindings: [{ capability: "quote", method: "api_oficial", lines: ["auto"], description: "Modelo — sem seguradora real", status: "planejada" }],
  async healthCheck() {
    const t = Date.now();
    return { ok: !!BASE_URL, latencyMs: Date.now() - t, detail: BASE_URL ? undefined : "BASE_URL não configurada" };
  },
  async quoteAuto(req, ctx) {
    const cred = await envVault.get(INSURER_ID, "homologacao");
    if (!cred) throw new AdapterError("auth", "Credenciais não cadastradas no cofre", INSURER_ID, false);
    const body = toInsurerRequest(req, ctx, cred.brokerCode);
    const res = await insurerFetch<InsurerQuoteResponse>(INSURER_ID, `${BASE_URL}/cotacoes/auto`, { method: "POST", body, headers: { authorization: `Bearer ${cred.apiKey ?? ""}` } });
    return fromInsurerResponse(res, new Date().toISOString());
  },
};
