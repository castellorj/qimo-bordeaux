"use client";

import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Crumb } from "@/components/ui";
import { useGuideItem } from "@/components/GuideContent";
import type { GastronomyItem } from "@/lib/types";

export function GastronomyView({ slug }: { slug: string }) {
  const g = useGuideItem<GastronomyItem>("gastronomy", slug);
  if (!g) return <div className="container-editorial py-20 text-center text-muted">Item não encontrado.</div>;

  return (
    <article>
      <section className="relative">
        <SmartImage src={g.heroImage} alt={g.name} label={g.category} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/gastronomia" label="Gastronomia" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{g.category}</p>
                {g.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{g.name}</h1>
            </div>
            <FavoriteButton id={`gastro:${g.slug}`} floating />
          </div>
        </div>
      </section>

      <div className="container-editorial py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <p className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{g.description}</p>
            {g.pairing && (
              <p className="flex items-start gap-2 font-serif text-lg font-light italic" style={{ color: "var(--text-muted)" }}>
                <Icon name="Wine" size={18} className="mt-1 shrink-0 text-gold" /> {g.pairing}
              </p>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h3 className="kicker flex items-center gap-2"><Icon name="MapPin" size={14} /> Onde provar</h3>
              <ul className="mt-4 space-y-2.5">
                {(g.whereToTry || []).map((w, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />{w}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
