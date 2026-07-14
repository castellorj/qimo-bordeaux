// Modelo de blocos para paginas customizadas (construtor visual).

export type BlockType =
  | "banner"
  | "heading"
  | "text"
  | "image"
  | "gallery"
  | "list"
  | "button"
  | "cta"
  | "cards"
  | "faq"
  | "video"
  | "spacer"
  | "divider";

export type BlockWidth = "normal" | "narrow" | "wide" | "full";
export type BlockAlign = "left" | "center";
export type BlockTone = "default" | "soft" | "dark";
export type BlockSpacing = "compact" | "normal" | "spacious";

export interface BlockButton {
  label: string;
  href: string;
  style?: "primary" | "ghost";
}

export interface BlockCard {
  title: string;
  text?: string;
  icon?: string;
  image?: string;
  href?: string;
}

export interface BlockFaq {
  q: string;
  a: string;
}

export interface Block {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  kicker?: string;
  text?: string;
  body?: string;
  image?: string;
  url?: string;
  caption?: string;
  images?: string[];
  icon?: string;
  items?: string[];
  label?: string;
  href?: string;
  style?: "primary" | "ghost";
  buttons?: BlockButton[];
  cards?: BlockCard[];
  faqs?: BlockFaq[];
  videoUrl?: string;
  poster?: string;
  width?: BlockWidth;
  align?: BlockAlign;
  tone?: BlockTone;
  spacing?: BlockSpacing;
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  hideDesktop?: boolean;
  hideTablet?: boolean;
  hideMobile?: boolean;
}

export const BLOCK_LIBRARY: { type: BlockType; label: string; icon: string; hint: string }[] = [
  { type: "banner", label: "Hero imagem", icon: "Image", hint: "Foto grande com titulo" },
  { type: "heading", label: "Titulo", icon: "BookOpen", hint: "Titulo de secao" },
  { type: "text", label: "Texto", icon: "FileText", hint: "Paragrafo" },
  { type: "image", label: "Imagem", icon: "Camera", hint: "Uma foto com legenda" },
  { type: "gallery", label: "Galeria", icon: "LayoutGrid", hint: "Grade de fotos" },
  { type: "list", label: "Lista", icon: "Compass", hint: "Itens com marcadores" },
  { type: "button", label: "Botao", icon: "Navigation", hint: "Link ou acao" },
  { type: "cta", label: "CTA", icon: "Megaphone", hint: "Chamada com botoes" },
  { type: "cards", label: "Cards", icon: "PanelTop", hint: "Grade de cards" },
  { type: "faq", label: "FAQ", icon: "CircleHelp", hint: "Perguntas e respostas" },
  { type: "video", label: "Video", icon: "PlayCircle", hint: "YouTube, Vimeo ou MP4" },
  { type: "spacer", label: "Espaco", icon: "MoveVertical", hint: "Respiro entre secoes" },
  { type: "divider", label: "Separador", icon: "Minus", hint: "Linha divisoria" },
];

export function newBlock(type: BlockType): Block {
  const id = `b_${Math.random().toString(36).slice(2, 9)}`;
  const base: Block = {
    id,
    type,
    width: "normal",
    align: "left",
    tone: "default",
    spacing: "normal",
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
  };
  switch (type) {
    case "banner":
      return { ...base, title: "Titulo do hero", subtitle: "Subtitulo", image: "", width: "full", align: "center", tone: "dark" };
    case "heading":
      return { ...base, kicker: "", text: "Novo titulo" };
    case "text":
      return { ...base, body: "Escreva o texto aqui." };
    case "image":
      return { ...base, url: "", caption: "" };
    case "gallery":
      return { ...base, images: [] };
    case "list":
      return { ...base, title: "Lista", icon: "Compass", items: ["Primeiro item"] };
    case "button":
      return { ...base, label: "Saiba mais", href: "", style: "primary" };
    case "cta":
      return { ...base, kicker: "Chamada", title: "Titulo da chamada", body: "Texto curto para orientar o visitante.", buttons: [{ label: "Reservar", href: "/reservas", style: "primary" }], align: "center", tone: "soft" };
    case "cards":
      return { ...base, title: "Cards", cards: [{ title: "Primeiro card", text: "Descricao curta.", icon: "Sparkles" }] };
    case "faq":
      return { ...base, title: "Perguntas frequentes", faqs: [{ q: "Pergunta", a: "Resposta." }], width: "narrow" };
    case "video":
      return { ...base, title: "Video", videoUrl: "", poster: "" };
    case "spacer":
      return { ...base, spacing: "spacious" };
    case "divider":
      return { ...base };
  }
}

export function cloneBlock(block: Block): Block {
  return {
    ...structuredClone(block),
    id: `b_${Math.random().toString(36).slice(2, 9)}`,
  };
}
