import type { Winery, Restaurant, Experience } from "./types";

export type ActionKind = "reserve" | "site" | "maps" | "call" | "email" | "instagram" | "menu";

export interface Action {
  kind: ActionKind;
  href: string;
  labelKey: string; // chave i18n (act.*)
  icon: string;
  primary?: boolean;
  external?: boolean; // http → nova aba
}

export const QIMO_WHATSAPP = "5521995453817";

export function qimoWhatsApp(text: string) {
  return `https://wa.me/${QIMO_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// "Como chegar" a partir de endereço EXATO (nunca coordenada aproximada quando há endereço)
export function mapsUrl(address?: string, name?: string) {
  const q = address || name || "Bordeaux, France";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// Ordem de prioridade: 1) reserva oficial direta/formulário/parceiro → 2) telefone → 5) concierge QIMO
export function wineryActions(w: Winery): Action[] {
  const reserveHref =
    w.bookingUrl ||
    (w.phone ? `tel:${w.phone}` : qimoWhatsApp(`Olá! Gostaria de reservar uma visita à vinícola ${w.name}.`));
  const a: Action[] = [
    { kind: "reserve", href: reserveHref, labelKey: "act.reserveVisit", icon: "Grape", primary: true, external: reserveHref.startsWith("http") },
  ];
  if (w.website) a.push({ kind: "site", href: w.website, labelKey: "act.site", icon: "Globe", external: true });
  a.push({ kind: "maps", href: mapsUrl(w.address, w.name), labelKey: "act.maps", icon: "Navigation", external: true });
  if (w.phone) a.push({ kind: "call", href: `tel:${w.phone}`, labelKey: "act.call", icon: "Phone" });
  if (w.email) a.push({ kind: "email", href: `mailto:${w.email}`, labelKey: "act.email", icon: "Mail" });
  if (w.instagram) a.push({ kind: "instagram", href: w.instagram, labelKey: "act.instagram", icon: "Instagram", external: true });
  return a;
}

export function restaurantActions(r: Restaurant): Action[] {
  const reserveHref =
    r.bookingUrl ||
    (r.phone ? `tel:${r.phone}` : qimoWhatsApp(`Olá! Gostaria de reservar uma mesa no ${r.name}.`));
  const a: Action[] = [
    { kind: "reserve", href: reserveHref, labelKey: "act.reserveTable", icon: "Utensils", primary: true, external: reserveHref.startsWith("http") },
  ];
  if (r.menuUrl) a.push({ kind: "menu", href: r.menuUrl, labelKey: "act.menu", icon: "BookOpen", external: true });
  if (r.website) a.push({ kind: "site", href: r.website, labelKey: "act.site", icon: "Globe", external: true });
  a.push({ kind: "maps", href: mapsUrl(r.address, r.name), labelKey: "act.maps", icon: "Navigation", external: true });
  if (r.email) a.push({ kind: "email", href: `mailto:${r.email}`, labelKey: "act.email", icon: "Mail" });
  if (r.instagram) a.push({ kind: "instagram", href: r.instagram, labelKey: "act.instagram", icon: "Instagram", external: true });
  return a;
}

// Experiências do cruzeiro: o canal oficial é o concierge QIMO (organiza a bordo)
export function experienceActions(e: Experience): Action[] {
  const a: Action[] = [
    {
      kind: "reserve",
      href: qimoWhatsApp(`Olá! Gostaria de saber mais sobre a experiência "${e.name}"${e.relatedDay ? ` (Dia ${e.relatedDay})` : ""}.`),
      labelKey: "act.reserveQimo",
      icon: "MessageCircle",
      primary: true,
      external: true,
    },
  ];
  if (e.venueUrl) a.push({ kind: "site", href: e.venueUrl, labelKey: "act.site", icon: "Globe", external: true });
  if (e.location || e.address)
    a.push({ kind: "maps", href: mapsUrl(e.address, `${e.location}, France`), labelKey: "act.maps", icon: "Navigation", external: true });
  return a;
}
