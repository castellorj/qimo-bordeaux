"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { QimoSeal, Pill } from "@/components/ui";
import { ActionBar } from "@/components/ActionBar";
import { restaurantActions, qimoWhatsApp } from "@/lib/reserve";
import { useGuideItem, useGuideLoading } from "@/components/GuideContent";
import type { Restaurant } from "@/lib/types";

const categoryLabel: Record<string, string> = {
  michelin: "Alta gastronomia",
  bistro: "Bistrô",
  "wine-bar": "Wine bar",
  contemporary: "Contemporâneo",
};

function paragraphize(text?: string) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    groups.push(sentences.slice(i, i + 2).join(" ").trim());
  }
  return groups.slice(0, 3);
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-[8px] border bg-white/65 p-4" style={{ borderColor: "var(--line)" }}>
      <Icon name={icon} size={17} className="text-gold-deep" />
      <p className="mt-3 font-sans text-[10px] uppercase tracking-wide2 text-muted">{label}</p>
      <p className="mt-1 font-sans text-[14px] leading-snug text-foreground">{value}</p>
    </div>
  );
}

function Highlight({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[8px] border bg-cream px-4 py-3" style={{ borderColor: "var(--line)" }}>
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep">
        <Icon name="Check" size={14} />
      </span>
      <p className="font-sans text-[14px] leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

export function RestaurantView({ slug }: { slug: string }) {
  const r = useGuideItem<Restaurant>("restaurant", slug);
  const loading = useGuideLoading();
  if (loading) return <div className="container-editorial py-20 text-center text-muted">Carregando...</div>;
  if (!r) return <div className="container-editorial py-20 text-center text-muted">Restaurante não encontrado.</div>;

  const hasPublishedChef = r.chef && !/n[aã]o divulgado/i.test(r.chef);
  const category = r.category ? categoryLabel[r.category] : "Restaurante";
  const intro = r.bestFor || r.specialty || category;
  const paragraphs = paragraphize(r.description);
  const highlights = (r.highlights?.length ? r.highlights : [r.specialty, r.bestFor, r.michelin || r.stars].filter(Boolean) as string[]).slice(0, 3);
  const shareText = `Veja ${r.name} no Guia QIMO Bordeaux: ${typeof window !== "undefined" ? window.location.href : ""}`;

  return (
    <article>
      <section className="relative bg-petrol-950">
        <SmartImage src={r.heroImage} alt={r.name} label={r.city} ratio="aspect-[16/10] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,24,26,.46)_0%,rgba(10,24,26,.22)_38%,rgba(10,24,26,.88)_100%)]" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-7 [text-shadow:0_2px_16px_rgba(0,0,0,.7)]">
          <Link href="/restaurantes" className="mb-5 inline-flex rounded-full bg-petrol-950/45 px-3.5 py-2 font-sans text-[11px] font-semibold uppercase tracking-luxe text-gold-soft backdrop-blur-md">
            Voltar
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Pill icon="Utensils">{category}</Pill>
            {r.michelin && <Pill icon="Star">{r.michelin}</Pill>}
            {r.qimoSelect && <QimoSeal />}
          </div>
          <h1 className="display mt-4 text-4xl leading-[1] text-cream sm:text-6xl">{r.name}</h1>
          {hasPublishedChef && <p className="mt-3 max-w-2xl font-serif text-lg font-light italic text-cream/90">{r.chef}</p>}
        </div>
      </section>

      <div className="container-editorial py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-8">
            <section className="rounded-[8px] border bg-white/60 p-6 sm:p-8" style={{ borderColor: "var(--line)" }}>
              <p className="kicker text-gold-deep">{r.neighborhood || r.city}</p>
              <h2 className="mt-3 font-serif text-3xl font-light leading-tight text-foreground sm:text-4xl">{intro}</h2>
              <div className="mt-6 space-y-4">
                {paragraphs.map((text) => (
                  <p key={text} className="font-sans text-[15px] leading-relaxed text-muted sm:text-[16px]">{text}</p>
                ))}
              </div>
            </section>

            {highlights.length > 0 && (
              <section>
                <h2 className="kicker mb-4 text-gold-deep">Por que vale ir</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {highlights.map((item) => <Highlight key={item} text={item} />)}
                </div>
              </section>
            )}

            <section className="grid gap-3 sm:grid-cols-3">
              <InfoCard icon="Wallet" label="Valor" value={r.averageTicket || r.priceBand} />
              <InfoCard icon="Clock" label="Tempo ideal" value={r.duration} />
              <InfoCard icon="Sparkles" label="Melhor para" value={r.bestFor} />
            </section>

            {(r.sommelierTip || r.qimoNote) && (
              <section className="rounded-[8px] bg-petrol-600 p-6 text-cream sm:p-8">
                <p className="kicker text-gold-soft">{r.sommelierTip ? "Dica do sommelier" : "Nota QIMO"}</p>
                <p className="mt-3 font-serif text-xl font-light leading-relaxed">{r.sommelierTip || r.qimoNote}</p>
              </section>
            )}
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <h3 className="kicker">Reservar</h3>
              <p className="mt-3 font-sans text-[14px] leading-relaxed text-muted">
                {r.reservationAdvice || (r.reservationRequired ? "Reserva recomendada." : "Consulte disponibilidade antes de ir.")}
              </p>
              <div className="mt-5">
                <ActionBar actions={restaurantActions(r)} channelLabel={r.bookingChannel} />
              </div>
              <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                <InfoCard icon="MapPin" label="Bairro" value={r.neighborhood || r.city} />
                <InfoCard icon="Shirt" label="Traje" value={r.dressCode} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={qimoWhatsApp(`Quero salvar ${r.name} para minha viagem a Bordeaux.`)} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-2 text-[12px]">
                  <Icon name="Heart" size={14} /> Favorito
                </a>
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-2 text-[12px]">
                  <Icon name="MessageCircle" size={14} /> Enviar
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
