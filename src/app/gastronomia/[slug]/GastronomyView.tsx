"use client";

import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { ActivityReserve } from "@/components/ActivityReserve";
import { QimoSeal, Crumb } from "@/components/ui";
import { useGuideItem, useGuideLoading } from "@/components/GuideContent";
import type { GastronomyItem } from "@/lib/types";

export function GastronomyView({ slug }: { slug: string }) {
  const g = useGuideItem<GastronomyItem>("gastronomy", slug);
  const loading = useGuideLoading();
  if (loading) return <div className="container-editorial py-20 text-center text-muted">Carregando...</div>;
  if (!g) return <div className="container-editorial py-20 text-center text-muted">Item não encontrado.</div>;

  const gallery = (g.gallery || []).filter(Boolean);
  const highlights = (g.highlights || []).filter(Boolean);

  return (
    <article>
      <section className="relative">
        <SmartImage src={g.heroImage} alt={g.name} label={g.category} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/gastronomia" label="Voltar" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{g.category}</p>
                {g.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{g.name}</h1>
              {g.subtitle && <p className="mt-2 font-serif text-lg font-light italic text-cream/85 sm:text-xl">{g.subtitle}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="container-editorial py-12">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            {gallery.length > 0 && <PhotoCarousel images={gallery} alt={g.name} />}

            <p className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{g.description}</p>

            {highlights.length > 0 && (
              <div className="rounded-[14px] border bg-white/40 p-5" style={{ borderColor: "var(--line)" }}>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">Destaques</p>
                <ul className="mt-3 space-y-2.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-[14px] leading-snug" style={{ color: "var(--text)" }}>
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep"><Icon name="Star" size={11} /></span>{h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(g.teeTime || g.price) && (
              <div className="flex flex-wrap items-center gap-2">
                {g.teeTime && <span className="chip"><Icon name="Clock" size={13} /> {g.teeTime}</span>}
                {g.price && <span className="chip"><Icon name="Coins" size={13} /> {g.price}</span>}
              </div>
            )}

            {/* Site oficial + Reservar — mesma altura/estilo, lado a lado. */}
            <div className="flex flex-wrap items-center gap-3">
              {g.website && (
                <a href={g.website.startsWith("http") ? g.website : `https://${g.website}`} target="_blank" rel="noopener noreferrer"
                  className="btn-primary !rounded-[10px] !px-4 !py-3 text-[12px]">
                  <Icon name="Globe" size={15} /> Site oficial
                </a>
              )}
              {/* Mesma reserva do dia: usa a atividade da programação (activityKey) quando vinculada. */}
              <ActivityReserve contentKey={g.activityKey || g.slug} inline />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
