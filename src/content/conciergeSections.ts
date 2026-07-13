import type { ConciergeSection } from "@/lib/types";

// Seções do acordeão do Concierge. Servem de semente: assim que a equipe editar
// no painel, o banco passa a mandar (título, ordem, visibilidade, conteúdo).
export const conciergeSections: ConciergeSection[] = [
  { slug: "contatos", title: "Contatos & suporte", hint: "Equipe QIMO, emergências e utilidades", module: "contacts", defaultOpen: true },
  { slug: "cambio", title: "Câmbio", hint: "Converta Euro ↔ Real", module: "currency" },
  { slug: "navio", title: "SS Bon Voyage", hint: "Um château flutuante sobre os rios de Bordeaux", module: "ship" },
  { slug: "etiqueta", title: "Etiqueta de bordo", hint: "Costumes locais para viajar como um bordalês", module: "etiquette" },
  { slug: "frases", title: "Frases úteis em francês", module: "phrases" },
  { slug: "sua-viagem", title: "Sua viagem", hint: "Navio, mapa, documentos e mais", module: "links" },
  { slug: "idioma", title: "Idioma · Language · Idioma", module: "language" },
  { slug: "sobre", title: "Bordeaux Experience", hint: "Sobre a sua viagem", module: "trip" },
];
