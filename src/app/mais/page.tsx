"use client";

import { PageHero } from "@/components/PageHero";
import { HubGridIcons } from "@/components/Hub";
import { LangRow } from "@/components/SiteChrome";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/components/providers";
import { maisLinks } from "@/lib/nav";
import { TRIP } from "@/content";

export default function MaisPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHero section="mais" small />
      <div className="container-editorial space-y-10 py-10">
        <HubGridIcons items={maisLinks} />

        {/* Idioma */}
        <section>
          <p className="kicker mb-3 flex items-center gap-1.5">
            <Icon name="Languages" size={13} /> Idioma · Language · Idioma
          </p>
          <LangRow />
        </section>

        {/* Sobre a viagem */}
        <section className="card p-6">
          <p className="kicker">Sua viagem</p>
          <h2 className="display mt-2 text-2xl">Bordeaux Experience</h2>
          <div className="mt-4 space-y-2 font-sans text-[14px]" style={{ color: "var(--text-muted)" }}>
            <p className="flex items-center gap-2"><Icon name="Ship" size={15} className="text-gold-deep" /> {TRIP.ship}</p>
            <p className="flex items-center gap-2"><Icon name="CalendarDays" size={15} className="text-gold-deep" /> 25 out — 1 nov 2026 · {TRIP.nights} noites</p>
            <p className="flex items-center gap-2"><Icon name="Anchor" size={15} className="text-gold-deep" /> Bordeaux · Gironde · Dordogne</p>
          </div>
        </section>
      </div>
    </>
  );
}
