"use client";

import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Crumb, Pill } from "@/components/ui";
import { ActionBar } from "@/components/ActionBar";
import { restaurantActions } from "@/lib/reserve";
import { useGuideItem } from "@/components/GuideContent";
import type { Restaurant } from "@/lib/types";

function Spec({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderTop: "1px solid var(--line)" }}>
      <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-gold" />
      <div>
        <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">{label}</p>
        <p className="mt-0.5 font-sans text-[14px]" style={{ color: "var(--text)" }}>{value}</p>
      </div>
    </div>
  );
}

export function RestaurantView({ slug }: { slug: string }) {
  const r = useGuideItem<Restaurant>("restaurant", slug);
  if (!r) return <div className="container-editorial py-20 text-center text-muted">Restaurante não encontrado.</div>;

  return (
    <article>
      <section className="relative">
        <SmartImage src={r.heroImage} alt={r.name} label={r.city} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/restaurantes" label="Restaurantes" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{r.city}</p>
                {r.stars && <Pill icon="Star">{r.stars}</Pill>}
                {r.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{r.name}</h1>
              {r.chef && <p className="mt-2 font-serif text-lg font-light italic text-cream/80">{r.chef}</p>}
            </div>
            <FavoriteButton id={`resto:${r.slug}`} floating />
          </div>
        </div>
      </section>

      <div className="container-editorial py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <p className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{r.description}</p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h3 className="kicker">Ficha</h3>
              <div className="mt-3">
                <Spec icon="UtensilsCrossed" label="Especialidade" value={r.specialty} />
                <Spec icon="Wallet" label="Ticket médio" value={r.averageTicket} />
                <Spec icon="Shirt" label="Traje" value={r.dressCode} />
                <Spec icon="Clock" label="Funcionamento" value={r.days} />
                {r.reservationRequired && <Spec icon="Check" label="Reserva" value="Recomendada" />}
              </div>
              <div className="mt-6"><ActionBar actions={restaurantActions(r)} channelLabel={r.bookingChannel} /></div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
