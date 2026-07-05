// Modelo de blocos para páginas customizadas (construtor visual).

export type BlockType =
  | "banner" | "heading" | "text" | "image" | "gallery" | "list" | "button" | "divider";

export interface Block {
  id: string;
  type: BlockType;
  // campos possíveis (todos opcionais; usados conforme o tipo)
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
}

export const BLOCK_LIBRARY: { type: BlockType; label: string; icon: string; hint: string }[] = [
  { type: "banner", label: "Banner", icon: "Image", hint: "Foto grande com título" },
  { type: "heading", label: "Título", icon: "BookOpen", hint: "Título de seção" },
  { type: "text", label: "Texto", icon: "FileText", hint: "Parágrafo" },
  { type: "image", label: "Imagem", icon: "Camera", hint: "Uma foto com legenda" },
  { type: "gallery", label: "Galeria", icon: "LayoutGrid", hint: "Grade de fotos" },
  { type: "list", label: "Lista", icon: "Compass", hint: "Itens com marcadores" },
  { type: "button", label: "Botão", icon: "Navigation", hint: "Link ou ação" },
  { type: "divider", label: "Separador", icon: "Minus", hint: "Linha divisória" },
];

export function newBlock(type: BlockType): Block {
  const id = `b_${Math.random().toString(36).slice(2, 9)}`;
  const base: Block = { id, type };
  switch (type) {
    case "banner": return { ...base, title: "Título do banner", subtitle: "Subtítulo", image: "" };
    case "heading": return { ...base, kicker: "", text: "Novo título" };
    case "text": return { ...base, body: "Escreva o texto aqui." };
    case "image": return { ...base, url: "", caption: "" };
    case "gallery": return { ...base, images: [] };
    case "list": return { ...base, title: "Lista", icon: "Compass", items: ["Primeiro item"] };
    case "button": return { ...base, label: "Saiba mais", href: "", style: "primary" };
    case "divider": return { ...base };
  }
}
