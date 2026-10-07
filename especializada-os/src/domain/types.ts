/**
 * Modelo de domínio do Especializada Seguros OS.
 *
 * CORE (pessoas, famílias, empresas, ativos, CRM, apólices, documentos, tarefas…)
 * + MÓDULOS por ramo (saúde, auto, …) que estendem o core via `ProductLine` e
 * payloads específicos (`HealthQuoteRequest`, `AutoQuoteRequest`, …).
 *
 * Espelha prisma/schema.prisma (fonte da verdade da persistência real).
 * Toda entidade da DEMO carrega `demo: true` para nunca ser confundida com dado real.
 */

export type ID = string;
export type ISODate = string; // "2026-10-07"
export type ISODateTime = string;

// ───────────────────────────── Acesso ─────────────────────────────
export type RoleKey = "admin" | "gestor" | "corretor" | "operacional" | "financeiro";

export type Permission =
  | "dashboard.view"
  | "clients.view" | "clients.edit"
  | "wallet.all" // ver carteira de todos (senão, só a própria quando a restrição está ativa)
  | "crm.view" | "crm.edit"
  | "quotes.view" | "quotes.edit"
  | "proposals.view" | "proposals.edit"
  | "policies.view" | "policies.edit"
  | "network.view" | "network.import"
  | "documents.view" | "documents.edit"
  | "tasks.view"
  | "commissions.view"
  | "reports.view"
  | "ai.use"
  | "import.run"
  | "automations.manage"
  | "settings.manage"
  | "audit.view";

export interface User {
  id: ID;
  name: string;
  email: string;
  role: RoleKey;
  demo: true;
}

// ───────────────────────────── Partes ─────────────────────────────
export type PartyType = "person" | "company";
export interface PartyRef { type: PartyType; id: ID }

export type ClientStatus = "lead" | "ativo" | "inativo";

export interface Address {
  id: ID;
  label: string; // "Residencial", "Sede"…
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  cep: string;
  lat: number;
  lng: number;
}

export interface Person {
  id: ID;
  name: string;
  cpf: string;
  birthDate: ISODate;
  gender?: "F" | "M";
  phone?: string;
  whatsapp?: string;
  email?: string;
  addressId?: ID;
  profession?: string;
  ownerId?: ID; // corretor responsável
  clientStatus: ClientStatus | null; // null = apenas relacionado (dependente, sócio…)
  clientSince?: ISODate;
  source?: string;
  notes?: string;
  demo: true;
}

export interface Company {
  id: ID;
  legalName: string;
  tradeName: string;
  cnpj: string;
  sector: string;
  employees: number;
  addressId?: ID;
  phone?: string;
  email?: string;
  ownerId?: ID;
  clientStatus: ClientStatus | null;
  clientSince?: ISODate;
  demo: true;
}

export type HouseholdRelation = "titular" | "cônjuge" | "filho(a)" | "pai/mãe" | "outro";
export interface Household {
  id: ID;
  name: string;
  members: { personId: ID; relation: HouseholdRelation }[];
  addressId?: ID;
  demo: true;
}

export type CompanyRole = "sócio" | "administrador" | "funcionário" | "contato";
export interface CompanyRelationship {
  id: ID;
  companyId: ID;
  personId: ID;
  role: CompanyRole;
  share?: number; // % participação
  demo: true;
}

// ───────────────────────────── Ativos ─────────────────────────────
export type AssetType = "vehicle" | "property" | "boat" | "other";
export interface AssetBase { id: ID; owner: PartyRef; type: AssetType; demo: true }
export interface Vehicle extends AssetBase {
  type: "vehicle";
  make: string;
  model: string;
  version: string;
  yearModel: number;
  plate: string;
  fipeCode: string;
  fipeValue: number;
  usage: "particular" | "comercial" | "aplicativo";
  garage: { home: boolean; work: boolean };
  overnightCep: string;
  mainDriverId?: ID;
}
export interface Property extends AssetBase {
  type: "property";
  kind: "apartamento" | "casa" | "comercial";
  addressId: ID;
  areaM2: number;
  value: number;
  use: "habitual" | "veraneio" | "aluguel" | "comercial";
}
export interface Boat extends AssetBase {
  type: "boat";
  name: string;
  lengthFt: number;
  value: number;
  marina: string;
}
export type Asset = Vehicle | Property | Boat;

