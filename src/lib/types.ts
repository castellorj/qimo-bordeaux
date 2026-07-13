// Modelo de dados — Guia QIMO Bordeaux Experience
// Estes tipos servem tanto para o conteúdo curado local quanto para o Supabase.

export type ActivityType =
  | "transfer"
  | "lecture"
  | "tasting"
  | "winery"
  | "active"
  | "entertainment"
  | "meal"
  | "walk"
  | "experience"
  | "leisure";

export interface ShipSchedule {
  city: string;
  eta?: string | null; // "HH:MM" | "overnight" | null
  etd?: string | null;
}

export interface Activity {
  id: string;
  time?: string | null; // "10:00–11:00"
  title: string;
  type: ActivityType;
  location?: string;
  capacity?: number;
  description?: string;
  dressCode?: string;
  reservable?: boolean; // false = não precisa reservar (não mostra "Reservar" nem entra nas reservas). Padrão: precisa.
  qimoSelect?: boolean; // Selo "Seleção QIMO"
  linkedWinery?: string; // slug
  linkedCity?: string; // slug
}

export interface Day {
  n: number;
  date: string; // ISO "2026-10-25"
  title: string;
  subtitle?: string;
  ports: string[];
  overnight?: string;
  ship: ShipSchedule[];
  activities: Activity[];
  heroImage?: string;
  dressCode?: string;
  note?: string;
}

export interface City {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  heroImage?: string;
  history: string;
  curiosities: string[];
  toDo: string[];
  photoSpots: string[];
  bestTimes?: string;
  restaurants?: string[];
  cafes?: string[];
  shops?: string[];
  localWines?: string[];
  gallery?: string[];
  coords?: { lat: number; lng: number };
  visitedOnDays: number[];
}

export interface WineScore {
  critic: string; // "Robert Parker", "Wine Spectator", "James Suckling", "Wine Advocate"
  note: string; // texto curto (ex.: "faixa 95–100")
}

export interface Winery {
  slug: string;
  name: string;
  appellation: string;
  classification?: string;
  heroImage?: string;
  family?: string;
  history: string;
  terroir?: string;
  grapes: string[];
  production?: string;
  icons: string[]; // vinhos icônicos
  historicVintages?: string[];
  scores?: WineScore[];
  averagePrice?: string;
  whatToBuy?: string[];
  whatToTaste?: string[];
  curiosities?: string[];
  visitHours?: string;
  dressCode?: string;
  website?: string;
  instagram?: string;
  bookingUrl?: string; // canal oficial de reserva/visita (site próprio ou formulário)
  bookingChannel?: string; // ex.: "Formulário oficial", "Site oficial"
  email?: string;
  phone?: string;
  address?: string; // endereço exato para "Como chegar"
  coords?: { lat: number; lng: number };
  qimoSelect?: boolean;
  visitedOnDays?: number[];
  gallery?: string[];
  region?: string; // ex.: "Médoc · Margaux" (para os châteaux-ícone)
  dossier?: string; // dossiê editorial completo em Markdown (châteaux-ícone). Quando presente, a página exibe o dossiê.
}

export interface Appellation {
  slug: string;
  name: string;
  bank: "Left" | "Right" | "Entre-deux" | "Sauternais";
  color: "Tinto" | "Branco" | "Doce" | "Tinto/Branco";
  tagline: string;
  heroImage?: string;
  description: string;
  grapes: string[];
  profile: string; // características sensoriais
  serveTemp?: string;
  pairings: string[];
  aging?: string; // potencial de guarda
  topProducers: string[];
  qimoNote?: string;
}

export interface GastronomyItem {
  slug: string;
  name: string;
  category: "Salgado" | "Doce" | "Frutos do mar" | "Queijo" | "Padaria" | "Mercado";
  heroImage?: string;
  description: string;
  whereToTry: string[];
  pairing?: string;
  qimoSelect?: boolean;
}

export interface Experience {
  slug: string;
  name: string;
  heroImage?: string;
  description: string;
  duration?: string;
  location?: string;
  category: string;
  qimoSelect?: boolean;
  relatedDay?: number;
  venueUrl?: string; // site oficial do local (quando houver)
  address?: string;
}

