"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { useGuideKind } from "@/components/GuideContent";
import { mapsUrl, qimoWhatsApp } from "@/lib/reserve";
import type { Restaurant } from "@/lib/types";

const categories = {
  michelin: {
    title: "Experiências Michelin e alta gastronomia",
    intro: "Mesas para ocasiões especiais, menus degustação, serviço de alto padrão e cartas de vinho para explorar Bordeaux com profundidade.",
  },
  bistro: {
    title: "Bistrôs e clássicos bordaleses",
    intro: "Cozinha francesa tradicional, casas históricas e endereços com atmosfera local para almoços e jantares sem excesso de formalidade.",
  },
  "wine-bar": {
    title: "Wine bars e experiências para amantes de vinho",
    intro: "Taças, caves, degustações e conversas com curadores para descobrir denominações, produtores e estilos de Bordeaux.",
  },
  contemporary: {
    title: "Experiências autênticas e contemporâneas",
    intro: "Mercados, mesas criativas e restaurantes modernos para alternar a alta gastronomia com uma Bordeaux mais cotidiana e atual.",
  },
} satisfies Record<NonNullable<Restaurant["category"]>, { title: string; intro: string }>;

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

type Sort = "qimo" | "sophisticated" | "value" | "near" | "price";

function priceRank(price?: Restaurant["priceBand"]) {
  if (price === "Até €50") return 1;
  if (price === "€50 a €100") return 2;
  if (price === "Acima de €100") return 3;
  return 4;
}

function RestaurantCard({ r, priority }: { r: Restaurant; priority?: boolean }) {
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
              {r.category ? categories[r.category].title.split(" e ")[0] : "Restaurante"}
            </p>
            <Link href={`/restaurantes/${r.slug}`} className="mt-1 block font-serif text-[22px] font-light leading-tight hover:text-gold-deep">
              {r.name}
            </Link>
            <p className="mt-1 font-sans text-[13px] text-muted">{[r.neighborhood, r.priceBand].filter(Boolean).join(" · ")}</p>
          </div>
          {r.qimoScores?.overall && (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-petrol-600 text-cream">
              <span className="font-sans text-[14px] font-semibold">{r.qimoScores.overall.toFixed(1)}</span>
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
            <Icon name="Utensils" size={14} /> {r.bookingUrl ? "Reservar mesa" : "Entrar em contato"}
          </a>
          <Link href={`/restaurantes/${r.slug}`} className="btn-ghost !px-3 !py-2.5 text-[12px]" aria-label={`Ver detalhes de ${r.name}`}>
            <Icon name="ArrowRight" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function MiniMap({ restaurants }: { restaurants: Restaurant[] }) {
  const points = restaurants.filter((r) => r.coords);
  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[8px] border bg-[#ebe5d8]" style={{ borderColor: "var(--line)" }}>
      <div className="absolute inset-0 opacity-60" style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(35,55,58,.12) 1px, transparent 1px), linear-gradient(rgba(35,55,58,.12) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }} />
      <div className="absolute left-[12%] top-[14%] h-[72%] w-[76%] rounded-[45%] border border-petrol-600/20" />
      {points.map((r, i) => {
        const x = Math.max(8, Math.min(90, 50 + ((r.coords!.lng + 0.574) * 900)));
        const y = Math.max(8, Math.min(86, 50 - ((r.coords!.lat - 44.842) * 900)));
        return (
          <Link
            key={r.slug}
            href={`/restaurantes/${r.slug}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-petrol-700 px-2.5 py-1.5 text-cream shadow-soft transition-transform hover:scale-105"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={r.name}
          >
            <span className="flex items-center gap-1 font-sans text-[11px]">
              <Icon name="MapPin" size={12} /> {i + 1}
            </span>
          </Link>
        );
      })}
      <div className="absolute inset-x-4 bottom-4 rounded-[8px] bg-cream/92 p-4 shadow-soft">
        <p className="kicker">Mapa editorial</p>
        <p className="mt-1 font-sans text-[12px] leading-relaxed text-muted">
          Toque em um marcador para ver detalhes. Cada ficha também abre o endereço no Google Maps.
        </p>
      </div>
    </div>
  );
}

export default function RestaurantesPage() {
  const restaurants = useGuideKind<Restaurant>("restaurant").filter((r) => r.adminStatus !== "oculto" && r.adminStatus !== "encerrado");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sort, setSort] = useState<Sort>("qimo");
  const [view, setView] = useState<"lista" | "mapa">("lista");

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
    return Object.entries(categories).map(([key, meta]) => ({
      key: key as Restaurant["category"],
      ...meta,
      items: filtered.filter((r) => r.category === key),
    }));
  }, [filtered]);

  return (
    <>
      <PageHero section="restaurantes" small bgImage="/photos/food-entrecote.jpg" />
      <main className="container-editorial py-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="kicker">Onde comer em Bordeaux</p>
            <h1 className="display mt-2 text-4xl sm:text-5xl">Curadoria gastronômica QIMO</h1>
            <p className="mt-4 max-w-3xl font-serif text-xl font-light leading-relaxed text-muted">
              Restaurantes, wine bars e experiências validados para consulta rápida no celular, com reserva, mapa e recomendação editorial em cada ficha.
            </p>
          </div>
          <div className="rounded-[8px] border p-4" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
            <p className="kicker">Validação</p>
            <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">
              Dados revisados em 11/07/2026. Campos sem confirmação pública aparecem como “Informação não divulgada oficialmente.”
            </p>
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
              <option value="qimo">Recomendados pela QIMO</option>
              <option value="sophisticated">Mais sofisticados</option>
              <option value="value">Melhor custo-benefício</option>
              <option value="near">Mais próximos</option>
              <option value="price">Faixa de preço</option>
            </select>
            <div className="ml-auto flex rounded-full border p-1 lg:hidden" style={{ borderColor: "var(--line)" }}>
              {(["lista", "mapa"] as const).map((mode) => (
                <button key={mode} onClick={() => setView(mode)} className={clsx("rounded-full px-3 py-1.5 font-sans text-[12px]", view === mode && "bg-petrol-600 text-cream")}>
                  {mode === "lista" ? "Lista" : "Mapa"}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className={clsx(view === "mapa" && "hidden lg:block")}>
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

          <aside className={clsx("lg:sticky lg:top-28 lg:self-start", view === "lista" && "hidden lg:block")}>
            <MiniMap restaurants={filtered} />
            <a href={mapsUrl("Bordeaux, France", "Restaurantes Bordeaux")} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-3 w-full !py-3">
              <Icon name="Navigation" size={15} /> Abrir Bordeaux no Google Maps
            </a>
          </aside>
        </div>
      </main>
    </>
  );
}
