/**
 * Dados DEMO — 100% fictícios e marcados com `demo: true`.
 * Seguradoras, operadoras, hospitais e pessoas são INVENTADOS de propósito,
 * para nunca atribuir preços/redes inventados a marcas reais.
 * Geografia (bairros do Rio/Niterói) é real para a experiência de mapa.
 * Todas as datas são relativas a "hoje", então a DEMO está sempre atual.
 */
import type {
  Address, Asset, AutoQuoteRequest, Commission, Company, CompanyRelationship, DB, DocumentRecord, HealthPlan, HealthQuoteRequest,
  Household, Insurer, Interaction, NetworkDataSource, NetworkService, Opportunity, PartyRef, PipelineStage, PlanProviderLink, Policy,
  Proposal, Provider, ProviderType, Quote, QuoteResult, Task, User, AgeBand, AuditLog,
} from "@/domain/types";
import { AGE_BANDS } from "@/domain/types";
import { addDays, addMonths, ageOn, todayISO } from "@/lib/dates";
import { DEFAULT_ROLE_PERMISSIONS } from "@/domain/rbac";
import { NATIVE_AUTOMATIONS, runAutomations } from "@/domain/engines/automation";
import { recommend, planMonthlyPrice } from "@/domain/engines/health";
import { DEMO_PROFILES } from "@/integrations/insurers/registry";
import { demoAutoQuote, demoGenericQuote } from "@/integrations/insurers/adapters/demo-calculator";

export const SEED_VERSION = 5;

