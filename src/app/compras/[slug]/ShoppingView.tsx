"use client";

import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Crumb, Pill } from "@/components/ui";
import { useGuideItem } from "@/components/GuideContent";
import type { ShoppingItem } from "@/lib/types";

export function ShoppingView({ slug }: { slug: string }) {
  const s = useGuideItem<ShoppingItem>("shopping", slug);
  if (!s) return <div className="container-editorial py-20 text-center text-muted">Item não encontrado.</div>;

  return (
    <article>
      <section className="relative">
        <SmartImage src={s.heroImage} alt={s.name} label={s.category} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/compras" label="Compras" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{s.category}</p>
                {s.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{s.name}</h1>
            </div>
            <FavoriteButton id={`shop:${s.slug}`} floating />
          </div>
        </div>
      </section>

      <div className="container-editorial py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <p className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{s.description}</p>
            <div className="flex flex-wrap gap-2">
              {s.priceRange && <Pill icon="Wallet">{s.priceRange}</Pill>}
              {s.taxFree && <Pill icon="ShieldCheck">Tax Free</Pill>}
            </div>
          </div>

          {s.whereToBuy?.length ? (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card p-6">
                <h3 className="kicker flex items-center gap-2"><Icon name="ShoppingBag" size={14} /> Onde comprar</h3>
                <ul className="mt-4 space-y-2.5">
                  {s.whereToBuy.map((w, i) => (
                    <li key={i} className="flex items-start gap-3 font-sans text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />{w}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </article>
  );
}
