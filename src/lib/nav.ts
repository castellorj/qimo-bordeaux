export interface NavItem {
  key: string; // chave de tradução (nav.<key> / navd.<key>)
  href: string;
  icon: string;
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
