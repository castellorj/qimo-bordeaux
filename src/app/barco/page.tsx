"use client";

import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SmartImage } from "@/components/SmartImage";
import { Icon } from "@/components/Icon";
import { Pill } from "@/components/ui";
import { useLocale } from "@/components/providers";
import { useGuideItem } from "@/components/GuideContent";
import { ActionBar } from "@/components/ActionBar";
import { qimoWhatsApp } from "@/lib/reserve";
import { ship as fileShip, itinerary, TRIP } from "@/content";

const onboard = itinerary.flatMap((d) =>
  d.activities
    .filter((a) => a.type === "entertainment" || a.type === "lecture")
    .map((a) => ({ ...a, dayN: d.n }))
);

export default function BarcoPage() {
  const { t, cfg } = useLocale();
  // Navio editável no painel (aba Fichas → Navio); cai no arquivo enquanto não editado.
  const ship = (useGuideItem<any>("ship", "ss-bon-voyage") ?? fileShip) as typeof fileShip;
  const img = (key: string, def: string) => cfg(key)?.trim() || def;

  return (
    <>
      <PageHero kicker={t("ship.kicker")} title="O Navio" intro={`${ship.name} · ${ship.tagline}`} />

      <div className="container-editorial py-14">
        {/* Retrato + introdução */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="card overflow-hidden">
            <SmartImage src={img("img.barco.exterior", "/photos/ship-exterior.jpg")} alt={ship.name} label={ship.name} ratio="aspect-[4/3]" priority />
          </div>
          <div>
            <p className="kicker">{t("ship.aboard")}</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">{ship.name}</h2>
            <div className="gold-rule mt-5" />
            <p className="prose-luxe mt-5">{ship.intro}</p>
          </div>
        </div>

        {/* Números */}
        <div className="mt-14 grid grid-cols-2 gap-y-8 border-y py-10 sm:grid-cols-4" style={{ borderColor: "var(--line)" }}>
          {ship.stats.map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-serif text-5xl font-light text-gold">{s.n}</p>
              <p className="mt-2 kicker-muted">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Ficha rápida */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ship.facts.map((f) => (
            <div key={f.label} className="card p-5">
              <p className="kicker-muted">{f.label}</p>
              <p className="mt-1.5 font-sans text-[14px]" style={{ color: "var(--text)" }}>{f.value}</p>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <section className="mt-16">
          <h2 className="display text-2xl sm:text-3xl">{t("ship.life")}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ship.highlights.map((h) => (
              <div key={h.title} className="card p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full border text-gold" style={{ borderColor: "var(--line)" }}>
                  <Icon name={h.icon} size={20} />
                </span>
                <h3 className="mt-4 font-serif text-xl font-light">{h.title}</h3>
                <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{h.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* No-Wallet Trip — tudo incluído */}
        <section id="incluido" className="mt-16 scroll-mt-24 rounded-[3px] border p-8 sm:p-10" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <div className="text-center">
            <span className="seal-qimo">{ship.included.tag}</span>
            <h2 className="display mt-4 text-2xl sm:text-3xl">{t("inc.title")}</h2>
            <p className="prose-luxe mx-auto mt-3 max-w-xl">{t("inc.subtitle")}</p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {ship.included.categories.map((cat) => (
              <div key={cat.titleKey}>
                <div className="flex items-center gap-2.5 border-b pb-3" style={{ borderColor: "var(--line)" }}>
                  <Icon name={cat.icon} size={18} className="text-gold" />
                  <h3 className="font-sans text-[12px] font-semibold uppercase tracking-wide2 text-gold">
                    {t(cat.titleKey)}
                  </h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {cat.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2.5 font-sans text-[13px] leading-relaxed text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {it}
                    </li>
                  ))}
                </ul>

                {"spirits" in cat && cat.spirits && (
                  <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                    <p className="kicker-muted flex items-center gap-1.5">
                      <Icon name="Martini" size={12} /> {t("inc.bar")}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {cat.spirits.map((s) => (
                        <span key={s} className="rounded-full border px-2.5 py-1 font-sans text-[11px] text-muted" style={{ borderColor: "var(--line)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Gastronomia */}
        <section className="mt-16">
          <div className="flex items-center gap-3">
            <Icon name="UtensilsCrossed" size={20} className="text-gold" />
            <h2 className="display text-2xl sm:text-3xl">{t("ship.dining")}</h2>
          </div>
          <div className="relative mt-6 h-48 overflow-hidden rounded-[3px] sm:h-60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img("img.barco.dining", "/photos/ship-dining.jpg")} alt="Gastronomia a bordo" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/50 to-transparent" />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {ship.dining.map((v) => (
              <div key={v.name} className="card p-6">
                <h3 className="font-serif text-xl font-light text-gold">{v.name}</h3>
                <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Suítes */}
        <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="kicker">{t("ship.accommodations")}</p>
            <h2 className="display mt-3 text-2xl sm:text-3xl">{ship.suites.title}</h2>
            <div className="gold-rule mt-5" />
            <p className="prose-luxe mt-5">{ship.suites.text}</p>
            <div className="mt-6 space-y-3">
              {ship.suitesList.map((s) => (
                <div key={s.name} className="flex items-start justify-between gap-4 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                  <div>
                    <p className="font-serif text-lg font-light">{s.name}</p>
                    <p className="font-sans text-[12px] text-muted">{s.note}</p>
                  </div>
                  <span className="shrink-0 font-sans text-[12px] text-gold">{s.size}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card overflow-hidden">
            <SmartImage src={img("img.barco.suite", "/photos/ship-suite.jpg")} alt="Suíte" label={ship.suites.title} ratio="aspect-[16/10]" />
          </div>
        </section>

        {/* Momentos a bordo */}
        {onboard.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3">
              <Icon name="Music" size={20} className="text-gold" />
              <h2 className="display text-2xl sm:text-3xl">{t("ship.moments")}</h2>
            </div>
            <p className="mt-2 font-sans text-[13px] text-muted">{t("ship.momentsText")}</p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {onboard.map((a) => (
                <Link key={a.id} href={`/programacao#dia-${a.dayN}`} className="card card-hover flex items-center gap-4 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-gold" style={{ borderColor: "var(--line)" }}>
                    <Icon name={a.type === "lecture" ? "BookOpen" : "Music"} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg font-light leading-tight">{a.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 font-sans text-[12px] text-muted">
                      <span>{t("day")} {a.dayN}</span>
                      {a.time && <span>· {a.time}</span>}
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ficha & nota */}
        <section className="mt-16 rounded-[3px] border p-8 sm:p-10" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <div className="flex flex-wrap items-center gap-4">
            <Pill icon="Ship">{ship.name}</Pill>
            <Pill icon="CalendarDays">{`${TRIP.nights} noites`}</Pill>
            <Pill icon="Anchor">Bordeaux · Gironde · Dordogne</Pill>
          </div>
          <p className="mt-5 font-sans text-[13px] italic leading-relaxed text-muted">{ship.note}</p>
          <div className="mt-6 max-w-md">
            <ActionBar
              actions={[
                { kind: "reserve", href: qimoWhatsApp("Olá! Gostaria de falar sobre a viagem a bordo do SS Bon Voyage."), labelKey: "act.reserveQimo", icon: "MessageCircle", primary: true, external: true },
                { kind: "site", href: "https://www.uniworld.com/us/ships/ss-bon-voyage", labelKey: "act.site", icon: "Globe", external: true },
              ]}
              conciergeNote
            />
          </div>
          <Link href="/programacao" className="mt-6 inline-flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-wide2 text-petrol-600 hover:text-petrol-500">
            {t("fullItinerary")} <Icon name="ArrowRight" size={14} />
          </Link>
        </section>
      </div>
    </>
  );
}
