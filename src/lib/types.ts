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
  description: string;
  chef?: string;
  specialty?: string;
  averageTicket?: string;
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
  days?: string; // dias/horários de funcionamento
  reservationRequired?: boolean;
  stars?: string; // ex.: "1 estrela Michelin"
  qimoSelect?: boolean;
}

export interface ConciergeContact {
  slug: string;
  label: string;
  type: "call" | "whatsapp" | "emergency" | "maps" | "info" | "link";
  value: string;
  hint?: string;
  icon: string; // nome lucide
}

export interface FrenchPhrase {
  pt: string;
  fr: string;
  hint: string; // pronúncia aproximada
}
