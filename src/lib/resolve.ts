import {
  cities,
  wineries,
  appellations,
  restaurants,
  gastronomy,
  experiences,
  shopping,
  itinerary,
} from "@/content";

export interface Resolved {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: string;
}

// Resolve um id de favorito (ex.: "city:bordeaux") em um item exibível.
export function resolveFav(id: string): Resolved | null {
  const [kind, slug] = id.split(":");
  switch (kind) {
    case "city": {
      const c = cities.find((x) => x.slug === slug);
      return c ? { id, title: c.name, subtitle: c.region, href: `/cidades/${c.slug}`, category: "Cidade" } : null;
    }
    case "winery": {
      const w = wineries.find((x) => x.slug === slug);
      return w ? { id, title: w.name, subtitle: w.appellation, href: `/vinicolas/${w.slug}`, category: "Vinícola" } : null;
    }
    case "wine": {
      const a = appellations.find((x) => x.slug === slug);
      return a ? { id, title: a.name, subtitle: a.tagline, href: `/vinhos/${a.slug}`, category: "Vinho" } : null;
    }
    case "resto": {
      const r = restaurants.find((x) => x.slug === slug);
      return r ? { id, title: r.name, subtitle: r.city, href: `/restaurantes/${r.slug}`, category: "Restaurante" } : null;
    }
    case "gastro": {
      const g = gastronomy.find((x) => x.slug === slug);
      return g ? { id, title: g.name, subtitle: g.category, href: `/gastronomia/${g.slug}`, category: "Gastronomia" } : null;
    }
    case "exp": {
      const e = experiences.find((x) => x.slug === slug);
      return e ? { id, title: e.name, subtitle: e.category, href: `/experiencias/${e.slug}`, category: "Experiência" } : null;
    }
    case "shop": {
      const s = shopping.find((x) => x.slug === slug);
      return s ? { id, title: s.name, subtitle: s.category, href: `/compras/${s.slug}`, category: "Compras" } : null;
    }
    case "act": {
      for (const d of itinerary) {
        const a = d.activities.find((x) => x.id === slug);
        if (a)
          return {
            id,
            title: a.title,
            subtitle: `Dia ${d.n}${a.time ? " · " + a.time : ""}`,
            href: `/programacao#dia-${d.n}`,
            category: "Programação",
          };
      }
      return null;
    }
    default:
      return null;
  }
}
