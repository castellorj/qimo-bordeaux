import { TRIP, itinerary } from "./itinerary";
import { cities } from "./cities";
import { wineries as tripWineries } from "./wineries";
import { iconicChateaux } from "./chateaux";

// Vinícolas = paradas do roteiro + châteaux-ícone (dossiês premium).
const wineries = [...tripWineries, ...iconicChateaux];
import { appellations } from "./wines";
import { gastronomy } from "./gastronomy";
import { experiences } from "./experiences";
import { shopping, taxFreeGuide } from "./shopping";
import { conciergeContacts, frenchPhrases, etiquette } from "./concierge";
import { conciergeSections } from "./conciergeSections";
import { chefExperiences } from "./chef";
import { ship } from "./ship";
import { restaurants } from "./restaurants";
import { infoFacts, etiquetteTips } from "./info";

export const content = {
  trip: TRIP,
  ship,
  restaurants,
  itinerary,
  cities,
  wineries,
  appellations,
  gastronomy,
  experiences,
  shopping,
  taxFreeGuide,
  conciergeContacts,
  conciergeSections,
  frenchPhrases,
  etiquette,
  infoFacts,
  etiquetteTips,
  chefExperiences,
};

// Lookups
export const getCity = (slug: string) => cities.find((c) => c.slug === slug);
export const getWinery = (slug: string) => wineries.find((w) => w.slug === slug);
export const getAppellation = (slug: string) => appellations.find((a) => a.slug === slug);
export const getDay = (n: number) => itinerary.find((d) => d.n === n);

export {
  TRIP,
  ship,
  restaurants,
  itinerary,
  cities,
  wineries,
  appellations,
  gastronomy,
  experiences,
  shopping,
  taxFreeGuide,
  conciergeContacts,
  conciergeSections,
  frenchPhrases,
  etiquette,
  infoFacts,
  etiquetteTips,
  chefExperiences,
};

// Índice de busca unificado
export interface SearchDoc {
  title: string;
  subtitle: string;
  href: string;
  category: string;
  keywords: string;
}

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  itinerary.forEach((d) =>
    docs.push({
      title: `Dia ${d.n} — ${d.title}`,
      subtitle: d.subtitle || d.ports.join(", "),
      href: `/programacao#dia-${d.n}`,
      category: "Programação",
      keywords: `${d.title} ${d.ports.join(" ")} ${d.activities.map((a) => a.title).join(" ")}`,
    })
  );
  cities.forEach((c) =>
    docs.push({
      title: c.name,
      subtitle: c.tagline,
      href: `/cidades/${c.slug}`,
      category: "Cidade",
      keywords: `${c.name} ${c.region} ${c.tagline}`,
    })
  );
  wineries.forEach((w) =>
    docs.push({
      title: w.name,
      subtitle: `${w.appellation}${w.classification ? " · " + w.classification : ""}`,
      href: `/vinicolas/${w.slug}`,
      category: "Vinícola",
      keywords: `${w.name} ${w.appellation} ${w.grapes.join(" ")}`,
    })
  );
  appellations.forEach((a) =>
    docs.push({
      title: a.name,
      subtitle: a.tagline,
      href: `/vinhos/${a.slug}`,
      category: "Vinho",
      keywords: `${a.name} ${a.grapes.join(" ")} ${a.tagline}`,
    })
  );
  restaurants.forEach((r) =>
    docs.push({
      title: r.name,
      subtitle: `${r.city}${r.stars ? " · " + r.stars : ""}`,
      href: `/restaurantes/${r.slug}`,
      category: "Restaurante",
      keywords: `${r.name} ${r.city} ${r.specialty ?? ""} ${r.chef ?? ""}`,
    })
  );
  gastronomy.forEach((g) =>
    docs.push({
      title: g.name,
      subtitle: g.category,
      href: `/gastronomia/${g.slug}`,
      category: "Gastronomia",
      keywords: `${g.name} ${g.description}`,
    })
  );
  experiences.forEach((e) =>
    docs.push({
      title: e.name,
      subtitle: e.category,
      href: `/experiencias/${e.slug}`,
      category: "Experiência",
      keywords: `${e.name} ${e.description}`,
    })
  );
  shopping.forEach((s) =>
    docs.push({
      title: s.name,
      subtitle: s.category,
      href: `/compras/${s.slug}`,
      category: "Compras",
      keywords: `${s.name} ${s.description}`,
    })
  );
  return docs;
}
