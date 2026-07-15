"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { useGuideKind } from "@/components/GuideContent";
import { useLocale } from "@/components/providers";
import { qimoWhatsApp } from "@/lib/reserve";
import type { Restaurant } from "@/lib/types";

// Categorias (títulos/intros editáveis no painel via i18n rest.cat.*)
const CATEGORY_KEYS = ["michelin", "bistro", "wine-bar", "contemporary"] as const;
const catI18n = (k?: string) => (k === "wine-bar" ? "wineBar" : k || "");

const filters = [
  { label: "Alta gastronomia", match: (r: Restaurant) => r.category === "michelin" },
  { label: "Michelin", match: (r: Restaurant) => Boolean(r.michelin || r.stars) },
  { label: "Bistrô", match: (r: Restaurant) => r.category === "bistro" },
  { label: "Cozinha francesa", match: (r: Restaurant) => /francesa|francês|bistrô|sudoeste/i.test(`${r.specialty} ${r.description}`) },
  { label: "Wine bar", match: (r: Restaurant) => r.category === "wine-bar" },
  { label: "Mercado", match: (r: Restaurant) => /mercado/i.test(`${r.name} ${r.specialty}`) },
  { label: "Almoço", match: (r: Restaurant) => /almoço/i.test(`${r.bestFor} ${r.highlights?.join(" ")}`) },
  { label: "Jantar", match: (r: Restaurant) => /jantar/i.test(`${r.bestFor} ${r.description}`) },
  { label: "Romântico", match: (r: Restaurant) => r.seals?.includes("Experiência romântica") ?? false },
  { label: "Para grupos", match: (r: Restaurant) => /grupo/i.test(`${r.practical?.groups} ${r.highlights?.join(" ")}`) },
  { label: "Próximo ao centro", match: (r: Restaurant) => /Grand Théâtre|Triangle|Place|Centro|Saint-Pierre|Hôtel/i.test(r.neighborhood || "") },
  { label: "Até €50", match: (r: Restaurant) => r.priceBand === "Até €50" },
  { label: "€50 a €100", match: (r: Restaurant) => r.priceBand === "€50 a €100" },
  { label: "Acima de €100", match: (r: Restaurant) => r.priceBand === "Acima de €100" },
];

type Sort = "thomas" | "sophisticated" | "value" | "near" | "price";

function priceRank(price?: Restaurant["priceBand"]) {
  if (price === "Até €50") return 1;
  if (price === "€50 a €100") return 2;
  if (price === "Acima de €100") return 3;
  return 4;
}

