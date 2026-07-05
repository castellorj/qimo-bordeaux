"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { FavoriteButton, Crumb, Pill } from "@/components/ui";
import { ReadMore } from "@/components/ReadMore";
import { useGuideItem } from "@/components/GuideContent";
import { Editable } from "@/components/Editable";
import type { City } from "@/lib/types";

function List({ title, icon, items }: { title: string; icon: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="kicker flex items-center gap-2">
        <Icon name={icon} size={14} /> {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3 font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CityView({ slug }: { slug: string }) {
  const c = useGuideItem<City>("city", slug);
  if (!c) return <div className="container-editorial py-20 text-center text-muted">Cidade não encontrada.</div>;

  const mapUrl = c.coords
    ? `https://www.google.com/maps/search/?api=1&query=${c.coords.lat},${c.coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name + ", France")}`;

  return (
    <article>
      <section className="relative">
        <SmartImage src={c.heroImage} alt={c.name} label={c.name} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/20 to-transparent" />
        <div className="container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/cidades" label="Cidades" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <Editable as="p" kind="city" slug={c.slug} field="region" value={c.region} label="Região" className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{c.region}</Editable>
              <Editable as="h1" kind="city" slug={c.slug} field="name" value={c.name} label="Nome" className="display mt-2 text-4xl text-cream sm:text-6xl">{c.name}</Editable>
              <Editable as="p" kind="city" slug={c.slug} field="tagline" value={c.tagline} label="Frase de destaque" className="mt-2 max-w-xl font-serif text-lg font-light italic text-cream/80">{c.tagline}</Editable>
            </div>
            <FavoriteButton id={`city:${c.slug}`} floating />
          </div>
        </div>
      </section>

      <div className="container-editorial py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="space-y-12">
            <div>
              <h2 className="kicker">História</h2>
              <Editable as="div" kind="city" slug={c.slug} field="history" value={c.history} label="História" multiline className="mt-4">
                <ReadMore text={c.history} className="font-serif text-xl font-light leading-relaxed sm:text-2xl" />
              </Editable>
            </div>
            <div className="hairline" />
            <div className="grid gap-10 sm:grid-cols-2">
              <List title="O que fazer" icon="Compass" items={c.toDo} />
              <List title="Onde fotografar" icon="Camera" items={c.photoSpots} />
              <List title="Curiosidades" icon="Sparkles" items={c.curiosities} />
              <List title="Restaurantes" icon="UtensilsCrossed" items={c.restaurants} />
              <List title="Cafés" icon="Coffee" items={c.cafes} />
              <List title="Compras" icon="ShoppingBag" items={c.shops} />
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h3 className="kicker">Visitada nos dias</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(c.visitedOnDays || []).map((d) => (
                  <Link key={d} href={`/programacao#dia-${d}`} className="chip hover:text-gold">
                    <Icon name="CalendarDays" size={13} /> Dia {d}
                  </Link>
                ))}
              </div>
              {c.bestTimes && (
                <>
                  <h3 className="kicker mt-6">Melhores horários</h3>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{c.bestTimes}</p>
                </>
              )}
              {c.localWines && (
                <>
                  <h3 className="kicker mt-6">Vinhos locais</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.localWines.map((w) => (<Pill key={w} icon="Wine">{w}</Pill>))}
                  </div>
                </>
              )}
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-6 w-full">
                <Icon name="Navigation" size={15} /> Abrir no mapa
              </a>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
