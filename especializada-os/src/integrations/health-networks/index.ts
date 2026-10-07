/**
 * Fontes de rede credenciada: importação de planilhas/PDF das operadoras,
 * APIs de parceiros quando contratadas. Toda carga registra fonte, data,
 * validade, status e confiança (NetworkDataSource) e passa pelo matching de
 * prestadores duplicados antes de ser publicada.
 */
export interface NetworkRow { operator: string; plan: string; provider: string; type: string; address: string; district: string; city: string; specialties: string; services: string }
export interface NetworkImporter { parse(file: { name: string; text: string }): Promise<NetworkRow[]> }

export function parseNetworkCsv(text: string): NetworkRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const idx = (k: string[]) => head.findIndex((h) => k.some((x) => h.includes(x)));
  const map = {
    operator: idx(["operadora"]), plan: idx(["plano"]), provider: idx(["prestador", "estabelecimento", "nome"]), type: idx(["tipo"]),
    address: idx(["endere"]), district: idx(["bairro"]), city: idx(["cidade", "munic"]), specialties: idx(["especial"]), services: idx(["servi", "atendimento"]),
  };
  return lines.slice(1).map((l) => {
    const c = l.split(sep).map((x) => x.trim());
    const g = (i: number) => (i >= 0 ? c[i] ?? "" : "");
    return { operator: g(map.operator), plan: g(map.plan), provider: g(map.provider), type: g(map.type), address: g(map.address), district: g(map.district), city: g(map.city), specialties: g(map.specialties), services: g(map.services) };
  });
}
