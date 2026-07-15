"use client";

import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { QimoSeal, Crumb } from "@/components/ui";
import { ActionBar } from "@/components/ActionBar";
import { experienceActions } from "@/lib/reserve";
import { useGuideItem, useGuideLoading } from "@/components/GuideContent";
import type { Experience } from "@/lib/types";

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

export function ExperienceView({ slug }: { slug: string }) {
  const e = useGuideItem<Experience>("experience", slug);
  const loading = useGuideLoading();
  if (loading) return <div className="container-editorial py-20 text-center text-muted">Carregando...</div>;
  if (!e) return <div className="container-editorial py-20 text-center text-muted">Experiência não encontrada.</div>;

  return (
    <article>
      <section className="relative">
        <SmartImage src={e.heroImage} alt={e.name} label={e.category} ratio="aspect-[16/9] sm:aspect-[21/9]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/85 via-petrol-950/25 to-transparent" />
        <div className="text-on-photo container-editorial absolute inset-x-0 bottom-0 z-10 pb-8">
          <Crumb href="/experiencias" label="Voltar" />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-gold-soft">{e.category}</p>
                {e.qimoSelect && <QimoSeal />}
              </div>
              <h1 className="display mt-2 text-4xl text-cream sm:text-6xl">{e.name}</h1>
            </div>
          </div>
        </div>
      </section>

      <div className="container-editorial py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <p className="font-serif text-xl font-light leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{e.description}</p>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h3 className="kicker">Ficha</h3>
              <div className="mt-3">
                <Spec icon="MapPin" label="Local" value={e.location} />
                <Spec icon="Clock" label="Duração" value={e.duration} />
              </div>
              {e.relatedDay && (
                <Link href={`/programacao#dia-${e.relatedDay}`} className="chip mt-4 hover:text-gold">
                  <Icon name="CalendarDays" size={13} /> Dia {e.relatedDay}
                </Link>
              )}
              <div className="mt-6"><ActionBar actions={experienceActions(e)} conciergeNote /></div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
