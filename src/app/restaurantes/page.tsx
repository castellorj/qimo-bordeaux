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

  return (
    <article className="group overflow-hidden rounded-[8px] border bg-white/70" style={{ borderColor: "var(--line)" }}>
      <Link href={`/restaurantes/${r.slug}`} className="block">
        <SmartImage src={r.heroImage} alt={r.name} label={r.name} ratio="aspect-[4/3]" priority={priority} />
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans text-[10px] uppercase tracking-wide2 text-gold-deep">
              {r.category ? t(`rest.cat.${catI18n(r.category)}.s`) : "Restaurante"}
            </p>
            <Link href={`/restaurantes/${r.slug}`} className="mt-1 block font-serif text-[22px] font-light leading-tight hover:text-gold-deep">
              {r.name}
            </Link>
            <p className="mt-1 font-sans text-[13px] text-muted">{[r.neighborhood, r.priceBand].filter(Boolean).join(" · ")}</p>
          </div>
          {r.googleRating && (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-petrol-600 text-center text-cream">
              <span className="font-sans text-[10px] uppercase leading-none text-cream/70">Google</span>
              <span className="font-sans text-[14px] font-semibold leading-none">{r.googleRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(r.highlights || []).slice(0, 3).map((item) => (
            <span key={item} className="rounded-full bg-petrol-600/6 px-2.5 py-1 font-sans text-[11px] text-petrol-700">
              {item}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <a href={reserveHref} target={reserveHref.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="btn-primary !px-3 !py-2.5 text-[12px]">
            <Icon name="Utensils" size={14} /> {r.bookingUrl ? t("rest.book") : t("rest.contact")}
          </a>
          <Link href={`/restaurantes/${r.slug}`} className="btn-ghost !px-3 !py-2.5 text-[12px]" aria-label={`Ver detalhes de ${r.name}`}>
            <Icon name="ArrowRight" size={14} />
          </Link>
        </div>
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
            <p className="kicker">{t("rest.kicker")}</p>
            <h1 className="display mt-2 text-4xl sm:text-5xl">{t("rest.title")}</h1>
            <p className="mt-4 max-w-3xl font-serif text-xl font-light leading-relaxed text-muted">{t("rest.intro")}</p>
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
              <div className="mb-5 max-w-3xl">
                <h2 className="display text-3xl">{group.title}</h2>
                <p className="mt-2 font-sans text-[14px] leading-relaxed text-muted">{group.intro}</p>
              </div>
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
