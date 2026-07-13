export interface DocumentCategory {
  slug: string;
  key: string;
  icon: string;
  description?: string;
}

export const documentCategories: DocumentCategory[] = [
  {
    slug: "passaporte",
    key: "Passaporte",
    icon: "FileText",
    description: "Passaporte, vistos e documentos oficiais de identificacao.",
  },
  {
    slug: "seguro-viagem",
    key: "Seguro viagem",
    icon: "ShieldCheck",
    description: "Apolices, contatos de emergencia e comprovantes do seguro.",
  },
  {
    slug: "passagens",
    key: "Passagens",
    icon: "Ticket",
    description: "Bilhetes aereos, trens, transfers e transportes extras.",
  },
  {
    slug: "vouchers",
    key: "Vouchers",
    icon: "QrCode",
    description: "Comprovantes, QR codes, reservas e experiencias confirmadas.",
  },
  {
    slug: "outros",
    key: "Outros",
    icon: "FileText",
    description: "Arquivos adicionais importantes para a viagem.",
  },
];