// ───────────────────────────── Produtos ─────────────────────────────
export type ProductLine =
  | "saude" | "odonto" | "auto" | "vida" | "residencial" | "empresarial" | "viagem"
  | "condominio" | "fianca" | "rc" | "cyber" | "transportes" | "nautico"
  | "aeronautico" | "garantia" | "previdencia" | "equipamentos" | "outros";

export type IntegrationMethod =
  | "api_oficial" | "api_parceiro" | "integracao_autorizada" | "importacao" | "manual";

export interface Insurer {
  id: ID;
  name: string;
  short: string;
  color: string;
  lines: ProductLine[];
  integration: { method: IntegrationMethod; status: "demo" | "nao_configurada" | "ativa" | "erro"; note?: string };
  /** Etapas do onboarding da integração própria (ver INTEGRATION_STEPS) */
  integrationSteps?: Record<string, boolean>;
  /** Cadastrada pela corretora (fora do catálogo inicial) */
  custom?: boolean;
  demo: true;
}

// ── Saúde
export type Accommodation = "enfermaria" | "apartamento";
export type Coverage = "municipal" | "regional" | "estadual" | "nacional";
export type ReimbursementLevel = "nenhum" | "basico" | "intermediario" | "alto" | "premium";
export type PlanSegment = "individual" | "adesao" | "pme" | "empresarial";

/** Faixas etárias ANS (RN 63/2003): 0-18, 19-23, …, 59+ */
export const AGE_BANDS = ["0-18", "19-23", "24-28", "29-33", "34-38", "39-43", "44-48", "49-53", "54-58", "59+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export interface HealthPlan {
  id: ID;
  insurerId: ID;
  name: string;
  tier: 1 | 2 | 3 | 4; // 1 = básico, 4 = premium
  segment: PlanSegment;
  accommodation: Accommodation;
  coparticipation: boolean;
  reimbursement: ReimbursementLevel;
  reimbursementConsultation: number; // R$ por consulta
  coverage: Coverage;
  pricesByBand: Record<AgeBand, number>; // R$/mês por vida
  networkSourceId: ID;
  demo: true;
}

export type ProviderType = "hospital" | "clinica" | "laboratorio" | "maternidade" | "pronto-socorro";
export interface Provider {
  id: ID;
  name: string;
  aliases: string[];
  type: ProviderType;
  specialties: string[];
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  demo: true;
}

export type NetworkService = "internacao" | "pronto-socorro" | "maternidade" | "exames" | "consultas";
export interface PlanProviderLink {
  planId: ID;
  providerId: ID;
  services: NetworkService[];
  sourceId: ID;
}

export interface NetworkDataSource {
  id: ID;
  insurerId: ID;
  kind: "xlsx" | "csv" | "pdf" | "api" | "manual";
  label: string;
  importedAt: ISODate;
  validUntil: ISODate;
  status: "valida" | "expirando" | "expirada";
  confidence: number; // 0..1
  demo: true;
}

// ───────────────────────────── CRM ─────────────────────────────
export const PIPELINE_STAGES = [
  "lead", "contato", "levantamento", "cotacao", "proposta", "negociacao", "aprovado", "emissao", "emitido",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number] | "perdido";

export interface Opportunity {
  id: ID;
  title: string;
  party: PartyRef;
  line: ProductLine;
  stage: PipelineStage;
  ownerId: ID;
  estimatedPremium: number; // anual
  insurerId?: ID;
  origin: "manual" | "renovacao" | "cross-sell" | "indicacao" | "site" | "importacao";
  quoteId?: ID;
  proposalId?: ID;
  renewalOfPolicyId?: ID;
  lostReason?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  stageHistory: { stage: PipelineStage; at: ISODateTime; by: ID }[];
  demo: true;
}

// ───────────────────────────── Cotações ─────────────────────────────
export interface HealthQuoteRequest {
  line: "saude";
  beneficiaries: { personId?: ID; name: string; age: number }[];
  addressId?: ID;
  lat?: number;
  lng?: number;
  city: string;
  desiredProviderIds: ID[];
  budgetMonthly?: number;
  accommodation?: Accommodation;
  coparticipation?: "sim" | "nao" | "indiferente";
  reimbursement?: ReimbursementLevel;
  coverage?: Coverage;
  segment: PlanSegment;
}