function RestaurantCard({ r, priority }: { r: Restaurant; priority?: boolean }) {
  const { t } = useLocale();
  const reserveHref =
    r.bookingUrl ||
    (r.phone ? `tel:${r.phone}` : qimoWhatsApp(`Olá! Gostaria de reservar uma mesa no ${r.name}.`));
  const category = r.category ? t(`rest.cat.${catI18n(r.category)}.s`) : "Restaurante";
  const summary = r.bestFor || r.specialty || r.description;

  return (
    <article className="group overflow-hidden rounded-[6px] border bg-black shadow-card" style={{ borderColor: "var(--line)" }}>
      <Link href={`/restaurantes/${r.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <SmartImage src={r.heroImage} alt={r.name} label={r.name} ratio="aspect-[4/3]" priority={priority} />
          <div className="absolute inset-0" style={{ background: "rgba(20,7,11,0.28)" }} />
          <div className="scrim-strong absolute inset-0" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="chip-on-photo !rounded-[6px] !border-gold/50 font-sans text-[10px] font-semibold uppercase tracking-luxe text-gold-soft">
              <Icon name="UtensilsCrossed" size={12} /> {category}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 pb-6" style={{ textShadow: "0 1px 18px rgba(12,4,7,.85), 0 1px 3px rgba(12,4,7,.7)" }}>
            <h2 className="font-serif text-[30px] font-light leading-[1.05] text-cream">{r.name}</h2>
          </div>
        </div>
      </Link>

      {summary && (
        <div className="border-t bg-cream px-5 py-4" style={{ borderColor: "var(--line)" }}>
          <p className="line-clamp-2 font-sans text-[13px] leading-relaxed text-muted">
            {summary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] border-t bg-petrol-600 font-sans text-[11px] font-semibold uppercase tracking-wide text-cream shadow-[inset_0_1px_0_rgba(255,255,255,.16)]" style={{ borderColor: "rgba(255,255,255,.18)" }}>
          <a href={reserveHref} target={reserveHref.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 transition-colors hover:bg-white/10">
            <Icon name="CalendarCheck" size={15} /> {r.bookingUrl ? t("rest.book") : t("rest.contact")}
          </a>
          <Link href={`/restaurantes/${r.slug}`} className="flex items-center justify-center border-l border-white/15 px-4 py-3 transition-colors hover:bg-white/10" aria-label={`Ver detalhes de ${r.name}`}>
            <Icon name="ArrowRight" size={15} />
          </Link>
      </div>
    </article>
  );
}

export default function RestaurantesPage() {
  const { t } = useLocale();
  const restaurants = useGuideKind<Restaurant>("restaurant").filter((r) => r.adminStatus !== "oculto" && r.adminStatus !== "encerrado");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sort, setSort] = useState<Sort>("thomas");

  const filtered = useMemo(() => {
    const picked = filters.find((f) => f.label === activeFilter);
    const list = picked ? restaurants.filter(picked.match) : restaurants;
    return [...list].sort((a, b) => {
      if (sort === "sophisticated") return (b.qimoScores?.exclusivity ?? 0) - (a.qimoScores?.exclusivity ?? 0);
      if (sort === "value") return (b.qimoScores?.value ?? 0) - (a.qimoScores?.value ?? 0);
      if (sort === "near") return (b.qimoScores?.location ?? 0) - (a.qimoScores?.location ?? 0);
      if (sort === "price") return priceRank(a.priceBand) - priceRank(b.priceBand);
      return (b.qimoScores?.overall ?? 0) - (a.qimoScores?.overall ?? 0) || (a.sortOrder ?? 99) - (b.sortOrder ?? 99);
    });
  }, [activeFilter, restaurants, sort]);

  const grouped = useMemo(() => {
    return CATEGORY_KEYS.map((key) => ({
      key: key as Restaurant["category"],
      title: t(`rest.cat.${catI18n(key)}.t`),
      intro: t(`rest.cat.${catI18n(key)}.i`),
      items: filtered.filter((r) => r.category === key),
    }));
  }, [filtered, t]);

  return (
    <>
      <PageHero section="restaurantes" small bgImage="/photos/food-entrecote.jpg" />
      <main className="container-editorial py-10">
        <section>
          <div>
            <h1 className="kicker text-[13px]">{t("rest.kicker")}</h1>
          </div>
        </section>

        <section className="sticky top-0 z-20 -mx-4 mt-8 border-y bg-cream/95 px-4 py-3 backdrop-blur" style={{ borderColor: "var(--line)" }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["Todos", ...filters.map((f) => f.label)].map((label) => (
              <button
                key={label}
                onClick={() => setActiveFilter(label)}
                className={clsx(
                  "shrink-0 rounded-full border px-4 py-2 font-sans text-[13px] transition-colors",
                  activeFilter === label ? "border-petrol-600 bg-petrol-600 text-cream" : "border-black/10 bg-white/60 text-muted hover:text-petrol-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border bg-white/70 px-4 py-2 font-sans text-[13px]" style={{ borderColor: "var(--line)" }}>
              <option value="thomas">{t("rest.sort.thomas")}</option>
              <option value="sophisticated">{t("rest.sort.sophisticated")}</option>
              <option value="value">{t("rest.sort.value")}</option>
              <option value="near">{t("rest.sort.near")}</option>
              <option value="price">{t("rest.sort.price")}</option>
            </select>
          </div>
        </section>

        <div className="mt-8">
          {grouped.map((group) => group.items.length > 0 && (
            <section key={group.key} className="mb-12">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((r, i) => <RestaurantCard key={r.slug} r={r} priority={i < 2} />)}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
