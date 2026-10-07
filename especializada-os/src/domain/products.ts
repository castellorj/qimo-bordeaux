import type { ProductLine, DocumentKind } from "./types";

/**
 * Registro de módulos por ramo. Adicionar um produto = adicionar uma entrada aqui
 * (+ opcionalmente um fluxo de cotação dedicado em src/modules/<ramo>). O core
 * (cliente, CRM, apólice, renovação, documentos, comissões) funciona para todos.
 */
export interface ProductModule {
  line: ProductLine;
  label: string;
  short: string;
  icon: string; // nome do ícone lucide (ver components/ui/LineIcon)
  color: string; // cor de identificação do ramo
  /** completo = fluxo dedicado na DEMO; basico = formulário genérico parametrizado */
  depth: "completo" | "basico";
  quoteFlow: "saude" | "auto" | "generico";
  /** Campos do formulário genérico (ramos sem fluxo dedicado) */
  fields: { key: string; label: string; type: "text" | "number" | "money" | "boolean" | "select"; options?: string[] }[];
  requiredDocs: DocumentKind[];
  insuredSubject: "pessoas" | "veiculo" | "imovel" | "empresa" | "embarcacao" | "outro";
  /** Renovação: janela padrão (dias) para iniciar o processo */
  renewalLeadDays: number;
}

const m = (p: ProductModule) => p;

