export interface NavItem {
  key: string; // chave de tradução (nav.<key> / navd.<key>)
  href: string;
  icon: string;
}

// Ordena itens por uma lista de chaves (CSV vinda do painel). Chaves não listadas
// ficam no fim, preservando a ordem original.
export function orderByKeys<T extends { key: string }>(items: T[], csv?: string): T[] {
  if (!csv) return items;
  const order = csv.split(",").map((s) => s.trim()).filter(Boolean);
  if (!order.length) return items;
  const rank = (k: string) => { const i = order.indexOf(k); return i < 0 ? 1000 : i; };
  return items.map((it, i) => ({ it, i })).sort((a, b) => rank(a.it.key) - rank(b.it.key) || a.i - b.i).map((x) => x.it);
}

// Navegação principal — 5 áreas (tab bar nativa)
export const primaryNav: NavItem[] = [
  { key: "hoje", href: "/", icon: "Home" },
  { key: "viagem", href: "/viagem", icon: "CalendarDays" },
  { key: "descobrir", href: "/descobrir", icon: "Grape" },
  { key: "favoritos", href: "/favoritos", icon: "Heart" },
  { key: "mais", href: "/mais", icon: "Menu" },
];

// alias usado pela tab bar inferior
export const bottomNav = primaryNav;

// Conteúdo dos hubs (cards)
export interface HubLink extends NavItem {}

export const viagemLinks: HubLink[] = [
  { key: "programacao", href: "/programacao", icon: "CalendarDays" },
  { key: "barco", href: "/barco", icon: "Ship" },
  { key: "mapa", href: "/mapa", icon: "Map" },
  { key: "documentos", href: "/documentos", icon: "FileText" },
];

export const descobrirLinks: HubLink[] = [
  { key: "vinicolas", href: "/vinicolas", icon: "Grape" },
  { key: "restaurantes", href: "/restaurantes", icon: "UtensilsCrossed" },
  { key: "vinhos", href: "/vinhos", icon: "Wine" },
  { key: "gastronomia", href: "/gastronomia", icon: "UtensilsCrossed" },
  { key: "experiencias", href: "/experiencias", icon: "Sparkles" },
  { key: "compras", href: "/compras", icon: "ShoppingBag" },
  { key: "cidades", href: "/cidades", icon: "Landmark" },
];

export const maisLinks: HubLink[] = [
  { key: "concierge", href: "/concierge", icon: "Bell" },
  { key: "informacoes", href: "/informacoes", icon: "Info" },
  { key: "paginas", href: "/paginas", icon: "BookOpen" },
  { key: "documentos", href: "/documentos", icon: "FileText" },
  { key: "favoritos", href: "/favoritos", icon: "Heart" },
];

// mantido para o rodapé (todas as seções)
export const navItems: HubLink[] = [
  ...viagemLinks,
  ...descobrirLinks,
  { key: "concierge", href: "/concierge", icon: "Bell" },
  { key: "informacoes", href: "/informacoes", icon: "Info" },
  { key: "favoritos", href: "/favoritos", icon: "Heart" },
];