export interface AutoQuoteRequest {
  line: "auto";
  vehicleId: ID;
  mainDriverId?: ID;
  driverAge: number;
  overnightCep: string;
  usage: Vehicle["usage"];
  garage: Vehicle["garage"];
  bonusClass: number; // 0..10
  youngDriver: boolean;
  coverages: { casco: "100%" | "110%" | "sem"; rcfDanosMateriais: number; rcfDanosCorporais: number; app: number; vidros: boolean; carroReserva: 0 | 7 | 15 | 30 };
  deductible: "reduzida" | "normal" | "majorada";
}

export interface GenericQuoteRequest {
  line: Exclude<ProductLine, "saude" | "auto">;
  description: string;
  insuredValue?: number;
  fields: Record<string, string | number | boolean>;
}

export type QuoteRequest = HealthQuoteRequest | AutoQuoteRequest | GenericQuoteRequest;

export interface QuoteResult {
  id: ID;
  insurerId: ID;
  productName: string;
  annualPremium: number;
  monthlyPremium?: number;
  deductible?: number;
  coverages: { name: string; limit?: number; included: boolean }[];
  assistance: string[];
  commissionPct: number;
  healthPlanId?: ID;
  status: "ok" | "recusado" | "erro" | "manual_pendente";
  message?: string;
  source: { adapter: string; method: IntegrationMethod | "demo"; receivedAt: ISODateTime; reference?: string };
}

export interface Quote {
  id: ID;
  party: PartyRef;
  opportunityId?: ID;
  line: ProductLine;
  status: "rascunho" | "calculado" | "proposta_gerada";
  request: QuoteRequest;
  results: QuoteResult[];
  createdAt: ISODateTime;
  createdBy: ID;
  demo: true;
}

// ───────────────────────────── Propostas ─────────────────────────────
export type ProposalStatus = "rascunho" | "enviada" | "visualizada" | "aceita" | "recusada" | "expirada";
export interface Proposal {
  id: ID;
  code: string;
  quoteId: ID;
  party: PartyRef;
  line: ProductLine;
  optionResultIds: ID[];
  recommendedResultId?: ID;
  recommendationReason?: string;
  need: string;
  status: ProposalStatus;
  validUntil: ISODate;
  createdAt: ISODateTime;
  sentAt?: ISODateTime;
  viewedAt?: ISODateTime;
  decidedAt?: ISODateTime;
  acceptedResultId?: ID;
  ownerId: ID;
  demo: true;
}

// ───────────────────────────── Apólices ─────────────────────────────
export type PolicyStatus = "vigente" | "vencida" | "cancelada" | "renovada" | "em_emissao";
export interface Policy {
  id: ID;
  number: string;
  holder: PartyRef;
  insurerId: ID;
  line: ProductLine;
  productName: string;
  start: ISODate;
  end: ISODate;
  annualPremium: number;
  commissionPct: number;
  ownerId: ID;
  status: PolicyStatus;
  insuredAssetId?: ID;
  beneficiaryIds?: ID[];
  healthPlanId?: ID;
  capitalInsured?: number;
  deductible?: number;
  proposalId?: ID;
  renewedFromId?: ID;
  dataSource: { kind: "manual" | "importacao" | "document-ai" | "proposta" | "demo"; at: ISODateTime; by?: ID };
  demo: true;
}

export type RenewalStatus = "identificada" | "coletando_dados" | "cotando" | "proposta_enviada" | "renovada" | "nao_renovada";
export interface Renewal {
  id: ID;
  policyId: ID;
  status: RenewalStatus;
  dueDate: ISODate;
  opportunityId?: ID;
  checklist: { key: string; label: string; done: boolean }[];
  changesReported?: string;
  createdBy: "automacao" | ID;
  createdAt: ISODateTime;
  demo: true;
}

// ───────────────────────────── Operação ─────────────────────────────
export type DocumentKind =
  | "apolice" | "proposta" | "boleto" | "carteirinha" | "documento_pessoal" | "condicoes_gerais"
  | "comprovante" | "crlv" | "tabela" | "outro";

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0..1
}