export interface ShoppingItem {
  slug: string;
  name: string;
  category: string;
  heroImage?: string;
  description: string;
  whereToBuy?: string[];
  priceRange?: string;
  taxFree?: boolean;
  qimoSelect?: boolean;
}

export interface Restaurant {
  slug: string;
  name: string;
  city: string;
  heroImage?: string;
  gallery?: string[];
  category?: "michelin" | "bistro" | "wine-bar" | "contemporary";
  neighborhood?: string;
  description: string;
  chef?: string;
  specialty?: string;
  averageTicket?: string;
  priceBand?: "Até €50" | "€50 a €100" | "Acima de €100";
  bestFor?: string;
  duration?: string;
  dressCode?: string;
  website?: string;
  instagram?: string;
  phone?: string;
  email?: string;
  bookingUrl?: string; // reserva oficial (site próprio ou parceiro TheFork/OpenTable)
  bookingChannel?: string; // ex.: "TheFork", "Site oficial", "Telefone"
  menuUrl?: string;
  mapsUrl?: string;
  address?: string;
  coords?: { lat: number; lng: number };
  days?: string; // dias/horários de funcionamento
  hours?: string;
  reservationRequired?: boolean;
  reservationAdvice?: string;
  stars?: string; // ex.: "1 estrela Michelin"
  michelin?: string;
  highlights?: string[];
  seals?: string[];
  practical?: {
    accessibility?: string;
    children?: string;
    vegetarian?: string;
    groups?: string;
    prepayment?: string;
    status?: string;
    reservationStatus?: string;
  };
  qimoScores?: {
    gastronomy: number;
    wine: number;
    ambience: number;
    service: number;
    location: number;
    exclusivity: number;
    value: number;
    bookingEase: number;
    overall: number;
  };
  googleRating?: number;
  googleReviewsCount?: number;
  googleRatingDate?: string;
  sommelierTip?: string;
  qimoNote?: string;
  sourcePrimary?: string;
  sourceSecondary?: string[];
  lastVerified?: string;
  informationStatus?: "confirmada" | "parcial" | "pendente";
  adminStatus?: "ativo" | "oculto" | "temporariamente-fechado" | "encerrado";
  featured?: boolean;
  sortOrder?: number;
  qimoSelect?: boolean;
}

// Seção "Chef" — experiências gastronômicas extras (cross-sell), curadoria Thomas Troisgros.
export interface ChefExperience {
  slug: string;
  name: string;
  heroImage?: string;
  category: string; // ex.: "Jantar", "Aula", "Degustação"
  chef?: string; // ex.: "Thomas Troisgros"
  description: string;
  duration?: string;
  price?: string; // texto livre; "sob consulta" quando não divulgado
  qimoSelect?: boolean;
}

export interface ConciergeContact {
  slug: string;
  label: string;
  type: "call" | "whatsapp" | "emergency" | "maps" | "info" | "link";
  value: string;
  hint?: string;
  icon: string; // nome lucide
  quick?: boolean; // aparece no balão flutuante de contatos rápidos
}

// Seções do acordeão da página Concierge — editáveis no painel (título, ordem,
// visibilidade, e conteúdo livre nas seções de texto).
export type ConciergeModule =
  | "text"       // conteúdo livre em Markdown (body)
  | "contacts"   // lista de contatos (usa o editor de contatos)
  | "currency"   // conversor de câmbio
  | "ship"       // resumo do navio + link
  | "etiquette"  // etiqueta de bordo
  | "phrases"    // frases em francês
  | "links"      // atalhos da viagem
  | "language"   // seletor de idioma
  | "trip";      // sobre a viagem

export interface ConciergeSection {
  slug: string;
  title: string;
  hint?: string;
  module: ConciergeModule;
  body?: string;        // Markdown, quando module = "text"
  defaultOpen?: boolean;
}

export interface FrenchPhrase {
  pt: string;
  fr: string;
  hint: string; // pronúncia aproximada
}
