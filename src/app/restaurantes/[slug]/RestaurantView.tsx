"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { QimoSeal, Crumb, Pill } from "@/components/ui";
import { ActionBar } from "@/components/ActionBar";
import { restaurantActions, mapsUrl, qimoWhatsApp } from "@/lib/reserve";
import { useGuideItem, useGuideKind } from "@/components/GuideContent";
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

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 font-sans text-[12px]">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-petrol-700">{value.toFixed(1)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, value * 10)}%` }} />
      </div>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-[8px] border bg-white/55 p-4 open:bg-white/80" style={{ borderColor: "var(--line)" }}>
      <summary className="cursor-pointer list-none font-sans text-[13px] font-semibold uppercase tracking-wide2 text-petrol-700">
        {title}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function RestaurantView({ slug }: { slug: string }) {
  const r = useGuideItem<Restaurant>("restaurant", slug);
  const all = useGuideKind<Restaurant>("restaurant");
  if (!r) return <div className="container-editorial py-20 text-center text-muted">Restaurante não encontrado.</div>;

  const nearby = all
    .filter((item) => item.slug !== r.slug && item.category === r.category)
    .slice(0, 3);
  const shareText = `Veja ${r.name} no Guia QIMO Bordeaux: ${typeof window !== "undefined" ? window.location.href : ""}`;
  const gallery = r.gallery?.length ? r.gallery : [r.heroImage].filter(Boolean) as string[];

  return (
    <article>
      <section className="relative">
        <SmartImage src={r.heroImage} alt={r.name} label={r.city} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/restaurantes" label="Restaurantes" />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{r.neighborhood || r.city}</p>
                {r.category && <Pill icon="Utensils">{categoryLabel[r.category]}</Pill>}
                {r.michelin && <Pill icon="Star">{r.michelin}</Pill>}
                {r.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{r.name}</h1>
              {r.chef && <p className="mt-2 font-serif text-lg font-light italic text-cream/80">{r.chef}</p>}
            </div>
            {r.qimoScores?.overall && (
              <div className="rounded-[8px] bg-cream/95 px-5 py-4 text-center text-petrol-800">
                <p className="font-sans text-[10px] uppercase tracking-wide2 text-muted">Nota QIMO</p>
                <p className="font-serif text-4xl font-light">{r.qimoScores.overall.toFixed(1)}</p>
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

            <section className="grid gap-4 sm:grid-cols-2">
              <DetailBlock title="Informações práticas">
                <div className="space-y-1">
                  <Spec icon="Clock" label="Dias" value={r.days} />
                  <Spec icon="Clock" label="Horários" value={r.hours} />
                  <Spec icon="Shirt" label="Dress code" value={r.dressCode} />
                  <Spec icon="Users" label="Crianças" value={r.practical?.children} />
                  <Spec icon="Users" label="Grupos" value={r.practical?.groups} />
                  <Spec icon="Check" label="Menu vegetariano" value={r.practical?.vegetarian} />
                  <Spec icon="ShieldCheck" label="Acessibilidade" value={r.practical?.accessibility} />
                </div>
              </DetailBlock>
              <DetailBlock title="Validade das informações">
                <div className="space-y-1">
                  <Spec icon="CalendarCheck" label="Última verificação" value={r.lastVerified} />
                  <Spec icon="Info" label="Status" value={r.practical?.status} />
                  <Spec icon="Ticket" label="Reserva" value={r.practical?.reservationStatus} />
                  <Spec icon="Globe" label="Fonte principal" value={r.sourcePrimary} />
                </div>
              </DetailBlock>
            </section>

            <section className="rounded-[8px] border bg-petrol-600 p-6 text-cream" style={{ borderColor: "var(--line)" }}>
              <p className="kicker text-gold-soft">Dica do Sommelier</p>
              <p className="mt-3 font-serif text-xl font-light leading-relaxed">{r.sommelierTip || "Informação não divulgada oficialmente."}</p>
            </section>

            {r.qimoScores && (
              <section>
                <h2 className="display text-3xl">Avaliação editorial QIMO</h2>
                <p className="mt-2 font-sans text-[13px] text-muted">Notas editoriais de 0 a 10. Não representam avaliações de usuários ou plataformas externas.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <ScoreBar label="Gastronomia" value={r.qimoScores.gastronomy} />
                  <ScoreBar label="Carta de vinhos" value={r.qimoScores.wine} />
                  <ScoreBar label="Ambiente" value={r.qimoScores.ambience} />
                  <ScoreBar label="Atendimento" value={r.qimoScores.service} />
                  <ScoreBar label="Localização" value={r.qimoScores.location} />
                  <ScoreBar label="Exclusividade" value={r.qimoScores.exclusivity} />
                  <ScoreBar label="Custo-benefício" value={r.qimoScores.value} />
                  <ScoreBar label="Facilidade de reserva" value={r.qimoScores.bookingEase} />
                </div>
              </section>
            )}

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
