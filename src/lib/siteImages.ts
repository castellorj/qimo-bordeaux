// Registro central de TODAS as fotos fixas do site que podem ser trocadas no painel.
// Cada foto tem uma chave em bordeaux_settings (valor = URL). Os componentes leem
// com cfg(key) e caem no `def` (arquivo local) quando não há override.
// Editável em: Painel → aba "Fotos & Concierge" → "Fotos do site".

export interface SiteImage {
  key: string;
  label: string;
  group: string;
  def: string;
  hint?: string;
}

export const SITE_IMAGES: SiteImage[] = [
  // ---- Telas de entrada ----
  { key: "img.hero.viagem", label: "Viagem (entrada)", group: "Telas de entrada", def: "/photos/hero-bordeaux.jpg", hint: "A primeira tela do cliente." },
  { key: "img.hero.hoje", label: "Hoje (saudação)", group: "Telas de entrada", def: "/photos/hero-dordogne-sunset.jpg" },
  { key: "img.hero.gate", label: "Boas-vindas (login)", group: "Telas de entrada", def: "/photos/hero-bordeaux.jpg", hint: "Foto atrás do pedido de telefone." },

  // ---- Topos de seção (foto grande no topo da página) ----
  { key: "img.sec.vinicolas", label: "Vinícolas", group: "Topos de seção", def: "/photos/hero-lafite.jpg" },
  { key: "img.sec.chef", label: "Chef (Troisgros)", group: "Topos de seção", def: "/photos/ship-dining.jpg" },
  { key: "img.sec.cidades", label: "Cidades", group: "Topos de seção", def: "/photos/hero-saint-emilion.jpg" },
  { key: "img.sec.vinhos", label: "Vinhos", group: "Topos de seção", def: "/photos/hero-margaux.jpg" },
  { key: "img.sec.restaurantes", label: "Restaurantes", group: "Topos de seção", def: "/photos/food-entrecote.jpg" },
  { key: "img.sec.gastronomia", label: "Gastronomia", group: "Topos de seção", def: "/photos/food-entrecote.jpg" },
  { key: "img.sec.experiencias", label: "Experiências", group: "Topos de seção", def: "/photos/wine-glass.jpg" },
  { key: "img.sec.compras", label: "Compras", group: "Topos de seção", def: "/photos/shop-laguiole.jpg" },

  // ---- Cards do hub "Descobrir" ----
  { key: "img.hub.vinicolas", label: "Card Vinícolas", group: "Cards do Descobrir", def: "/photos/hero-lafite.jpg" },
  { key: "img.hub.chef", label: "Card Chef", group: "Cards do Descobrir", def: "/photos/ship-dining.jpg" },
  { key: "img.hub.restaurantes", label: "Card Restaurantes", group: "Cards do Descobrir", def: "/photos/food-entrecote.jpg" },
  { key: "img.hub.vinhos", label: "Card Vinhos", group: "Cards do Descobrir", def: "/photos/hero-margaux.jpg" },
  { key: "img.hub.gastronomia", label: "Card Gastronomia", group: "Cards do Descobrir", def: "/photos/food-entrecote.jpg" },
  { key: "img.hub.experiencias", label: "Card Experiências", group: "Cards do Descobrir", def: "/photos/wine-glass.jpg" },
  { key: "img.hub.compras", label: "Card Compras", group: "Cards do Descobrir", def: "/photos/shop-laguiole.jpg" },
  { key: "img.hub.cidades", label: "Card Cidades", group: "Cards do Descobrir", def: "/photos/hero-saint-emilion.jpg" },

  // ---- Concierge · "Sua viagem" ----
  { key: "img.viagem.barco", label: "Card O Navio", group: "Concierge · Sua viagem", def: "/photos/ship-exterior.jpg" },
  { key: "img.viagem.mapa", label: "Card Mapa", group: "Concierge · Sua viagem", def: "/photos/hero-vignoble.jpg" },
  { key: "img.viagem.documentos", label: "Card Documentos", group: "Concierge · Sua viagem", def: "/photos/hero-medoc.jpg" },

  // ---- Página O Navio ----
  { key: "img.barco.exterior", label: "Navio — exterior", group: "Página O Navio", def: "/photos/ship-exterior.jpg" },
  { key: "img.barco.dining", label: "Navio — gastronomia", group: "Página O Navio", def: "/photos/ship-dining.jpg" },
  { key: "img.barco.suite", label: "Navio — suíte", group: "Página O Navio", def: "/photos/ship-suite.jpg" },
];

// Default de uma chave (para os componentes casarem o fallback com o registro).
export function siteImageDef(key: string): string {
  return SITE_IMAGES.find((s) => s.key === key)?.def || "";
}