export interface DocumentRecord {
  id: ID;
  name: string;
  kind: DocumentKind;
  party?: PartyRef;
  policyId?: ID;
  sizeKb: number;
  mime: string;
  uploadedAt: ISODateTime;
  uploadedBy: ID;
  channel: "upload" | "email" | "whatsapp" | "importacao" | "sistema";
  status: "arquivado" | "aguardando_revisao" | "processado";
  extraction?: { fields: ExtractedField[]; parser: string; at: ISODateTime; reviewedBy?: ID };
  textContent?: string; // só DEMO (documentos de texto); em produção o binário fica no storage S3
  demo: true;
}

export type TaskCategory = "follow_up" | "documento" | "renovacao" | "cotacao" | "emissao" | "pendencia" | "cross_sell" | "revisao";
export interface Task {
  id: ID;
  title: string;
  description?: string;
  party?: PartyRef;
  related?: { type: "policy" | "proposal" | "quote" | "opportunity" | "renewal" | "document"; id: ID };
  category: TaskCategory;
  due: ISODate;
  ownerId: ID;
  status: "aberta" | "concluida";
  waitingOn?: "cliente" | "seguradora";
  waitingSince?: ISODate;
  value?: number; // prêmio em jogo — usado pela priorização
  origin: "manual" | { automationId: ID };
  createdAt: ISODateTime;
  completedAt?: ISODateTime;
  demo: true;
}

export interface Interaction {
  id: ID;
  party: PartyRef;
  at: ISODateTime;
  channel: "whatsapp" | "email" | "telefone" | "reuniao" | "sistema";
  direction: "entrada" | "saida" | "interno";
  summary: string;
  userId?: ID;
  demo: true;
}

export interface Commission {
  id: ID;
  policyId: ID;
  competence: string; // "2026-10"
  expected: number;
  received?: number;
  receivedAt?: ISODate;
  status: "prevista" | "recebida" | "divergente" | "atrasada";
  demo: true;
}

export interface AuditLog {
  id: ID;
  at: ISODateTime;
  userId: ID | "sistema";
  entity: string;
  entityId: ID;
  action: "create" | "update" | "delete" | "view_sensitive" | "export" | "login" | "automation";
  summary: string;
  changes?: { field: string; before: unknown; after: unknown }[];
  source: "ui" | "automacao" | "document-ai" | "importacao" | "ai-assistant";
}

// ───────────────────────────── Automação ─────────────────────────────
export type AutomationTrigger =
  | "policy.created" | "policy.days_to_end" | "proposal.sent_no_reply" | "document.received"
  | "client.created" | "policy.issued" | "task.overdue";

export type AutomationAction =
  | "create_renewal" | "create_task" | "create_follow_up" | "classify_document"
  | "check_cross_sell" | "schedule_commission" | "notify_owner";

export interface Automation {
  id: ID;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: { field: string; op: "eq" | "lte" | "gte" | "in"; value: string | number | string[] }[];
  actions: AutomationAction[];
  enabled: boolean;
  minutesSavedPerRun: number;
  system: boolean; // automações nativas não podem ser apagadas
}

export interface AutomationExecution {
  id: ID;
  automationId: ID;
  at: ISODateTime;
  summary: string;
  refs: { type: string; id: ID }[];
  minutesSaved: number;
}

// ───────────────────────────── Estado agregado da DEMO ─────────────────────────────
export interface Settings {
  restrictWalletToOwner: boolean;
  followUpDays: number;
  renewalWindows: number[]; // [90,60,30,15,7]
  rolePermissions: Record<RoleKey, Permission[]>;
}

export interface DB {
  version: number;
  users: User[];
  persons: Person[];
  companies: Company[];
  households: Household[];
  companyRelationships: CompanyRelationship[];
  addresses: Address[];
  assets: Asset[];
  insurers: Insurer[];
  healthPlans: HealthPlan[];
  providers: Provider[];
  planProviders: PlanProviderLink[];
  networkSources: NetworkDataSource[];
  opportunities: Opportunity[];
  quotes: Quote[];
  proposals: Proposal[];
  policies: Policy[];
  renewals: Renewal[];
  documents: DocumentRecord[];
  tasks: Task[];
  interactions: Interaction[];
  commissions: Commission[];
  audit: AuditLog[];
  automations: Automation[];
  automationRuns: AutomationExecution[];
  settings: Settings;
}
