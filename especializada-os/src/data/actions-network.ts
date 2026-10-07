/** Importador de rede credenciada — aplica uma carga revisada (fonte, data, validade, confiança). */
import type { DB, NetworkService, ProviderType, User } from "@/domain/types";
import type { NetworkRow } from "@/integrations/health-networks";
import { addDays, nowISO, todayISO } from "@/lib/dates";
import { uid } from "./history";

export interface ReviewedRow { row: NetworkRow; planId?: string; decision: "vincular" | "novo" | "ignorar"; providerId?: string; lat: number; lng: number }

const TYPE: Record<string, ProviderType> = { hospital: "hospital", maternidade: "maternidade", laboratorio: "laboratorio", "laboratório": "laboratorio", clinica: "clinica", "clínica": "clinica", "pronto-socorro": "pronto-socorro" };

export function applyNetworkImport(db: DB, user: User | null, insurerId: string, label: string, rows: ReviewedRow[]): { db: DB; sourceId: string; created: number; linked: number } {
  const sourceId = uid("ns");
  let created = 0;
  let linked = 0;
  const providers = [...db.providers];
  const links = [...db.planProviders];
  for (const r of rows) {
    if (r.decision === "ignorar" || !r.planId) continue;
    let pid = r.providerId;
    if (r.decision === "novo" || !pid) {
      pid = uid("pr");
      providers.push({ id: pid, name: r.row.provider, aliases: [], type: TYPE[r.row.type.toLowerCase()] ?? "clinica", specialties: r.row.specialties.split(/[|/,]/).map((s) => s.trim()).filter(Boolean), address: r.row.address, district: r.row.district, city: r.row.city || "Rio de Janeiro", lat: r.lat, lng: r.lng, demo: true });
      created++;
    } else {
      const i = providers.findIndex((p) => p.id === pid);
      if (i >= 0 && providers[i].name !== r.row.provider && !providers[i].aliases.includes(r.row.provider)) providers[i] = { ...providers[i], aliases: [...providers[i].aliases, r.row.provider] };
    }
    const services = (r.row.services ? r.row.services.split(/[|/,]/).map((s) => s.trim().toLowerCase()) : ["consultas"]).filter(Boolean) as NetworkService[];
    if (!links.some((l) => l.planId === r.planId && l.providerId === pid)) {
      links.push({ planId: r.planId, providerId: pid, services, sourceId });
      linked++;
    }
  }
  const next: DB = {
    ...db, providers, planProviders: links,
    networkSources: [...db.networkSources, { id: sourceId, insurerId, kind: "csv", label, importedAt: todayISO(), validUntil: addDays(todayISO(), 90), status: "valida", confidence: 0.9, demo: true }],
    audit: [{ id: uid("au"), at: nowISO(), userId: user?.id ?? "sistema", entity: "NetworkDataSource", entityId: sourceId, action: "create", summary: `Rede importada (${label}): ${created} prestador(es) novo(s), ${linked} vínculo(s)`, source: "importacao" }, ...db.audit],
  };
  return { db: next, sourceId, created, linked };
}

export const SAMPLE_NETWORK_CSV = `Operadora;Plano;Prestador;Tipo;Endereço;Bairro;Cidade;Especialidades;Serviços
Amil;Amil Demo Plus;Atlantico Dor;Hospital;Rua Figueiredo de Magalhães, 875;Copacabana;Rio de Janeiro;Emergência|Cardiologia;internacao|pronto-socorro
Amil;Amil Demo Plus;Hospital Atlântico D'Or RJ;Hospital;R. Figueiredo Magalhães 875;Copacabana;Rio de Janeiro;Emergência;internacao
Amil;Amil Demo Plus;Clínica Dermato Leblon;Clínica;Rua Dias Ferreira, 400;Leblon;Rio de Janeiro;Dermatologia;consultas
Amil;Amil Demo Flex;Lab Barra Imagem;Laboratório;Av. das Américas, 7700;Barra da Tijuca;Rio de Janeiro;Imagem;exames
Amil;Amil Demo Flex;Centro Médico Tijuca Saúde;Clínica;Rua Conde de Bonfim, 500;Tijuca;Rio de Janeiro;Clínica geral|Pediatria;consultas|exames`;
