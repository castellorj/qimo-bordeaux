"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { QimoSeal, Crumb, Pill } from "@/components/ui";
import { ActionBar } from "@/components/ActionBar";
import { restaurantActions, mapsUrl, qimoWhatsApp } from "@/lib/reserve";
import { useGuideItem, useGuideKind, useGuideLoading } from "@/components/GuideContent";
import type { Restaurant } from "@/lib/types";

const categoryLabel: Record<string, string> = {
  michelin: "Alta gastronomia",
  bistro: "Bistrô e clássico",
  "wine-bar": "Wine bar",
  contemporary: "Experiência contemporânea",
};

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
  const loading = useGuideLoading();
  const all = useGuideKind<Restaurant>("restaurant");
  if (loading) return <div className="container-editorial py-20 text-center text-muted">Carregando...</div>;
  if (!r) return <div className="container-editorial py-20 text-center text-muted">Restaurante não encontrado.</div>;

  const hasPublishedChef = r.chef && r.chef !== "Informação não divulgada oficialmente.";
  const nearby = all
    .filter((item) => item.slug !== r.slug && item.category === r.category)
    .slice(0, 3);
  const shareText = `Veja ${r.name} no Guia QIMO Bordeaux: ${typeof window !== "undefined" ? window.location.href : ""}`;
  const gallery = r.gallery?.length ? r.gallery : [r.heroImage].filter(Boolean) as string[];

  return (
    <article>
      <section className="relative">
        <SmartImage src={r.heroImage} alt={r.name} label={r.city} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-petrol-950/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-petrol-950/90 via-petrol-950/58 to-petrol-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/92 via-petrol-950/35 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/restaurantes" label="Voltar" />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-5xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{r.neighborhood || r.city}</p>
                {r.category && <Pill icon="Utensils">{categoryLabel[r.category]}</Pill>}
                {r.michelin && <Pill icon="Star">{r.michelin}</Pill>}
                {r.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-3 text-4xl leading-[0.98] text-cream drop-shadow-[0_3px_20px_rgba(0,0,0,.55)] sm:text-6xl">{r.name}</h1>
              {hasPublishedChef && <p className="mt-3 max-w-3xl font-serif text-lg font-light italic text-cream/90 drop-shadow-[0_2px_12px_rgba(0,0,0,.7)]">{r.chef}</p>}
            </div>
            {r.googleRating && (
              <div className="rounded-[8px] bg-cream/95 px-5 py-4 text-center text-petrol-800">
                <p className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Nota Google</p>
                <p className="font-serif text-4xl font-light">{r.googleRating.toFixed(1)}</p>
                {r.googleReviewsCount && <p className="mt-1 font-sans text-[10px] text-muted">{r.googleReviewsCount} avaliações</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-editorial py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            {gallery.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {gallery.slice(0, 3).map((img, i) => (
                  <SmartImage key={img} src={img} alt={`${r.name} foto ${i + 1}`} label="Foto oficial pendente" ratio="aspect-[4/3]" />
                ))}
              </div>
            )}

            <section>
              <p className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{r.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(r.seals || []).slice(0, 3).map((seal) => <Pill key={seal} icon="Sparkles">{seal}</Pill>)}
              </div>
            </section>

            {r.highlights?.length ? (
              <section>
                <h2 className="display text-3xl">Destaques</h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {r.highlights.map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-[8px] border bg-white/60 px-4 py-3 font-sans text-[14px]" style={{ borderColor: "var(--line)" }}>
                      <Icon name="Check" size={15} className="text-gold-deep" /> {item}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[8px] border bg-petrol-600 p-6 text-cream" style={{ borderColor: "var(--line)" }}>
              <p className="kicker text-gold-soft">Dica do Sommelier</p>
              <p className="mt-3 font-serif text-xl font-light leading-relaxed">{r.sommelierTip || "Informação não divulgada oficialmente."}</p>
            </section>

            <section>
              <h2 className="display text-3xl">Mapa</h2>
              <a href={r.mapsUrl || mapsUrl(r.address, r.name)} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-[180px] items-center justify-center rounded-[8px] border bg-[#ebe5d8] font-sans text-[14px] text-petrol-700" style={{ borderColor: "var(--line)" }}>
                <span className="flex items-center gap-2"><Icon name="Navigation" size={16} /> Abrir no Google Maps</span>
              </a>
            </section>

            {nearby.length > 0 && (
              <section>
                <h2 className="display text-3xl">Restaurantes próximos</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {nearby.map((item) => (
                    <Link key={item.slug} href={`/restaurantes/${item.slug}`} className="rounded-[8px] border bg-white/60 p-4 hover:border-gold" style={{ borderColor: "var(--line)" }}>
                      <p className="font-serif text-[18px] font-light">{item.name}</p>
                      <p className="mt-1 font-sans text-[12px] text-muted">{item.neighborhood}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h3 className="kicker">Ficha rápida</h3>
              <div className="mt-3">
                <Spec icon="UtensilsCrossed" label="Cozinha" value={r.specialty} />
                <Spec icon="Wallet" label="Faixa de preço" value={r.averageTicket || r.priceBand} />
                <Spec icon="Star" label="Michelin" value={r.michelin || r.stars} />
                <Spec icon="MapPin" label="Endereço" value={r.address} />
                <Spec icon="Clock" label="Experiência" value={r.duration} />
                <Spec icon="Check" label="Reserva" value={r.reservationAdvice || (r.reservationRequired ? "Recomendada" : "Não obrigatória")} />
              </div>
              <div className="mt-6"><ActionBar actions={restaurantActions(r)} channelLabel={r.bookingChannel} /></div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={qimoWhatsApp(`Quero salvar ${r.name} para minha viagem a Bordeaux.`)} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-2 text-[12px]">
                  <Icon name="Heart" size={14} /> Favorito
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-2 text-[12px]">
                  <Icon name="MessageCircle" size={14} /> WhatsApp
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