export const PRODUCTS: ProductModule[] = [
  m({ line: "saude", label: "Saúde", short: "Saúde", icon: "HeartPulse", color: "#e11d48", depth: "completo", quoteFlow: "saude", fields: [], requiredDocs: ["documento_pessoal", "comprovante"], insuredSubject: "pessoas", renewalLeadDays: 60 }),
  m({ line: "auto", label: "Auto", short: "Auto", icon: "Car", color: "#2563eb", depth: "completo", quoteFlow: "auto", fields: [], requiredDocs: ["crlv", "documento_pessoal"], insuredSubject: "veiculo", renewalLeadDays: 45 }),
  m({
    line: "vida", label: "Vida", short: "Vida", icon: "Shield", color: "#7c3aed", depth: "basico", quoteFlow: "generico", insuredSubject: "pessoas", renewalLeadDays: 60, requiredDocs: ["documento_pessoal"],
    fields: [
      { key: "capital", label: "Capital segurado", type: "money" },
      { key: "invalidez", label: "Invalidez por acidente", type: "boolean" },
      { key: "doencasGraves", label: "Doenças graves", type: "boolean" },
      { key: "fumante", label: "Fumante", type: "boolean" },
    ],
  }),
  m({
    line: "residencial", label: "Residencial", short: "Resid.", icon: "Home", color: "#059669", depth: "basico", quoteFlow: "generico", insuredSubject: "imovel", renewalLeadDays: 30, requiredDocs: [],
    fields: [
      { key: "incendio", label: "Incêndio / raio / explosão", type: "money" },
      { key: "danosEletricos", label: "Danos elétricos", type: "money" },
      { key: "roubo", label: "Roubo de bens", type: "money" },
      { key: "rcFamiliar", label: "RC familiar", type: "money" },
    ],
  }),
  m({
    line: "empresarial", label: "Empresarial", short: "Empres.", icon: "Building2", color: "#0891b2", depth: "basico", quoteFlow: "generico", insuredSubject: "empresa", renewalLeadDays: 60, requiredDocs: ["documento_pessoal"],
    fields: [
      { key: "atividade", label: "Atividade", type: "text" },
      { key: "valorRisco", label: "Valor em risco", type: "money" },
      { key: "lucrosCessantes", label: "Lucros cessantes", type: "boolean" },
    ],
  }),
  m({
    line: "viagem", label: "Viagem", short: "Viagem", icon: "Plane", color: "#0ea5e9", depth: "basico", quoteFlow: "generico", insuredSubject: "pessoas", renewalLeadDays: 0, requiredDocs: [],
    fields: [
      { key: "destino", label: "Destino", type: "select", options: ["Europa", "EUA/Canadá", "América do Sul", "Mundo"] },
      { key: "dias", label: "Dias de viagem", type: "number" },
      { key: "viajantes", label: "Viajantes", type: "number" },
    ],
  }),
  m({ line: "odonto", label: "Odontológico", short: "Odonto", icon: "Smile", color: "#14b8a6", depth: "basico", quoteFlow: "generico", insuredSubject: "pessoas", renewalLeadDays: 30, requiredDocs: [], fields: [{ key: "vidas", label: "Vidas", type: "number" }, { key: "ortodontia", label: "Ortodontia", type: "boolean" }] }),
  m({ line: "condominio", label: "Condomínio", short: "Cond.", icon: "Building", color: "#64748b", depth: "basico", quoteFlow: "generico", insuredSubject: "imovel", renewalLeadDays: 60, requiredDocs: [], fields: [{ key: "unidades", label: "Unidades", type: "number" }, { key: "valorReconstrucao", label: "Valor de reconstrução", type: "money" }] }),
  m({ line: "fianca", label: "Fiança locatícia", short: "Fiança", icon: "KeyRound", color: "#ca8a04", depth: "basico", quoteFlow: "generico", insuredSubject: "imovel", renewalLeadDays: 45, requiredDocs: ["documento_pessoal", "comprovante"], fields: [{ key: "aluguel", label: "Aluguel mensal", type: "money" }, { key: "encargos", label: "Encargos mensais", type: "money" }] }),
  m({ line: "rc", label: "Responsabilidade civil", short: "RC", icon: "Scale", color: "#9333ea", depth: "basico", quoteFlow: "generico", insuredSubject: "outro", renewalLeadDays: 60, requiredDocs: [], fields: [{ key: "atividade", label: "Atividade / profissão", type: "text" }, { key: "lmi", label: "Limite máximo (LMI)", type: "money" }] }),
  m({ line: "cyber", label: "Cyber", short: "Cyber", icon: "ShieldAlert", color: "#4f46e5", depth: "basico", quoteFlow: "generico", insuredSubject: "empresa", renewalLeadDays: 60, requiredDocs: [], fields: [{ key: "faturamento", label: "Faturamento anual", type: "money" }, { key: "registros", label: "Registros pessoais tratados", type: "number" }, { key: "mfa", label: "Usa MFA", type: "boolean" }] }),
  m({ line: "transportes", label: "Transportes", short: "Transp.", icon: "Truck", color: "#ea580c", depth: "basico", quoteFlow: "generico", insuredSubject: "empresa", renewalLeadDays: 60, requiredDocs: [], fields: [{ key: "embarquesMes", label: "Embarques/mês", type: "number" }, { key: "valorMedio", label: "Valor médio por embarque", type: "money" }] }),
  m({ line: "nautico", label: "Náutico", short: "Náutico", icon: "Sailboat", color: "#0284c7", depth: "basico", quoteFlow: "generico", insuredSubject: "embarcacao", renewalLeadDays: 45, requiredDocs: [], fields: [{ key: "valor", label: "Valor da embarcação", type: "money" }, { key: "navegacao", label: "Área de navegação", type: "select", options: ["Interior", "Costeira", "Oceânica"] }] }),
  m({ line: "aeronautico", label: "Aeronáutico", short: "Aero", icon: "PlaneTakeoff", color: "#475569", depth: "basico", quoteFlow: "generico", insuredSubject: "outro", renewalLeadDays: 60, requiredDocs: [], fields: [{ key: "prefixo", label: "Prefixo", type: "text" }, { key: "valor", label: "Valor do casco", type: "money" }] }),
  m({ line: "garantia", label: "Garantia", short: "Garantia", icon: "FileCheck2", color: "#16a34a", depth: "basico", quoteFlow: "generico", insuredSubject: "empresa", renewalLeadDays: 30, requiredDocs: [], fields: [{ key: "modalidade", label: "Modalidade", type: "select", options: ["Licitante", "Executante", "Judicial", "Adiantamento"] }, { key: "importancia", label: "Importância segurada", type: "money" }] }),
  m({ line: "previdencia", label: "Previdência", short: "Prev.", icon: "PiggyBank", color: "#db2777", depth: "basico", quoteFlow: "generico", insuredSubject: "pessoas", renewalLeadDays: 0, requiredDocs: ["documento_pessoal"], fields: [{ key: "tipo", label: "Tipo", type: "select", options: ["PGBL", "VGBL"] }, { key: "aporteMensal", label: "Aporte mensal", type: "money" }] }),
  m({ line: "equipamentos", label: "Equipamentos", short: "Equip.", icon: "Wrench", color: "#78716c", depth: "basico", quoteFlow: "generico", insuredSubject: "outro", renewalLeadDays: 30, requiredDocs: [], fields: [{ key: "equipamento", label: "Equipamento", type: "text" }, { key: "valor", label: "Valor", type: "money" }] }),
  m({ line: "outros", label: "Outros", short: "Outros", icon: "Package", color: "#71717a", depth: "basico", quoteFlow: "generico", insuredSubject: "outro", renewalLeadDays: 30, requiredDocs: [], fields: [{ key: "descricao", label: "Descrição", type: "text" }, { key: "valor", label: "Valor", type: "money" }] }),
];

export const PRODUCT = Object.fromEntries(PRODUCTS.map((p) => [p.line, p])) as Record<ProductLine, ProductModule>;
export const lineLabel = (l: ProductLine) => PRODUCT[l]?.label ?? l;

/** Ramos considerados no mapa de cross-sell do cliente pessoa física */
export const PERSON_CORE_LINES: ProductLine[] = ["saude", "auto", "residencial", "vida", "viagem", "odonto", "previdencia"];
export const COMPANY_CORE_LINES: ProductLine[] = ["saude", "vida", "empresarial", "rc", "cyber", "auto", "garantia"];