// PRNG determinístico (mulberry32)
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** CPF fictício com dígitos verificadores válidos (formato), gerado a partir de um número. */
function fakeCPF(n: number) {
  const base = String(100000000 + ((n * 7919) % 899999999)).slice(0, 9).split("").map(Number);
  const dv = (arr: number[]) => {
    const s = arr.reduce((acc, d, i) => acc + d * (arr.length + 1 - i), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = dv(base);
  const d2 = dv([...base, d1]);
  const all = [...base, d1, d2].join("");
  return `${all.slice(0, 3)}.${all.slice(3, 6)}.${all.slice(6, 9)}-${all.slice(9)}`;
}
function fakeCNPJ(n: number) {
  const base = String(10000000 + ((n * 104729) % 89999999)).slice(0, 8) + "0001";
  const digits = base.split("").map(Number);
  const calc = (arr: number[], weights: number[]) => {
    const s = arr.reduce((acc, d, i) => acc + d * weights[i], 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc([...digits, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const all = base + d1 + d2;
  return `${all.slice(0, 2)}.${all.slice(2, 5)}.${all.slice(5, 8)}/${all.slice(8, 12)}-${all.slice(12)}`;
}

const D = true as const;

export function createSeed(today = todayISO()): DB {
  const r = rng(20261007);
  const ts = (dayOffset: number, hour = 10, min = 0) => {
    const d = addDays(today, dayOffset);
    return `${d}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00.000-03:00`;
  };
  const birth = (age: number, mm = 5, dd = 14) => `${Number(today.slice(0, 4)) - age}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

  // ───────── Usuários
  const users: User[] = [
    { id: "u-ana", name: "Ana Martins", email: "ana@especializada.demo", role: "admin", demo: D },
    { id: "u-carlos", name: "Carlos Lima", email: "carlos@especializada.demo", role: "gestor", demo: D },
    { id: "u-juliana", name: "Juliana Costa", email: "juliana@especializada.demo", role: "corretor", demo: D },
    { id: "u-rafael", name: "Rafael Souza", email: "rafael@especializada.demo", role: "corretor", demo: D },
    { id: "u-bianca", name: "Bianca Alves", email: "bianca@especializada.demo", role: "operacional", demo: D },
    { id: "u-marcos", name: "Marcos Teixeira", email: "marcos@especializada.demo", role: "financeiro", demo: D },
  ];

  // ───────── Endereços
  const A = (id: string, label: string, street: string, number: string, district: string, cep: string, lat: number, lng: number, city = "Rio de Janeiro", complement?: string): Address =>
    ({ id, label, street, number, district, cep, lat, lng, city, state: "RJ", complement });
  const addresses: Address[] = [
    A("a-silva", "Residencial", "Rua Dias Ferreira", "210", "Leblon", "22431-050", -22.9846, -43.2246, undefined, "apto 801"),
    A("a-souza", "Residencial", "Rua Visconde de Pirajá", "540", "Ipanema", "22410-002", -22.9842, -43.2063, undefined, "apto 302"),
    A("a-oliveira", "Residencial", "Av. Lúcio Costa", "3600", "Barra da Tijuca", "22630-010", -23.0108, -43.3302, undefined, "casa 12"),
    A("a-pereira", "Residencial", "Rua Voluntários da Pátria", "190", "Botafogo", "22270-010", -22.9528, -43.1882, undefined, "apto 1104"),
    A("a-almeida", "Residencial", "Rua Conde de Bonfim", "800", "Tijuca", "20530-002", -22.9282, -43.2369, undefined, "apto 503"),
    A("a-nogueira", "Residencial", "Estrada da Gávea", "899", "São Conrado", "22610-001", -22.9945, -43.2597),
    A("a-thiago", "Residencial", "Rua São Clemente", "120", "Botafogo", "22260-000", -22.9505, -43.1866, undefined, "apto 210"),
    A("a-larissa", "Residencial", "Rua Marquês de Abrantes", "88", "Flamengo", "22230-061", -22.9369, -43.1767, undefined, "apto 901"),
    A("a-andre", "Residencial", "Rua Marquês de São Vicente", "300", "Gávea", "22451-041", -22.9772, -43.2305),
    A("a-vanessa", "Residencial", "Rua Barata Ribeiro", "400", "Copacabana", "22040-002", -22.9673, -43.1866, undefined, "apto 707"),
    A("a-gustavo", "Residencial", "Av. Genaro de Carvalho", "1200", "Recreio", "22795-077", -23.0151, -43.4553),
    A("a-renata", "Residencial", "Rua das Laranjeiras", "350", "Laranjeiras", "22240-003", -22.9369, -43.1901, undefined, "apto 402"),
    A("a-felipe", "Residencial", "Rua Gavião Peixoto", "70", "Icaraí", "24230-100", -22.9039, -43.1123, "Niterói"),
    A("a-sergio", "Residencial", "Av. Epitácio Pessoa", "2500", "Lagoa", "22471-003", -22.9733, -43.2066, undefined, "apto 1001"),
    A("a-mariana", "Residencial", "Rua Jardim Botânico", "600", "Jardim Botânico", "22461-000", -22.9645, -43.2178),
    A("a-abc", "Sede", "Av. Rio Branco", "156", "Centro", "20040-003", -22.9064, -43.1771, undefined, "sala 1802"),
    A("a-nogeng", "Sede", "Av. das Américas", "3500", "Barra da Tijuca", "22640-102", -23.0002, -43.3448, undefined, "bloco 2, sala 501"),
    A("a-clinica", "Sede", "Rua Humaitá", "275", "Humaitá", "22261-001", -22.9563, -43.1985),
    A("a-cafe", "Loja", "Rua Garcia d'Ávila", "56", "Ipanema", "22421-010", -22.9851, -43.2087),
    A("a-technova", "Sede", "Praia de Botafogo", "300", "Botafogo", "22250-040", -22.9475, -43.1818, undefined, "8º andar"),
    A("a-silva-praia", "Veraneio", "Rua do Sol", "15", "Recreio", "22790-000", -23.0201, -43.4701),
  ];

  // ───────── Pessoas
  let cpfN = 11;
  const P = (id: string, name: string, age: number, extra: Partial<import("@/domain/types").Person> = {}) => ({
    id, name, cpf: fakeCPF(cpfN++), birthDate: birth(age, 1 + (cpfN % 12), 1 + ((cpfN * 7) % 27)), clientStatus: null, demo: D, ...extra,
  }) as import("@/domain/types").Person;
  const persons = [
    P("p-joao", "João Silva", 52, { gender: "M", phone: "5521998761234", whatsapp: "5521998761234", email: "joao.silva@exemplo.demo", addressId: "a-silva", profession: "Empresário", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -74), source: "Indicação" }),
    P("p-maria", "Maria Silva", 49, { gender: "F", phone: "5521998761235", whatsapp: "5521998761235", email: "maria.silva@exemplo.demo", addressId: "a-silva", profession: "Arquiteta" }),
    P("p-pedro", "Pedro Silva", 19, { gender: "M", addressId: "a-silva", profession: "Estudante" }),
    P("p-anasilva", "Ana Silva", 15, { gender: "F", addressId: "a-silva" }),
    P("p-fernanda", "Fernanda Souza", 38, { gender: "F", phone: "5521997654321", whatsapp: "5521997654321", email: "fernanda.souza@exemplo.demo", addressId: "a-souza", profession: "Médica pediatra", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -20), source: "Site" }),
    P("p-ricardo", "Ricardo Souza", 40, { gender: "M", addressId: "a-souza", profession: "Economista", phone: "5521997654322" }),
    P("p-lucas", "Lucas Souza", 8, { gender: "M", addressId: "a-souza" }),
    P("p-roberto", "Roberto Oliveira", 63, { gender: "M", phone: "5521996543210", whatsapp: "5521996543210", email: "roberto.oliveira@exemplo.demo", addressId: "a-oliveira", profession: "Aposentado", ownerId: "u-rafael", clientStatus: "ativo", clientSince: addMonths(today, -110), source: "Carteira antiga" }),
    P("p-helena", "Helena Oliveira", 60, { gender: "F", addressId: "a-oliveira", profession: "Professora aposentada" }),
    P("p-camila", "Camila Pereira", 34, { gender: "F", phone: "5521995432109", whatsapp: "5521995432109", email: "camila.pereira@exemplo.demo", addressId: "a-pereira", profession: "Advogada", ownerId: "u-juliana", clientStatus: "lead", clientSince: addDays(today, -6), source: "Indicação de Fernanda Souza" }),
    P("p-bruno", "Bruno Pereira", 36, { gender: "M", addressId: "a-pereira", profession: "Engenheiro" }),
    P("p-sofia", "Sofia Pereira", 3, { gender: "F", addressId: "a-pereira" }),
    P("p-theo", "Theo Pereira", 0, { gender: "M", addressId: "a-pereira" }),
    P("p-paulo", "Paulo Almeida", 45, { gender: "M", phone: "5521994321098", whatsapp: "5521994321098", email: "paulo.almeida@exemplo.demo", addressId: "a-almeida", profession: "Engenheiro civil", ownerId: "u-rafael", clientStatus: "ativo", clientSince: addMonths(today, -40) }),
    P("p-luciana", "Luciana Almeida", 44, { gender: "F", addressId: "a-almeida", profession: "Dentista", phone: "5521994321099" }),
    P("p-gabriel", "Gabriel Almeida", 17, { gender: "M", addressId: "a-almeida" }),
    P("p-beatriz", "Beatriz Almeida", 12, { gender: "F", addressId: "a-almeida" }),
    P("p-eduardo", "Eduardo Nogueira", 55, { gender: "M", phone: "5521993210987", whatsapp: "5521993210987", email: "eduardo@nogueiraeng.demo", addressId: "a-nogueira", profession: "Engenheiro / empresário", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -96) }),
    P("p-patricia", "Patrícia Nogueira", 52, { gender: "F", addressId: "a-nogueira", profession: "Psicóloga" }),
    P("p-thiago", "Thiago Mendes", 29, { gender: "M", phone: "5521992109876", whatsapp: "5521992109876", email: "thiago.mendes@exemplo.demo", addressId: "a-thiago", profession: "Desenvolvedor", ownerId: "u-rafael", clientStatus: "lead", clientSince: addDays(today, -12), source: "Site" }),
    P("p-larissa", "Larissa Campos", 33, { gender: "F", phone: "5521991098765", whatsapp: "5521991098765", email: "larissa.campos@exemplo.demo", addressId: "a-larissa", profession: "Arquiteta", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -30) }),
    P("p-andre", "André Barros", 41, { gender: "M", phone: "5521990987654", whatsapp: "5521990987654", email: "andre.barros@exemplo.demo", addressId: "a-andre", profession: "Médico ortopedista", ownerId: "u-rafael", clientStatus: "ativo", clientSince: addMonths(today, -52) }),
    P("p-vanessa", "Vanessa Lopes", 27, { gender: "F", phone: "5521989876543", whatsapp: "5521989876543", email: "vanessa.lopes@exemplo.demo", addressId: "a-vanessa", profession: "Designer", ownerId: "u-rafael", clientStatus: "lead", clientSince: addDays(today, -3), source: "Instagram" }),
    P("p-gustavo", "Gustavo Ferreira", 48, { gender: "M", phone: "5521988765432", whatsapp: "5521988765432", email: "gustavo@technova.demo", addressId: "a-gustavo", profession: "Empresário (TI)", ownerId: "u-rafael", clientStatus: "ativo", clientSince: addMonths(today, -63) }),
    P("p-renata", "Renata Duarte", 36, { gender: "F", phone: "5521987654321", whatsapp: "5521987654321", email: "renata.duarte@exemplo.demo", addressId: "a-renata", profession: "Jornalista", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -18) }),
    P("p-felipe", "Felipe Araújo", 31, { gender: "M", phone: "5521986543210", whatsapp: "5521986543210", email: "felipe.araujo@exemplo.demo", addressId: "a-felipe", profession: "Motorista de aplicativo", ownerId: "u-rafael", clientStatus: "ativo", clientSince: addMonths(today, -11) }),
    P("p-sergio", "Sérgio Ramos", 66, { gender: "M", phone: "5521985432109", whatsapp: "5521985432109", email: "sergio.ramos@exemplo.demo", addressId: "a-sergio", profession: "Advogado", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -130) }),
    P("p-mariana", "Mariana Teixeira", 26, { gender: "F", phone: "5521984321098", whatsapp: "5521984321098", email: "mariana.t@exemplo.demo", addressId: "a-mariana", profession: "Analista de marketing", ownerId: "u-juliana", clientStatus: "lead", clientSince: today, source: "Site" }),
  ];

  // ───────── Empresas
  const companies: Company[] = [
    { id: "c-abc", legalName: "ABC Comércio e Serviços Ltda", tradeName: "Empresa ABC", cnpj: fakeCNPJ(1), sector: "Comércio atacadista", employees: 34, addressId: "a-abc", phone: "552132104500", email: "contato@abc.demo", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -50), demo: D },
    { id: "c-nogeng", legalName: "Nogueira Engenharia e Construções S.A.", tradeName: "Nogueira Engenharia", cnpj: fakeCNPJ(2), sector: "Construção civil", employees: 120, addressId: "a-nogeng", phone: "552133305000", email: "financeiro@nogueiraeng.demo", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -90), demo: D },
    { id: "c-clinica", legalName: "Clínica Vida Plena Serviços Médicos Ltda", tradeName: "Clínica Vida Plena", cnpj: fakeCNPJ(3), sector: "Saúde", employees: 18, addressId: "a-clinica", phone: "552125371000", email: "adm@vidaplena.demo", ownerId: "u-rafael", clientStatus: "ativo", clientSince: addMonths(today, -26), demo: D },
    { id: "c-cafe", legalName: "Café Aurora Alimentos Ltda", tradeName: "Café Aurora", cnpj: fakeCNPJ(4), sector: "Alimentação", employees: 9, addressId: "a-cafe", phone: "552125220300", email: "ola@cafeaurora.demo", ownerId: "u-juliana", clientStatus: "ativo", clientSince: addMonths(today, -14), demo: D },
    { id: "c-technova", legalName: "TechNova Software Ltda", tradeName: "TechNova", cnpj: fakeCNPJ(5), sector: "Tecnologia", employees: 46, addressId: "a-technova", phone: "552130300900", email: "people@technova.demo", ownerId: "u-rafael", clientStatus: "ativo", clientSince: addMonths(today, -36), demo: D },
  ];

  const households: Household[] = [
    { id: "h-silva", name: "Família Silva", addressId: "a-silva", demo: D, members: [{ personId: "p-joao", relation: "titular" }, { personId: "p-maria", relation: "cônjuge" }, { personId: "p-pedro", relation: "filho(a)" }, { personId: "p-anasilva", relation: "filho(a)" }] },
    { id: "h-souza", name: "Família Souza", addressId: "a-souza", demo: D, members: [{ personId: "p-fernanda", relation: "titular" }, { personId: "p-ricardo", relation: "cônjuge" }, { personId: "p-lucas", relation: "filho(a)" }] },
    { id: "h-oliveira", name: "Família Oliveira", addressId: "a-oliveira", demo: D, members: [{ personId: "p-roberto", relation: "titular" }, { personId: "p-helena", relation: "cônjuge" }] },
    { id: "h-pereira", name: "Família Pereira", addressId: "a-pereira", demo: D, members: [{ personId: "p-camila", relation: "titular" }, { personId: "p-bruno", relation: "cônjuge" }, { personId: "p-sofia", relation: "filho(a)" }, { personId: "p-theo", relation: "filho(a)" }] },
    { id: "h-almeida", name: "Família Almeida", addressId: "a-almeida", demo: D, members: [{ personId: "p-paulo", relation: "titular" }, { personId: "p-luciana", relation: "cônjuge" }, { personId: "p-gabriel", relation: "filho(a)" }, { personId: "p-beatriz", relation: "filho(a)" }] },
    { id: "h-nogueira", name: "Família Nogueira", addressId: "a-nogueira", demo: D, members: [{ personId: "p-eduardo", relation: "titular" }, { personId: "p-patricia", relation: "cônjuge" }] },
  ];

  const CR = (id: string, companyId: string, personId: string, role: CompanyRelationship["role"], share?: number): CompanyRelationship => ({ id, companyId, personId, role, share, demo: D });
  const companyRelationships: CompanyRelationship[] = [
    CR("cr-1", "c-abc", "p-joao", "sócio", 60), CR("cr-2", "c-abc", "p-maria", "sócio", 40), CR("cr-3", "c-abc", "p-pedro", "funcionário"),
    CR("cr-4", "c-nogeng", "p-eduardo", "sócio", 70), CR("cr-5", "c-nogeng", "p-paulo", "sócio", 30), CR("cr-6", "c-nogeng", "p-patricia", "contato"),
    CR("cr-7", "c-clinica", "p-andre", "sócio", 50), CR("cr-8", "c-clinica", "p-fernanda", "sócio", 50),
    CR("cr-9", "c-cafe", "p-larissa", "administrador", 100),
    CR("cr-10", "c-technova", "p-gustavo", "sócio", 80), CR("cr-11", "c-technova", "p-thiago", "funcionário"), CR("cr-12", "c-technova", "p-mariana", "funcionário"),
  ];

  // ───────── Ativos
  const person = (id: string): PartyRef => ({ type: "person", id });
  const company = (id: string): PartyRef => ({ type: "company", id });
  const V = (id: string, owner: PartyRef, make: string, model: string, version: string, yearModel: number, plate: string, fipeValue: number, overnightCep: string, usage: "particular" | "comercial" | "aplicativo" = "particular", mainDriverId?: string): Asset =>
    ({ id, owner, type: "vehicle", make, model, version, yearModel, plate, fipeCode: `0${(id.length * 97321) % 99999}-${id.length % 9}`, fipeValue, usage, garage: { home: true, work: usage === "particular" }, overnightCep, mainDriverId, demo: D });
  const assets: Asset[] = [
    V("v-joao", person("p-joao"), "BMW", "X3", "xDrive30e M Sport", 2023, "RIO2A23", 389000, "22431-050", "particular", "p-joao"),
    V("v-maria", person("p-maria"), "Toyota", "Corolla Cross", "XRE 2.0", 2022, "RJS4B56", 148000, "22431-050", "particular", "p-maria"),
    V("v-roberto", person("p-roberto"), "Toyota", "Corolla", "Altis Hybrid", 2022, "LTR7C89", 152000, "22630-010", "particular", "p-roberto"),
    V("v-paulo", person("p-paulo"), "Jeep", "Compass", "Longitude T270", 2021, "KXP1D23", 138000, "20530-002", "particular", "p-paulo"),
    V("v-luciana", person("p-luciana"), "Honda", "HR-V", "EXL 1.5", 2023, "QTA2E45", 148000, "20530-002", "particular", "p-luciana"),
    V("v-eduardo", person("p-eduardo"), "Volvo", "XC60", "Recharge T8", 2024, "NOG3F67", 345000, "22610-001", "particular", "p-eduardo"),
    V("v-andre", person("p-andre"), "Audi", "A3", "Sedan Performance", 2022, "AND4G89", 190000, "22451-041", "particular", "p-andre"),
    V("v-gustavo", person("p-gustavo"), "Volkswagen", "T-Cross", "Highline 250 TSI", 2022, "GUS5H01", 118000, "22795-077", "particular", "p-gustavo"),
    V("v-felipe", person("p-felipe"), "Chevrolet", "Onix", "LT 1.0 Turbo", 2023, "FEL6I23", 82000, "24230-100", "aplicativo", "p-felipe"),
    V("v-fernanda", person("p-fernanda"), "Fiat", "Pulse", "Impetus 1.0 Turbo", 2023, "FER7J45", 105000, "22410-002", "particular", "p-fernanda"),
    V("v-thiago", person("p-thiago"), "Hyundai", "HB20", "Comfort Plus 1.0 TGDI", 2020, "THI8K67", 68000, "22260-000", "particular", "p-thiago"),
    V("v-nogeng", company("c-nogeng"), "Toyota", "Hilux", "SRX 2.8 4x4", 2023, "NOG9L89", 270000, "22640-102", "comercial"),
    { id: "im-silva", owner: person("p-joao"), type: "property", kind: "apartamento", addressId: "a-silva", areaM2: 210, value: 2800000, use: "habitual", demo: D },
    { id: "im-silva-praia", owner: person("p-joao"), type: "property", kind: "casa", addressId: "a-silva-praia", areaM2: 180, value: 1250000, use: "veraneio", demo: D },
    { id: "im-oliveira", owner: person("p-roberto"), type: "property", kind: "casa", addressId: "a-oliveira", areaM2: 320, value: 1900000, use: "habitual", demo: D },
    { id: "im-larissa", owner: person("p-larissa"), type: "property", kind: "apartamento", addressId: "a-larissa", areaM2: 95, value: 950000, use: "habitual", demo: D },
    { id: "im-gustavo", owner: person("p-gustavo"), type: "property", kind: "casa", addressId: "a-gustavo", areaM2: 260, value: 1400000, use: "habitual", demo: D },
    { id: "im-paulo", owner: person("p-paulo"), type: "property", kind: "apartamento", addressId: "a-almeida", areaM2: 120, value: 780000, use: "habitual", demo: D },
    { id: "im-eduardo", owner: person("p-eduardo"), type: "property", kind: "casa", addressId: "a-nogueira", areaM2: 540, value: 4200000, use: "habitual", demo: D },
    { id: "im-fernanda", owner: person("p-fernanda"), type: "property", kind: "apartamento", addressId: "a-souza", areaM2: 140, value: 1650000, use: "habitual", demo: D },
    { id: "im-clinica", owner: company("c-clinica"), type: "property", kind: "comercial", addressId: "a-clinica", areaM2: 380, value: 3100000, use: "comercial", demo: D },
    { id: "bt-eduardo", owner: person("p-eduardo"), type: "boat", name: "Brisa", lengthFt: 38, value: 1200000, marina: "Marina da Glória", demo: D },
  ];

  // ───────── Seguradoras / operadoras — catálogo inicial das principais do mercado.
  // Os NOMES são reais; ramos atendidos "a confirmar" pela corretora. Preços, planos, redes e
  // cotações exibidos na DEMO são SIMULADOS e não representam produtos/tarifas dessas empresas.
  // Decisão de negócio: integração própria (adapter por seguradora), sem agregador.
  const PENDING = "Integração própria a desenvolver — depende de acesso/API liberado pela seguradora";
  const SIM = "DEMO: cotação simulada (calculadora fictícia). Integração própria pendente.";
  const I = (id: string, name: string, short: string, color: string, lines: Insurer["lines"], status: Insurer["integration"]["status"] = "nao_configurada", note = PENDING): Insurer =>
    ({ id, name, short, color, lines, integration: { method: "manual", status, note }, demo: D });
  const insurers: Insurer[] = [
    { ...I("ins-porto", "Porto Seguro", "Porto", "#1d4ed8", ["auto", "residencial", "vida", "empresarial", "viagem", "fianca", "condominio", "equipamentos"], "demo", SIM), integrationPath: { wave: 2, summary: "Sem portal público de APIs para corretor encontrado (integração de mercado via Segfy). Pedido formal ao comercial; enquanto isso, arquivos oficiais do portal.", confirmed: false } },
    { ...I("ins-tokio", "Tokio Marine", "Tokio Marine", "#0e7490", ["auto", "residencial", "vida", "empresarial", "rc", "transportes", "garantia"], "demo", SIM), integrationPath: { wave: 2, summary: "Sem API pública; termo do portal proíbe robôs de cálculo. Pedido formal; alternativa autorizada: cotador white-label “Negócios Digitais”.", confirmed: false } },
    { ...I("ins-allianz", "Allianz Seguros", "Allianz", "#1e3a8a", ["auto", "residencial", "empresarial", "rc", "cyber", "transportes"], "demo", SIM), integrationPath: { wave: 2, summary: "Sem portal de APIs no Brasil encontrado. Pedido formal ao comercial.", confirmed: false } },
    { ...I("ins-hdi", "HDI Seguros", "HDI", "#15803d", ["auto", "residencial", "empresarial", "rc"], "demo", SIM), integrationPath: { wave: 1, summary: "API OAuth2 de cotação, proposta, apólice e sinistro citada em fonte não oficial — pedir acesso formal à HDI.", confirmed: false } },
    { ...I("ins-bradesco", "Bradesco Seguros", "Bradesco", "#cc092f", ["auto", "residencial", "vida", "previdencia", "empresarial"], "demo", SIM), integrationPath: { wave: 1, summary: "Portal de APIs para parceiros (parcelas, residencial; certificado digital e ambientes de homologação). Confirmar se corretora é elegível.", confirmed: true } },
    { ...I("ins-zurich", "Zurich Seguros", "Zurich", "#2563eb", ["auto", "residencial", "vida", "empresarial", "rc"], "demo", "DEMO: simula seguradora sem integração — cotação registrada manualmente."), integrationPath: { wave: 2, summary: "Grupo tem marketplace global de APIs; disponibilidade para corretor no Brasil a confirmar.", confirmed: false } },
    { ...I("ins-mapfre", "Mapfre Seguros", "Mapfre", "#dc2626", ["auto", "residencial", "vida", "empresarial", "viagem", "nautico"]), integrationPath: { wave: 2, summary: "Sem portal de APIs encontrado. Pedido formal ao comercial.", confirmed: false } },
    { ...I("ins-azul", "Azul Seguros", "Azul", "#0284c7", ["auto"]), integrationPath: { wave: 2, summary: "Grupo Porto — mesmo canal de pedido da Porto.", confirmed: false } },
    { ...I("ins-yelum", "Yelum Seguros", "Yelum", "#ca8a04", ["auto", "residencial", "empresarial", "vida"]), integrationPath: { wave: 2, summary: "Sem portal de APIs encontrado (grupo HDI) — perguntar se a API da HDI cobre a Yelum.", confirmed: false } },
    { ...I("ins-suhai", "Suhai Seguradora", "Suhai", "#4d7c0f", ["auto"]), integrationPath: { wave: 2, summary: "Integra com softwares de multicálculo por parceria; pedir acesso direto.", confirmed: false } },
    { ...I("ins-sompo", "Sompo Seguros", "Sompo", "#b91c1c", ["auto", "empresarial", "transportes", "rc"]), integrationPath: { wave: 1, summary: "Portal de desenvolvedores (corporate/agro: cotação, sinistros, financeiro) com certificação da aplicação.", confirmed: true } },
    { ...I("ins-chubb", "Chubb Seguros", "Chubb", "#334155", ["residencial", "empresarial", "rc", "cyber", "viagem", "vida"]), integrationPath: { wave: 2, summary: "Chubb Studio (APIs para parceiros digitais B2B2C); uso por corretora a confirmar.", confirmed: false } },
    { ...I("ins-axa", "AXA Seguros", "AXA", "#1e40af", ["empresarial", "rc", "cyber", "transportes"]), integrationPath: { wave: 2, summary: "Plataformas digitais de cotação para corretores; API externa a confirmar.", confirmed: false } },
    I("ins-sulamerica", "SulAmérica Vida e Previdência", "SulAmérica", "#ea580c", ["vida", "previdencia"]),
    { ...I("ins-icatu", "Icatu Seguros", "Icatu", "#0f766e", ["vida", "previdencia"]), integrationPath: { wave: 3, summary: "Plataforma de APIs para parceiros de vida e previdência — pedir enquadramento como parceiro.", confirmed: true } },
    { ...I("ins-mag", "MAG Seguros", "MAG", "#7c2d12", ["vida", "previdencia"]), integrationPath: { wave: 3, summary: "Plataforma de APIs para parceiros (vida) — pedir enquadramento como parceiro.", confirmed: true } },
    I("ins-prudential", "Prudential do Brasil", "Prudential", "#1d4ed8", ["vida"]),
    I("ins-metlife", "MetLife", "MetLife", "#0369a1", ["vida", "odonto"]),
    { ...I("ins-allseg", "allseg Seguradora", "allseg", "#0d9488", ["residencial", "empresarial", "garantia", "rc", "vida"]), integrationPath: { wave: 1, summary: "APIs de cotação e emissão para corretores com sistema próprio (residencial, empresarial, garantia, RC, vida).", confirmed: true } },
    { ...I("ins-junto", "Junto Seguros", "Junto", "#7c3aed", ["garantia"]), integrationPath: { wave: 1, summary: "API usada por corretores para cotar e emitir garantia; exige corretor cadastrado.", confirmed: true } },
    { ...I("ins-pottencial", "Pottencial Seguradora", "Pottencial", "#9333ea", ["garantia", "fianca"]), integrationPath: { wave: 1, summary: "Portal do desenvolvedor: corretora parceira cota e emite por API.", confirmed: true } },
    I("ins-bradesco-saude", "Bradesco Saúde", "Bradesco Saúde", "#be123c", ["saude", "odonto"], "demo", "DEMO: planos, preços e rede simulados (importação de tabela/rede)."),
    I("ins-sulamerica-saude", "SulAmérica Saúde", "SulAmérica Saúde", "#f97316", ["saude", "odonto"], "demo", "DEMO: planos, preços e rede simulados."),
    I("ins-amil", "Amil", "Amil", "#0369a1", ["saude", "odonto"], "demo", "DEMO: planos, preços e rede simulados."),
    I("ins-assim", "Assim Saúde", "Assim", "#a16207", ["saude"], "demo", "DEMO: planos, preços e rede simulados."),
    I("ins-porto-saude", "Porto Saúde", "Porto Saúde", "#2563eb", ["saude"]),
    I("ins-unimed", "Unimed", "Unimed", "#047857", ["saude", "odonto"]),
    I("ins-hapvida", "Hapvida NotreDame Intermédica", "Hapvida GNDI", "#ea580c", ["saude", "odonto"]),
    I("ins-omint", "Omint", "Omint", "#1f2937", ["saude", "odonto"]),
    I("ins-careplus", "Care Plus", "Care Plus", "#0891b2", ["saude"]),
    I("ins-odontoprev", "OdontoPrev", "OdontoPrev", "#0ea5e9", ["odonto"]),
  ];


  // ───────── Fontes de rede
  const networkSources: NetworkDataSource[] = [
    { id: "ns-vitalis", insurerId: "ins-bradesco-saude", kind: "xlsx", label: "Rede Bradesco Saúde RJ (planilha DEMO)", importedAt: addDays(today, -20), validUntil: addDays(today, 70), status: "valida", confidence: 0.95, demo: D },
    { id: "ns-carioca", insurerId: "ins-amil", kind: "pdf", label: "Guia médico Amil (PDF DEMO)", importedAt: addDays(today, -78), validUntil: addDays(today, 12), status: "expirando", confidence: 0.82, demo: D },
    { id: "ns-amparo", insurerId: "ins-sulamerica-saude", kind: "api", label: "API de rede SulAmérica (simulada)", importedAt: addDays(today, -1), validUntil: addDays(today, 6), status: "valida", confidence: 0.98, demo: D },
    { id: "ns-essencial", insurerId: "ins-assim", kind: "csv", label: "Rede Assim (CSV DEMO)", importedAt: addDays(today, -132), validUntil: addDays(today, -42), status: "expirada", confidence: 0.7, demo: D },
  ];

  // ───────── Planos de saúde (FICTÍCIOS)
  const FACT = [1, 1.18, 1.36, 1.5, 1.62, 1.78, 2.1, 2.62, 3.3, 5.95];
  const prices = (base: number) => Object.fromEntries(AGE_BANDS.map((b, i) => [b, Math.round(base * FACT[i] * 100) / 100])) as Record<AgeBand, number>;
  const HP = (id: string, insurerId: string, name: string, tier: HealthPlan["tier"], segment: HealthPlan["segment"], accommodation: HealthPlan["accommodation"], coparticipation: boolean, reimbursement: HealthPlan["reimbursement"], reimbursementConsultation: number, coverage: HealthPlan["coverage"], base: number, networkSourceId: string): HealthPlan =>
    ({ id, insurerId, name, tier, segment, accommodation, coparticipation, reimbursement, reimbursementConsultation, coverage, pricesByBand: prices(base), networkSourceId, demo: D });
  const healthPlans: HealthPlan[] = [
    HP("hp-ess-bairro", "ins-assim", "Assim Demo Bairro", 1, "individual", "enfermaria", true, "nenhum", 0, "municipal", 165, "ns-essencial"),
    HP("hp-ess-mais", "ins-assim", "Assim Demo Mais", 1, "individual", "apartamento", false, "nenhum", 0, "municipal", 238, "ns-essencial"),
    HP("hp-car-flex", "ins-amil", "Amil Demo Flex", 2, "individual", "apartamento", true, "nenhum", 0, "regional", 296, "ns-carioca"),
    HP("hp-car-plus", "ins-amil", "Amil Demo Plus", 3, "individual", "apartamento", false, "basico", 120, "estadual", 432, "ns-carioca"),
    HP("hp-amp-classico", "ins-sulamerica-saude", "SulAmérica Demo Clássico", 2, "adesao", "apartamento", false, "basico", 100, "estadual", 388, "ns-amparo"),
    HP("hp-amp-exec", "ins-sulamerica-saude", "SulAmérica Demo Executivo", 4, "adesao", "apartamento", false, "alto", 450, "nacional", 845, "ns-amparo"),
    HP("hp-vit-essencial", "ins-bradesco-saude", "Bradesco Demo Essencial", 2, "individual", "enfermaria", false, "nenhum", 0, "regional", 342, "ns-vitalis"),
    HP("hp-vit-prime", "ins-bradesco-saude", "Bradesco Demo Prime", 3, "individual", "apartamento", false, "intermediario", 250, "nacional", 568, "ns-vitalis"),
    HP("hp-vit-black", "ins-bradesco-saude", "Bradesco Demo Black", 4, "individual", "apartamento", false, "premium", 700, "nacional", 1160, "ns-vitalis"),
    HP("hp-vit-pme", "ins-bradesco-saude", "Bradesco Demo Empresa", 3, "pme", "apartamento", false, "basico", 150, "nacional", 395, "ns-vitalis"),
    HP("hp-amp-pme", "ins-sulamerica-saude", "SulAmérica Demo PME", 2, "pme", "apartamento", true, "nenhum", 0, "estadual", 318, "ns-amparo"),
  ];

  // ───────── Prestadores (FICTÍCIOS)
  type PDef = [string, string, string[], ProviderType, string[], string, string, number, number, number, string?];
  const defs: PDef[] = [
    ["pr-atlantico", "Hospital Atlântico D'Or", ["Atlantico Dor", "Hospital Atlântico D'Or RJ", "Atlântico D Or"], "hospital", ["Emergência", "Cardiologia", "Ortopedia", "UTI", "Oncologia"], "Rua Figueiredo de Magalhães, 875", "Copacabana", -22.9665, -43.1885, 3],
    ["pr-leblon", "Hospital Leblon Premium", ["Leblon Premium"], "hospital", ["Emergência", "Cardiologia", "Neurologia", "UTI", "Cirurgia robótica"], "Av. Ataulfo de Paiva, 1100", "Leblon", -22.9836, -43.2254, 4],
    ["pr-saoconrado", "Hospital São Conrado Beira-Mar", ["Sao Conrado Beira Mar"], "hospital", ["Emergência", "Ortopedia", "UTI"], "Av. Prefeito Mendes de Morais, 400", "São Conrado", -22.9982, -43.2652, 3],
    ["pr-barra", "Hospital Barra Central", ["Barra Central"], "hospital", ["Emergência", "Clínica médica", "Pediatria", "UTI"], "Av. das Américas, 4666", "Barra da Tijuca", -22.9998, -43.3555, 2],
    ["pr-botafogo", "Hospital Botafogo Santa Clara", ["Santa Clara Botafogo"], "hospital", ["Emergência", "Clínica médica", "Ortopedia"], "Rua Real Grandeza, 108", "Botafogo", -22.9561, -43.1905, 2],
    ["pr-tijuca", "Hospital Tijuca São Vicente", ["Sao Vicente Tijuca"], "hospital", ["Emergência", "Cardiologia", "Pediatria"], "Rua Haddock Lobo, 400", "Tijuca", -22.9205, -43.2172, 2],
    ["pr-gavea", "Hospital Gávea Jardim", ["Gavea Jardim"], "hospital", ["Emergência", "Pediatria", "UTI neonatal", "Oncologia"], "Rua Marquês de São Vicente, 98", "Gávea", -22.9763, -43.2277, 3],
    ["pr-laranjeiras", "Hospital Laranjeiras Imperial", ["Laranjeiras Imperial"], "hospital", ["Emergência", "Clínica médica", "Cardiologia"], "Rua das Laranjeiras, 500", "Laranjeiras", -22.9391, -43.1923, 2],
    ["pr-icarai", "Hospital Niterói Icaraí", ["Icarai Niteroi"], "hospital", ["Emergência", "Ortopedia", "Pediatria", "UTI"], "Rua Moreira César, 200", "Icaraí", -22.9049, -43.1092, 2, "Niterói"],
    ["pr-recreio", "Hospital Recreio Atlântico", ["Recreio Atlantico"], "hospital", ["Emergência", "Clínica médica"], "Av. das Américas, 18000", "Recreio", -23.0124, -43.4621, 1],
    ["pr-centro", "Hospital Centro Carioca", ["Centro Carioca"], "hospital", ["Emergência", "Clínica médica", "Ortopedia"], "Rua do Riachuelo, 150", "Centro", -22.9128, -43.1867, 1],
    ["pr-mat-lagoa", "Maternidade Perinatal Lagoa", ["Perinatal Lagoa"], "maternidade", ["Obstetrícia", "UTI neonatal"], "Av. Borges de Medeiros, 1500", "Lagoa", -22.9742, -43.2144, 3],
    ["pr-mat-barra", "Maternidade Barra Vida", ["Barra Vida"], "maternidade", ["Obstetrícia", "UTI neonatal"], "Av. Ayrton Senna, 2000", "Barra da Tijuca", -22.9895, -43.3657, 2],
    ["pr-mat-botafogo", "Maternidade Botafogo Mãe", ["Botafogo Mae"], "maternidade", ["Obstetrícia"], "Rua General Polidoro, 60", "Botafogo", -22.9536, -43.1867, 1],
    ["pr-lab-leblon", "Laboratório Lab Leblon", ["Lab Leblon"], "laboratorio", ["Análises clínicas", "Imagem"], "Rua General Artigas, 300", "Leblon", -22.9822, -43.2219, 2],
    ["pr-lab-copa", "Laboratório Diagnóstico Copacabana", ["Diagnostico Copacabana"], "laboratorio", ["Análises clínicas"], "Rua Siqueira Campos, 43", "Copacabana", -22.9665, -43.1866, 1],
    ["pr-lab-barra", "Laboratório Barra Imagem", ["Barra Imagem"], "laboratorio", ["Imagem", "Ressonância", "Tomografia"], "Av. das Américas, 7700", "Barra da Tijuca", -23.0004, -43.3712, 1],
    ["pr-lab-tijuca", "Laboratório Tijuca Análises", ["Tijuca Analises"], "laboratorio", ["Análises clínicas"], "Rua Conde de Bonfim, 255", "Tijuca", -22.9235, -43.2296, 1],
    ["pr-lab-botafogo", "Laboratório Botafogo Imagem", ["Botafogo Imagem"], "laboratorio", ["Imagem", "Ressonância"], "Rua Voluntários da Pátria, 445", "Botafogo", -22.9554, -43.1953, 2],
    ["pr-lab-niteroi", "Laboratório Niterói Diagnósticos", ["Niteroi Diagnosticos"], "laboratorio", ["Análises clínicas", "Imagem"], "Rua Gavião Peixoto, 182", "Icaraí", -22.9031, -43.1146, 1, "Niterói"],
    ["pr-cli-orto", "Clínica Ortopédica Ipanema", ["Orto Ipanema"], "clinica", ["Ortopedia", "Fisioterapia"], "Rua Visconde de Pirajá, 351", "Ipanema", -22.9845, -43.2018, 2],
    ["pr-cli-cardio", "Clínica Cardio Flamengo", ["Cardio Flamengo"], "clinica", ["Cardiologia"], "Rua Senador Vergueiro, 100", "Flamengo", -22.9343, -43.1782, 2],
    ["pr-cli-pedi", "Clínica Pediátrica Gávea", ["Pediatrica Gavea"], "clinica", ["Pediatria", "Alergologia"], "Rua Marquês de São Vicente, 52", "Gávea", -22.9774, -43.2262, 2],
    ["pr-cli-oftalmo", "Clínica Oftalmológica Barra", ["Oftalmo Barra"], "clinica", ["Oftalmologia"], "Av. Armando Lombardi, 800", "Barra da Tijuca", -23.0065, -43.3089, 1],
    ["pr-cli-onco", "Centro Oncológico Humaitá", ["Onco Humaita"], "clinica", ["Oncologia", "Quimioterapia"], "Rua Humaitá, 240", "Humaitá", -22.9572, -43.1994, 3],
    ["pr-ps-infantil", "Pronto-Socorro Infantil Botafogo", ["PS Infantil Botafogo"], "pronto-socorro", ["Pediatria", "Emergência pediátrica"], "Rua São Clemente, 280", "Botafogo", -22.9518, -43.1912, 2],
  ];
  const providerLevel: Record<string, number> = {};
  const providers: Provider[] = defs.map(([id, name, aliases, type, specialties, address, district, lat, lng, level, city]) => {
    providerLevel[id] = level;
    return { id, name, aliases, type, specialties, address, district, city: city ?? "Rio de Janeiro", lat, lng, demo: D };
  });
  const exclusions: Record<string, string[]> = {
    "ins-amil": ["pr-saoconrado", "pr-lab-leblon", "pr-cli-onco"],
    "ins-sulamerica-saude": ["pr-barra", "pr-mat-botafogo"],
    "ins-bradesco-saude": ["pr-tijuca"],
    "ins-assim": ["pr-icarai", "pr-lab-niteroi"],
  };
  const servicesFor = (t: ProviderType): NetworkService[] =>
    t === "hospital" ? ["internacao", "pronto-socorro", "exames"] : t === "maternidade" ? ["internacao", "maternidade"] : t === "laboratorio" ? ["exames"] : t === "pronto-socorro" ? ["pronto-socorro"] : ["consultas", "exames"];
  const planProviders: PlanProviderLink[] = [];
  for (const plan of healthPlans) {
    for (const pv of providers) {
      const lvl = providerLevel[pv.id];
      if (plan.tier < lvl) continue;
      if (exclusions[plan.insurerId]?.includes(pv.id)) continue;
      // planos Essencial (tier 1) não cobrem hospitais premium nem via exceção
      const services = servicesFor(pv.type).filter((s) => !(s === "internacao" && plan.accommodation === "enfermaria" && pv.type === "maternidade" && plan.tier < 2));
      planProviders.push({ planId: plan.id, providerId: pv.id, services, sourceId: plan.networkSourceId });
    }
  }

  // ───────── Apólices
  const PO = (id: string, holder: PartyRef, insurerId: string, line: Policy["line"], productName: string, endOffset: number, annualPremium: number, commissionPct: number, ownerId: string, extra: Partial<Policy> = {}): Policy => {
    const end = addDays(today, endOffset);
    return {
      id, number: `${insurerId.slice(4, 7).toUpperCase()}-${line.slice(0, 2).toUpperCase()}-${String(Math.floor(100000 + r() * 899999))}`, holder, insurerId, line, productName,
      start: addDays(end, -365), end, annualPremium, commissionPct, ownerId, status: endOffset < 0 ? "vencida" : "vigente",
      dataSource: { kind: "demo", at: ts(-400) }, demo: D, ...extra,
    };
  };
  const hpPrice = (planId: string, personIds: string[]) => {
    const plan = healthPlans.find((p) => p.id === planId)!;
    const ages = personIds.map((pid) => ageOn(persons.find((p) => p.id === pid)!.birthDate, today));
    return Math.round(planMonthlyPrice(plan, ages) * 12 * 100) / 100;
  };
  const silva = ["p-joao", "p-maria", "p-pedro", "p-anasilva"];
  const policies: Policy[] = [
    PO("pol-joao-saude", person("p-joao"), "ins-bradesco-saude", "saude", "Bradesco Demo Prime", 48, hpPrice("hp-vit-prime", silva), 0.04, "u-juliana", { beneficiaryIds: silva, healthPlanId: "hp-vit-prime" }),
    PO("pol-joao-auto", person("p-joao"), "ins-porto", "auto", "Auto Individual", 7, 9840, 0.18, "u-juliana", { insuredAssetId: "v-joao", deductible: 19800 }),
    PO("pol-joao-resid", person("p-joao"), "ins-tokio", "residencial", "Residencial Completo", 122, 1890, 0.25, "u-juliana", { insuredAssetId: "im-silva" }),
    PO("pol-maria-auto", person("p-maria"), "ins-tokio", "auto", "Auto Individual", 204, 4320, 0.15, "u-juliana", { insuredAssetId: "v-maria", deductible: 7600 }),
    PO("pol-abc-emp", company("c-abc"), "ins-allianz", "empresarial", "Empresarial Comércio", 19, 14600, 0.22, "u-juliana"),
    PO("pol-abc-saude", company("c-abc"), "ins-bradesco-saude", "saude", "Bradesco Demo Empresa (34 vidas)", 200, 34 * 395 * 1.9 * 12, 0.03, "u-juliana", { healthPlanId: "hp-vit-pme" }),
    PO("pol-roberto-saude", person("p-roberto"), "ins-sulamerica-saude", "saude", "SulAmérica Demo Executivo", 25, hpPrice("hp-amp-exec", ["p-roberto", "p-helena"]), 0.04, "u-rafael", { beneficiaryIds: ["p-roberto", "p-helena"], healthPlanId: "hp-amp-exec" }),
    PO("pol-roberto-auto", person("p-roberto"), "ins-tokio", "auto", "Auto Individual", 150, 4980, 0.15, "u-rafael", { insuredAssetId: "v-roberto", deductible: 8100 }),
    PO("pol-roberto-resid", person("p-roberto"), "ins-hdi", "residencial", "Residencial Casa", 29, 2240, 0.25, "u-rafael", { insuredAssetId: "im-oliveira" }),
    PO("pol-paulo-auto", person("p-paulo"), "ins-bradesco", "auto", "Auto Individual", 13, 5120, 0.16, "u-rafael", { insuredAssetId: "v-paulo", deductible: 7400 }),
    PO("pol-luciana-auto", person("p-luciana"), "ins-hdi", "auto", "Auto Individual", 62, 4650, 0.17, "u-rafael", { insuredAssetId: "v-luciana", deductible: 7900 }),
    PO("pol-paulo-saude", person("p-paulo"), "ins-amil", "saude", "Amil Demo Plus", 210, hpPrice("hp-car-plus", ["p-paulo", "p-luciana", "p-gabriel", "p-beatriz"]), 0.04, "u-rafael", { beneficiaryIds: ["p-paulo", "p-luciana", "p-gabriel", "p-beatriz"], healthPlanId: "hp-car-plus" }),
    PO("pol-eduardo-nautico", person("p-eduardo"), "ins-mapfre", "nautico", "Náutico Lazer", 90, 21600, 0.2, "u-juliana", { insuredAssetId: "bt-eduardo", dataSource: { kind: "manual", at: ts(-275), by: "u-bianca" } }),
    PO("pol-eduardo-auto", person("p-eduardo"), "ins-allianz", "auto", "Auto Prestige", 33, 11900, 0.2, "u-juliana", { insuredAssetId: "v-eduardo", deductible: 17200 }),
    PO("pol-eduardo-saude", person("p-eduardo"), "ins-bradesco-saude", "saude", "Bradesco Demo Black", 300, hpPrice("hp-vit-black", ["p-eduardo", "p-patricia"]), 0.04, "u-juliana", { beneficiaryIds: ["p-eduardo", "p-patricia"], healthPlanId: "hp-vit-black" }),
    PO("pol-eduardo-vida", person("p-eduardo"), "ins-bradesco", "vida", "Vida Individual Plus", 170, 7800, 0.3, "u-juliana", { capitalInsured: 2000000 }),
    PO("pol-nogeng-emp", company("c-nogeng"), "ins-porto", "empresarial", "Empresarial Construção", 58, 38900, 0.2, "u-juliana"),
    PO("pol-nogeng-rc", company("c-nogeng"), "ins-allianz", "rc", "RC Obras", 140, 26400, 0.2, "u-juliana"),
    PO("pol-nogeng-garantia", company("c-nogeng"), "ins-junto", "garantia", "Garantia Executante", 40, 18200, 0.25, "u-juliana"),
    PO("pol-nogeng-vida", company("c-nogeng"), "ins-porto", "vida", "Vida em Grupo (120 vidas)", 260, 31200, 0.25, "u-juliana", { capitalInsured: 50000 }),
    PO("pol-nogeng-auto", company("c-nogeng"), "ins-allianz", "auto", "Auto Frota", 95, 9600, 0.15, "u-juliana", { insuredAssetId: "v-nogeng" }),
    PO("pol-larissa-resid", person("p-larissa"), "ins-tokio", "residencial", "Residencial Apartamento", 15, 980, 0.25, "u-juliana", { insuredAssetId: "im-larissa" }),
    PO("pol-larissa-saude", person("p-larissa"), "ins-amil", "saude", "Amil Demo Flex", 190, hpPrice("hp-car-flex", ["p-larissa"]), 0.04, "u-juliana", { beneficiaryIds: ["p-larissa"], healthPlanId: "hp-car-flex" }),
    PO("pol-andre-rc", person("p-andre"), "ins-allianz", "rc", "RC Profissional Médico", 75, 3900, 0.22, "u-rafael"),
    PO("pol-andre-auto", person("p-andre"), "ins-tokio", "auto", "Auto Individual", 100, 6200, 0.15, "u-rafael", { insuredAssetId: "v-andre", deductible: 9800 }),
    PO("pol-gustavo-auto", person("p-gustavo"), "ins-hdi", "auto", "Auto Individual", 9, 4380, 0.17, "u-rafael", { insuredAssetId: "v-gustavo", deductible: 6100 }),
    PO("pol-gustavo-resid", person("p-gustavo"), "ins-porto", "residencial", "Residencial Casa", -3, 1740, 0.25, "u-rafael", { insuredAssetId: "im-gustavo" }),
    PO("pol-renata-vida", person("p-renata"), "ins-icatu", "vida", "Vida Individual", 220, 1680, 0.3, "u-juliana", { capitalInsured: 500000 }),
    PO("pol-renata-odonto", person("p-renata"), "ins-odontoprev", "odonto", "Odonto DEMO", 18, 720, 0.2, "u-juliana"),
    PO("pol-felipe-auto", person("p-felipe"), "ins-bradesco", "auto", "Auto Aplicativo", 44, 5980, 0.16, "u-rafael", { insuredAssetId: "v-felipe", deductible: 4200 }),
    PO("pol-sergio-saude", person("p-sergio"), "ins-sulamerica-saude", "saude", "SulAmérica Demo Clássico", 88, hpPrice("hp-amp-classico", ["p-sergio"]), 0.04, "u-juliana", { beneficiaryIds: ["p-sergio"], healthPlanId: "hp-amp-classico" }),
    PO("pol-sergio-vida", person("p-sergio"), "ins-tokio", "vida", "Vida Sênior", 31, 4100, 0.3, "u-juliana", { capitalInsured: 300000 }),
    PO("pol-clinica-emp", company("c-clinica"), "ins-hdi", "empresarial", "Empresarial Clínicas", 110, 8700, 0.22, "u-rafael", { insuredAssetId: "im-clinica" }),
    PO("pol-clinica-rc", company("c-clinica"), "ins-allianz", "rc", "RC Estabelecimentos de Saúde", 52, 6400, 0.22, "u-rafael"),
    PO("pol-cafe-emp", company("c-cafe"), "ins-porto", "empresarial", "Empresarial Alimentação", 27, 3200, 0.22, "u-juliana"),
    PO("pol-technova-saude", company("c-technova"), "ins-sulamerica-saude", "saude", "SulAmérica Demo PME (46 vidas)", 70, 46 * 318 * 1.7 * 12, 0.03, "u-rafael", { healthPlanId: "hp-amp-pme" }),
    PO("pol-technova-cyber", company("c-technova"), "ins-allianz", "cyber", "Cyber Protect", 160, 12800, 0.2, "u-rafael"),
    PO("pol-fernanda-auto", person("p-fernanda"), "ins-tokio", "auto", "Auto Individual", 190, 3850, 0.15, "u-juliana", { insuredAssetId: "v-fernanda", deductible: 5600 }),
  ];
  // histórico: apólice anterior renovada (mostra a cadeia de renovação)
  policies.push(PO("pol-joao-auto-2024", person("p-joao"), "ins-porto", "auto", "Auto Individual", -358, 9120, 0.18, "u-juliana", { insuredAssetId: "v-joao", status: "renovada" }));
  policies.find((p) => p.id === "pol-joao-auto")!.renewedFromId = "pol-joao-auto-2024";

  // ───────── Cotações
  const pricesQuote: Quote[] = [];
  const fernandaReq: HealthQuoteRequest = {
    line: "saude", segment: "individual", city: "Rio de Janeiro", addressId: "a-souza", lat: -22.9842, lng: -43.2063,
    beneficiaries: [{ personId: "p-fernanda", name: "Fernanda Souza", age: 38 }, { personId: "p-ricardo", name: "Ricardo Souza", age: 40 }, { personId: "p-lucas", name: "Lucas Souza", age: 8 }],
    desiredProviderIds: ["pr-atlantico", "pr-gavea", "pr-cli-pedi", "pr-lab-leblon"], budgetMonthly: 3200, accommodation: "apartamento", coparticipation: "indiferente", coverage: "estadual",
  };
  const healthResults = (req: HealthQuoteRequest, at: string): QuoteResult[] => {
    const rec = recommend({ healthPlans, providers, planProviders, networkSources, insurers } as unknown as DB, req);
    return rec.evaluations.filter((e) => e.meetsHard).slice(0, 6).map((e) => ({
      id: `qr-${e.plan.id}`, insurerId: e.plan.insurerId, productName: e.plan.name, annualPremium: Math.round(e.monthly * 12 * 100) / 100, monthlyPremium: e.monthly,
      coverages: [], assistance: [], commissionPct: 0.04, healthPlanId: e.plan.id, status: "ok", source: { adapter: "tabela-operadora", method: "importacao", receivedAt: at, reference: e.plan.networkSourceId },
    }));
  };
  pricesQuote.push({ id: "q-fernanda", party: person("p-fernanda"), opportunityId: "o-fernanda", line: "saude", status: "calculado", request: fernandaReq, results: healthResults(fernandaReq, ts(-1, 15)), createdAt: ts(-1, 15), createdBy: "u-juliana", demo: D });

  const robertoReq: HealthQuoteRequest = {
    line: "saude", segment: "adesao", city: "Rio de Janeiro", addressId: "a-oliveira", lat: -23.0108, lng: -43.3302,
    beneficiaries: [{ personId: "p-roberto", name: "Roberto Oliveira", age: 63 }, { personId: "p-helena", name: "Helena Oliveira", age: 60 }],
    desiredProviderIds: ["pr-barra", "pr-lab-barra", "pr-cli-oftalmo"], accommodation: "apartamento", coparticipation: "nao", coverage: "estadual",
  };
  pricesQuote.push({ id: "q-roberto", party: person("p-roberto"), opportunityId: "o-roberto", line: "saude", status: "proposta_gerada", request: robertoReq, results: healthResults(robertoReq, ts(-9, 11)), createdAt: ts(-9, 11), createdBy: "u-rafael", demo: D });

  const vehicles = assets.filter((a) => a.type === "vehicle") as import("@/domain/types").Vehicle[];
  const autoReq = (vehicleId: string, driverAge: number, bonusClass: number, deductible: AutoQuoteRequest["deductible"] = "normal"): AutoQuoteRequest => {
    const v = vehicles.find((x) => x.id === vehicleId)!;
    return { line: "auto", vehicleId, mainDriverId: v.mainDriverId, driverAge, overnightCep: v.overnightCep, usage: v.usage, garage: v.garage, bonusClass, youngDriver: false, deductible, coverages: { casco: "100%", rcfDanosMateriais: 200000, rcfDanosCorporais: 300000, app: 20000, vidros: true, carroReserva: 15 } };
  };
  const autoResults = (req: AutoQuoteRequest, at: string) => {
    const v = vehicles.find((x) => x.id === req.vehicleId)!;
    return DEMO_PROFILES.map((p) => ({ ...demoAutoQuote(p, req, v, `demo-calculator:${p.insurerId}`), source: { adapter: `demo-calculator:${p.insurerId}`, method: (p.manualOnly ? "manual" : "demo") as QuoteResult["source"]["method"], receivedAt: at } }));
  };
  const thiagoReq = autoReq("v-thiago", 29, 0);
  pricesQuote.push({ id: "q-thiago", party: person("p-thiago"), opportunityId: "o-thiago", line: "auto", status: "proposta_gerada", request: thiagoReq, results: autoResults(thiagoReq, ts(-5, 16)), createdAt: ts(-5, 16), createdBy: "u-rafael", demo: D });
  const joaoReq = autoReq("v-joao", 52, 7);
  pricesQuote.push({ id: "q-joao-auto", party: person("p-joao"), opportunityId: "o-joao-auto", line: "auto", status: "calculado", request: joaoReq, results: autoResults(joaoReq, ts(-1, 10)), createdAt: ts(-1, 10), createdBy: "u-juliana", demo: D });
  const abcReq = { line: "empresarial" as const, description: "Renovação empresarial — sede comercial, estoque e RC operações", insuredValue: 4200000, fields: { atividade: "Comércio atacadista", valorRisco: 4200000, lucrosCessantes: true } };
  pricesQuote.push({ id: "q-abc", party: company("c-abc"), opportunityId: "o-abc", line: "empresarial", status: "proposta_gerada", request: abcReq, results: DEMO_PROFILES.filter((p) => p.lines.includes("empresarial")).map((p) => demoGenericQuote(p, abcReq, `demo-calculator:${p.insurerId}`)), createdAt: ts(-4, 14), createdBy: "u-juliana", demo: D });
  const vanReq = { line: "viagem" as const, description: "Viagem à Europa — 15 dias, 1 viajante", insuredValue: 60000, fields: { destino: "Europa", dias: 15, viajantes: 1 } };
  pricesQuote.push({ id: "q-vanessa", party: person("p-vanessa"), opportunityId: "o-vanessa", line: "viagem", status: "calculado", request: vanReq, results: DEMO_PROFILES.filter((p) => p.lines.includes("viagem")).map((p) => demoGenericQuote(p, vanReq, `demo-calculator:${p.insurerId}`)), createdAt: ts(-1, 17), createdBy: "u-rafael", demo: D });

  const cheapest = (q: Quote) => [...q.results].filter((x) => x.status === "ok").sort((a, b) => a.annualPremium - b.annualPremium);

  // ───────── Propostas
  const thiagoOpts = cheapest(pricesQuote[2]).slice(0, 3);
  const abcOpts = cheapest(pricesQuote[4]);
  const robertoOpts = pricesQuote[1].results.slice(0, 3);
  const proposals: Proposal[] = [
    { id: "pr-thiago", code: "PRP-2026-0141", quoteId: "q-thiago", party: person("p-thiago"), line: "auto", optionResultIds: thiagoOpts.map((x) => x.id), recommendedResultId: thiagoOpts[0]?.id, recommendationReason: "Menor prêmio com as mesmas coberturas e assistência 24h.", need: "Primeiro seguro do HB20 2020, uso particular, garagem em casa.", status: "visualizada", validUntil: addDays(today, 10), createdAt: ts(-5, 17), sentAt: ts(-4, 9), viewedAt: ts(-3, 20), ownerId: "u-rafael", demo: D },
    { id: "pr-abc", code: "PRP-2026-0143", quoteId: "q-abc", party: company("c-abc"), line: "empresarial", optionResultIds: abcOpts.map((x) => x.id), recommendedResultId: abcOpts[0]?.id, recommendationReason: "Mantém as coberturas atuais com prêmio inferior ao da apólice vigente.", need: "Renovação do empresarial da sede (estoque, incêndio, RC operações, lucros cessantes).", status: "enviada", validUntil: addDays(today, 12), createdAt: ts(-4, 15), sentAt: ts(-3, 11), ownerId: "u-juliana", demo: D },
    { id: "pr-roberto", code: "PRP-2026-0138", quoteId: "q-roberto", party: person("p-roberto"), line: "saude", optionResultIds: robertoOpts.map((x) => x.id), recommendedResultId: robertoOpts[0]?.id, recommendationReason: "Atende Hospital Barra Central e os laboratórios próximos com acomodação em apartamento.", need: "Renovação/migração do plano de saúde do casal, priorizando rede na Barra.", status: "aceita", acceptedResultId: robertoOpts[0]?.id, validUntil: addDays(today, 5), createdAt: ts(-9, 12), sentAt: ts(-9, 16), viewedAt: ts(-8, 9), decidedAt: ts(-2, 14), ownerId: "u-rafael", demo: D },
    { id: "pr-vanessa", code: "PRP-2026-0145", quoteId: "q-vanessa", party: person("p-vanessa"), line: "viagem", optionResultIds: cheapest(pricesQuote[5]).map((x) => x.id), recommendedResultId: cheapest(pricesQuote[5])[0]?.id, need: "Seguro viagem Europa (Schengen), 15 dias.", status: "rascunho", validUntil: addDays(today, 7), createdAt: ts(-1, 18), ownerId: "u-rafael", demo: D },
  ];

  // ───────── Oportunidades (CRM)
  const O = (id: string, title: string, party: PartyRef, line: Opportunity["line"], stage: PipelineStage, ownerId: string, estimatedPremium: number, createdOffset: number, extra: Partial<Opportunity> = {}): Opportunity => {
    const createdAt = ts(createdOffset, 9);
    return { id, title, party, line, stage, ownerId, estimatedPremium, origin: "manual", createdAt, updatedAt: ts(Math.min(0, createdOffset + 2), 15), stageHistory: [{ stage: "lead", at: createdAt, by: ownerId }, ...(stage !== "lead" ? [{ stage, at: ts(Math.min(0, createdOffset + 2), 15), by: ownerId }] : [])], demo: D, ...extra };
  };
  const opportunities: Opportunity[] = [
    O("o-camila", "Saúde família Pereira (4 vidas)", person("p-camila"), "saude", "levantamento", "u-juliana", 26000, -6, { origin: "indicacao" }),
    O("o-fernanda", "Saúde família Souza", person("p-fernanda"), "saude", "cotacao", "u-juliana", 32000, -8, { quoteId: "q-fernanda", origin: "site" }),
    O("o-thiago", "Auto HB20 2020", person("p-thiago"), "auto", "proposta", "u-rafael", 2400, -12, { quoteId: "q-thiago", proposalId: "pr-thiago", origin: "site" }),
    O("o-abc", "Renovação Empresarial ABC", company("c-abc"), "empresarial", "proposta", "u-juliana", 14600, -15, { quoteId: "q-abc", proposalId: "pr-abc", origin: "renovacao", renewalOfPolicyId: "pol-abc-emp" }),
    O("o-roberto", "Renovação Saúde Oliveira", person("p-roberto"), "saude", "emissao", "u-rafael", 0, -20, { quoteId: "q-roberto", proposalId: "pr-roberto", origin: "renovacao", renewalOfPolicyId: "pol-roberto-saude" }),
    O("o-joao-auto", "Renovação Auto BMW X3", person("p-joao"), "auto", "cotacao", "u-juliana", 9840, -50, { quoteId: "q-joao-auto", origin: "renovacao", renewalOfPolicyId: "pol-joao-auto" }),
    O("o-vanessa", "Viagem Europa", person("p-vanessa"), "viagem", "cotacao", "u-rafael", 520, -3, { quoteId: "q-vanessa", proposalId: "pr-vanessa", origin: "site" }),
    O("o-mariana", "Seguro de vida", person("p-mariana"), "vida", "lead", "u-juliana", 1200, 0, { origin: "site" }),
    O("o-technova-vida", "Vida em grupo TechNova", company("c-technova"), "vida", "levantamento", "u-rafael", 14000, -10),
    O("o-clinica-saude", "Saúde PME Clínica Vida Plena", company("c-clinica"), "saude", "negociacao", "u-rafael", 61000, -25),
    O("o-paulo-resid", "Residencial apto Tijuca", person("p-paulo"), "residencial", "lead", "u-rafael", 900, -2, { origin: "cross-sell" }),
    O("o-cafe-frota", "Auto frota Café Aurora", company("c-cafe"), "auto", "perdido", "u-juliana", 7800, -40, { lostReason: "Preço — cliente fechou com concessionária" }),
    O("o-sergio-vida-old", "Vida Sênior", person("p-sergio"), "vida", "emitido", "u-juliana", 4100, -330),
    O("o-andre-vida", "Vida + invalidez (médico)", person("p-andre"), "vida", "contato", "u-rafael", 3600, -7, { origin: "cross-sell" }),
  ];

  // ───────── Tarefas (manuais; as automáticas são criadas pelo motor de automações abaixo)
  const T = (id: string, title: string, category: Task["category"], dueOffset: number, ownerId: string, extra: Partial<Task> = {}): Task =>
    ({ id, title, category, due: addDays(today, dueOffset), ownerId, status: "aberta", origin: "manual", createdAt: ts(Math.min(dueOffset, 0) - 2, 9), demo: D, ...extra });
  const tasks: Task[] = [
    T("t-fernanda-docs", "Solicitar RG/CPF do Lucas e comprovante de residência", "documento", 0, "u-juliana", { party: person("p-fernanda"), related: { type: "opportunity", id: "o-fernanda" }, waitingOn: "cliente", waitingSince: addDays(today, -2), value: 32000 }),
    T("t-roberto-emissao", "Acompanhar emissão SulAmérica Demo Executivo (proposta aceita)", "emissao", 1, "u-bianca", { party: person("p-roberto"), related: { type: "proposal", id: "pr-roberto" }, waitingOn: "seguradora", waitingSince: addDays(today, -1), value: 30000 }),
    T("t-camila-levantamento", "Levantar hospitais de preferência, pediatra e orçamento", "cotacao", 1, "u-juliana", { party: person("p-camila"), related: { type: "opportunity", id: "o-camila" }, value: 26000 }),
    T("t-clinica-tabela", "Enviar tabela PME negociada com a Bradesco Saúde", "pendencia", 2, "u-rafael", { party: company("c-clinica"), related: { type: "opportunity", id: "o-clinica-saude" }, value: 61000 }),
    T("t-gustavo-vencida", "Residencial venceu há 3 dias — contato urgente com cliente", "renovacao", -1, "u-rafael", { party: person("p-gustavo"), related: { type: "policy", id: "pol-gustavo-resid" }, value: 1740 }),
    T("t-mariana-contato", "Primeiro contato com lead (site) — seguro de vida", "follow_up", 0, "u-juliana", { party: person("p-mariana"), related: { type: "opportunity", id: "o-mariana" }, value: 1200 }),
    T("t-vanessa-datas", "Confirmar datas da viagem para fechar cotação", "cotacao", 4, "u-rafael", { party: person("p-vanessa"), related: { type: "opportunity", id: "o-vanessa" }, waitingOn: "cliente", waitingSince: addDays(today, -1), value: 520 }),
    T("t-financeiro-horizonte", "Conciliar comissões divergentes da Tokio Marine", "pendencia", 2, "u-ana", { value: 0 }),
    T("t-felipe-cnh", "Atualizar CNH e confirmar uso (aplicativo) para renovação", "documento", -2, "u-rafael", { party: person("p-felipe"), related: { type: "policy", id: "pol-felipe-auto" }, waitingOn: "cliente", waitingSince: addDays(today, -6), value: 5980 }),
    T("t-andre-vida", "Apresentar proposta de vida com invalidez profissional", "cross_sell", 3, "u-rafael", { party: person("p-andre"), related: { type: "opportunity", id: "o-andre-vida" }, value: 3600 }),
    T("t-joao-auto-cotacao", "Revisar multicálculo da renovação do BMW X3 e enviar proposta", "renovacao", 0, "u-juliana", { party: person("p-joao"), related: { type: "quote", id: "q-joao-auto" }, value: 9840 }),
    T("t-done-1", "Enviar boleto 1ª parcela", "pendencia", -5, "u-bianca", { party: person("p-sergio"), status: "concluida", completedAt: ts(-5, 11) }),
    T("t-done-2", "Cadastrar beneficiários do plano ABC", "documento", -8, "u-bianca", { party: company("c-abc"), status: "concluida", completedAt: ts(-8, 16) }),
  ];

  // ───────── Interações
  const IN = (id: string, party: PartyRef, dayOffset: number, channel: Interaction["channel"], direction: Interaction["direction"], summary: string, userId?: string, hour = 11): Interaction =>
    ({ id, party, at: ts(dayOffset, hour), channel, direction, summary, userId, demo: D });
  const interactions: Interaction[] = [
    IN("i-1", person("p-joao"), -1, "sistema", "interno", "Multicálculo da renovação do Auto executado (6 seguradoras consultadas).", "u-juliana", 10),
    IN("i-2", person("p-joao"), -50, "sistema", "interno", "Renovação do Auto BMW X3 identificada automaticamente (vence em 57 dias)."),
    IN("i-3", person("p-joao"), -30, "whatsapp", "saida", "Pergunta se houve mudanças: endereço, condutores e uso do veículo.", "u-juliana", 14),
    IN("i-4", person("p-joao"), -29, "whatsapp", "entrada", "Cliente confirma: sem mudanças. Pedro (19) passou a dirigir eventualmente.", undefined, 9),
    IN("i-5", person("p-fernanda"), -8, "email", "entrada", "Pediu cotação de saúde para a família pelo site.", undefined, 22),
    IN("i-6", person("p-fernanda"), -7, "telefone", "saida", "Levantamento: quer Atlântico D'Or, Gávea Jardim e a pediatra da Clínica Pediátrica Gávea. Orçamento até R$ 3.200.", "u-juliana", 15),
    IN("i-7", person("p-fernanda"), -2, "whatsapp", "saida", "Solicitados documentos do Lucas e comprovante de residência.", "u-juliana", 10),
    IN("i-8", person("p-thiago"), -4, "whatsapp", "saida", "Proposta PRP-2026-0141 enviada (3 opções).", "u-rafael", 9),
    IN("i-9", person("p-thiago"), -3, "sistema", "interno", "Proposta visualizada pelo cliente.", undefined, 20),
    IN("i-10", company("c-abc"), -3, "email", "saida", "Proposta de renovação empresarial enviada ao financeiro.", "u-juliana", 11),
    IN("i-11", person("p-roberto"), -2, "whatsapp", "entrada", "Cliente aceitou a opção recomendada.", undefined, 14),
    IN("i-12", person("p-roberto"), -1, "sistema", "interno", "Proposta transmitida à operadora — aguardando emissão.", "u-bianca", 9),
    IN("i-13", person("p-camila"), -6, "telefone", "entrada", "Indicada pela Fernanda. Quer plano para a família (bebê de 4 meses).", undefined, 16),
    IN("i-14", person("p-gustavo"), -10, "whatsapp", "saida", "Lembrete de renovação do residencial enviado.", "u-rafael", 10),
    IN("i-15", person("p-gustavo"), -4, "telefone", "saida", "Sem resposta. Deixado recado.", "u-rafael", 17),
    IN("i-16", company("c-clinica"), -5, "reuniao", "saida", "Reunião com sócios: comparação Bradesco Demo Empresa × SulAmérica Demo PME para 18 vidas.", "u-rafael", 15),
    IN("i-17", person("p-eduardo"), -20, "email", "entrada", "Enviou apólice do náutico renovada (Mapfre) — cadastrada manualmente.", undefined, 12),
    IN("i-18", person("p-larissa"), -1, "sistema", "interno", "Lembrete de renovação (15 dias) gerado."),
    IN("i-19", person("p-mariana"), 0, "email", "entrada", "Lead do site: interesse em seguro de vida.", undefined, 8),
    IN("i-20", person("p-sergio"), -5, "whatsapp", "saida", "Boleto da 1ª parcela enviado.", "u-bianca", 11),
  ];

  // ───────── Documentos
  const documents: DocumentRecord[] = [];
  let dn = 0;
  for (const pol of policies) {
    documents.push({ id: `d-${pol.id}`, name: `Apólice ${pol.number}.pdf`, kind: "apolice", party: pol.holder, policyId: pol.id, sizeKb: 180 + Math.round(r() * 600), mime: "application/pdf", uploadedAt: `${pol.start}T12:00:00.000-03:00`, uploadedBy: "u-bianca", channel: dn++ % 3 === 0 ? "email" : "upload", status: "arquivado", demo: D });
    if (pol.line === "saude" && pol.beneficiaryIds) documents.push({ id: `d-cart-${pol.id}`, name: `Carteirinhas ${pol.productName}.pdf`, kind: "carteirinha", party: pol.holder, policyId: pol.id, sizeKb: 90, mime: "application/pdf", uploadedAt: `${addDays(pol.start, 5)}T12:00:00.000-03:00`, uploadedBy: "u-bianca", channel: "email", status: "arquivado", demo: D });
  }
  for (const v of vehicles) documents.push({ id: `d-crlv-${v.id}`, name: `CRLV ${v.plate}.pdf`, kind: "crlv", party: v.owner, sizeKb: 120, mime: "application/pdf", uploadedAt: ts(-200), uploadedBy: "u-bianca", channel: "whatsapp", status: "arquivado", demo: D });
  documents.push(
    { id: "d-rg-fernanda", name: "RG Fernanda Souza.jpg", kind: "documento_pessoal", party: person("p-fernanda"), sizeKb: 640, mime: "image/jpeg", uploadedAt: ts(-7, 16), uploadedBy: "u-juliana", channel: "whatsapp", status: "arquivado", demo: D },
    {
      id: "d-inbox-felipe", name: "apolice_auto_aurora_felipe.txt", kind: "apolice", party: person("p-felipe"), sizeKb: 4, mime: "text/plain", uploadedAt: ts(0, 8, 12), uploadedBy: "u-bianca", channel: "email", status: "aguardando_revisao",
      textContent: fillSample(SAMPLE_DOCS[1].text(today), persons),
      extraction: { parser: "demo-regex-extractor@1", at: ts(0, 8, 13), fields: [
        { key: "insurer", label: "Seguradora", value: "Bradesco Seguros", confidence: 0.92 },
        { key: "line", label: "Ramo", value: "auto", confidence: 0.8 },
        { key: "policyNumber", label: "Nº da apólice", value: "BRA-AU-778120", confidence: 0.93 },
        { key: "cpf", label: "CPF", value: persons.find((p) => p.id === "p-felipe")!.cpf, confidence: 0.97 },
        { key: "insuredName", label: "Segurado", value: "Felipe Araújo", confidence: 0.75 },
        { key: "start", label: "Início de vigência", value: addDays(today, 44), confidence: 0.9 },
        { key: "end", label: "Fim de vigência", value: addDays(today, 409), confidence: 0.9 },
        { key: "premium", label: "Prêmio anual", value: "6240.00", confidence: 0.88 },
        { key: "plate", label: "Placa", value: "FEL6I23", confidence: 0.9 },
        { key: "commissionPct", label: "Comissão (%)", value: "16", confidence: 0.7 },
      ] },
      demo: D,
    },
  );

  // ───────── Comissões
  const commissions: Commission[] = [];
  const curMonth = today.slice(0, 7);
  for (const pol of policies.filter((p) => p.status !== "renovada")) {
    const monthly = Math.round(((pol.annualPremium * pol.commissionPct) / 12) * 100) / 100;
    for (let k = -5; k <= 2; k++) {
      const comp = addMonths(`${curMonth}-01`, k).slice(0, 7);
      if (comp < pol.start.slice(0, 7) || comp > pol.end.slice(0, 7)) continue;
      const roll = r();
      let c: Commission = { id: `cm-${pol.id}-${comp}`, policyId: pol.id, competence: comp, expected: monthly, status: "prevista", demo: D };
      if (k < 0 || (k === 0 && roll < 0.55)) {
        if (roll < 0.06 && k < -1) c = { ...c, status: "atrasada" };
        else if (roll < 0.14 || (pol.insurerId === "ins-tokio" && k === -1)) c = { ...c, status: "divergente", received: Math.round(monthly * 0.82 * 100) / 100, receivedAt: `${addMonths(comp + "-01", 1).slice(0, 7)}-10` };
        else c = { ...c, status: "recebida", received: monthly, receivedAt: k === 0 ? addDays(today, -Math.round(r() * 5)) : `${addMonths(comp + "-01", 1).slice(0, 7)}-10` };
      }
      commissions.push(c);
    }
  }

  const audit: AuditLog[] = [
    { id: "au-1", at: ts(-20, 12), userId: "u-bianca", entity: "Policy", entityId: "pol-eduardo-nautico", action: "create", summary: "Apólice náutico cadastrada manualmente a partir de e-mail do cliente", source: "ui" },
    { id: "au-2", at: ts(-2, 14), userId: "u-rafael", entity: "Proposal", entityId: "pr-roberto", action: "update", summary: "Proposta marcada como aceita", changes: [{ field: "status", before: "visualizada", after: "aceita" }], source: "ui" },
    { id: "au-3", at: ts(-1, 9), userId: "u-carlos", entity: "Person", entityId: "p-joao", action: "view_sensitive", summary: "Visualização de CPF completo", source: "ui" },
    { id: "au-4", at: ts(-7, 15), userId: "u-juliana", entity: "Person", entityId: "p-fernanda", action: "update", summary: "Telefone atualizado", changes: [{ field: "phone", before: "5521997650000", after: "5521997654321" }], source: "ui" },
  ];

  let db: DB = {
    version: SEED_VERSION, users, persons, companies, households, companyRelationships, addresses, assets, insurers, healthPlans, providers, planProviders, networkSources,
    opportunities, quotes: pricesQuote, proposals, policies, renewals: [], documents, tasks, interactions, commissions, audit,
    automations: NATIVE_AUTOMATIONS, automationRuns: [],
    settings: { restrictWalletToOwner: true, followUpDays: 3, renewalWindows: [90, 60, 30, 15, 7], rolePermissions: DEFAULT_ROLE_PERMISSIONS },
  };

  // Histórico de execuções (últimos 30 dias) para a métrica de horas economizadas
  const hist: [string, string, number][] = [
    ["auto-doc-received", "Documento classificado e vinculado ao cliente", 6],
    ["auto-proposal-followup", "Follow-up criado para proposta sem resposta", 4],
    ["auto-days-to-end", "Renovação iniciada com dados da apólice anterior", 25],
    ["auto-policy-issued", "Apólice emitida: dados extraídos, renovação e comissões programadas", 18],
    ["auto-client-created", "Cliente novo analisado para cross-sell", 5],
  ];
  for (let k = 0; k < 64; k++) {
    const h = hist[Math.floor(r() * hist.length)];
    db.automationRuns.push({ id: `run-h-${k}`, automationId: h[0], at: ts(-1 - Math.floor(r() * 29), 8 + Math.floor(r() * 10), Math.floor(r() * 59)), summary: h[1], refs: [], minutesSaved: h[2] });
  }

  // Executa as automações nativas sobre a carteira (cria renovações, tarefas e follow-ups)
  db = runAutomations(db, today).db;

  // Ajusta status de renovações já em andamento na história da DEMO
  const setRen = (policyId: string, status: import("@/domain/types").Renewal["status"], opp?: string) => {
    const ren = db.renewals.find((x) => x.policyId === policyId);
    if (ren) { ren.status = status; if (opp) ren.opportunityId = opp; ren.checklist.forEach((c, i) => (c.done = status !== "identificada" && i < (status === "coletando_dados" ? 1 : status === "cotando" ? 3 : 4))); }
  };
  setRen("pol-joao-auto", "cotando", "o-joao-auto");
  setRen("pol-abc-emp", "proposta_enviada", "o-abc");
  setRen("pol-roberto-saude", "proposta_enviada", "o-roberto");
  setRen("pol-felipe-auto", "coletando_dados");
  setRen("pol-gustavo-resid", "coletando_dados");
  // remove oportunidades de renovação duplicadas que o motor criou para renovações já cobertas por oportunidades manuais
  const covered = new Set(opportunities.filter((o) => o.renewalOfPolicyId).map((o) => o.renewalOfPolicyId));
  db.opportunities = db.opportunities.filter((o) => !(o.origin === "renovacao" && o.id.startsWith("o-ren-") && covered.has(o.renewalOfPolicyId)));
  db.renewals.forEach((ren) => {
    if (ren.opportunityId && !db.opportunities.some((o) => o.id === ren.opportunityId)) ren.opportunityId = opportunities.find((o) => o.renewalOfPolicyId === ren.policyId)?.id;
  });
  return db;
}

/** Documentos de exemplo para testar o Document AI (texto puro, 100% fictícios). */
export const SAMPLE_DOCS: { id: string; title: string; fileName: string; text: (today: string) => string }[] = [
  {
    id: "sample-resid",
    title: "Apólice residencial renovada (Larissa Campos)",
    fileName: "apolice_residencial_horizonte_larissa.txt",
    text: (today) => {
      const s = addDays(today, 15).split("-").reverse().join("/");
      const e = addDays(today, 380).split("-").reverse().join("/");
      return `TOKIO MARINE — DOCUMENTO DEMO (FICTÍCIO)
APÓLICE DE SEGURO RESIDENCIAL
Apólice nº TOK-RE-552901
Segurado: Larissa Campos
CPF: {{CPF:p-larissa}}
Local de risco: Rua Marquês de Abrantes, 88 apto 901 — Flamengo — Rio de Janeiro/RJ
Vigência: de ${s} a ${e}
Coberturas: Incêndio/raio/explosão R$ 600.000,00; Danos elétricos R$ 20.000,00; Roubo R$ 30.000,00
Franquia: R$ 500,00
Prêmio total: R$ 1.036,00
Comissão: 25%`;
    },
  },
  {
    id: "sample-auto-felipe",
    title: "Apólice auto renovada (Felipe Araújo)",
    fileName: "apolice_auto_aurora_felipe.txt",
    text: (today) => {
      const s = addDays(today, 44).split("-").reverse().join("/");
      const e = addDays(today, 409).split("-").reverse().join("/");
      return `BRADESCO SEGUROS — DOCUMENTO DEMO (FICTÍCIO)
Seguro de Automóvel — Apólice nº BRA-AU-778120
Segurado: Felipe Araújo
CPF: {{CPF:p-felipe}}
Veículo: Chevrolet Onix LT 1.0 Turbo 2023 — Placa: FEL6I23 — Uso: aplicativo
Vigência: ${s} a ${e}
Franquia: R$ 4.350,00
Prêmio total: R$ 6.240,00
Comissão: 16%`;
    },
  },
  {
    id: "sample-new",
    title: "Apólice vida — cliente novo (Mariana Teixeira)",
    fileName: "apolice_vida_aurora_mariana.txt",
    text: (today) => {
      const s = today.split("-").reverse().join("/");
      const e = addDays(today, 365).split("-").reverse().join("/");
      return `BRADESCO SEGUROS — DOCUMENTO DEMO (FICTÍCIO)
Seguro de Vida Individual
Apólice nº BRA-VI-430017
Segurado: Mariana Teixeira
CPF: {{CPF:p-mariana}}
Capital segurado: R$ 400.000,00
Vigência: ${s} a ${e}
Prêmio anual: R$ 1.180,00
Comissão: 30%`;
    },
  },
  {
    id: "sample-boleto",
    title: "Boleto (João Silva)",
    fileName: "boleto_vitalis_joao.txt",
    text: (today) => `BRADESCO SAÚDE — DOCUMENTO DEMO (FICTÍCIO)
Boleto bancário — mensalidade plano Bradesco Demo Prime
Cliente: João Silva
CPF: {{CPF:p-joao}}
Vencimento: ${addDays(today, 10).split("-").reverse().join("/")}
Valor do documento: R$ 6.418,22
Linha digitável: 00190.00009 01234.567890 12345.678901 1 00000000000000`,
  },
];

/** Substitui marcadores {{CPF:id}} dos documentos de exemplo pelo CPF fictício da pessoa. */
export function fillSample(text: string, persons: { id: string; cpf: string }[]) {
  return text.replace(/\{\{CPF:([\w-]+)\}\}/g, (_, id) => persons.find((p) => p.id === id)?.cpf ?? "000.000.000-00");
}
