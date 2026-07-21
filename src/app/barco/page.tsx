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
import { cleanSiteImage } from "@/lib/siteImages";
import { ship as fileShip, itinerary } from "@/content";

const onboard = itinerary.flatMap((d) =>
  d.activities
    .filter((a) => a.type === "entertainment" || a.type === "lecture")
    .map((a) => ({ ...a, dayN: d.n }))
);

const routeStops = [
  { day: "Dia 1", place: "Bordeaux", note: "Embarque", x: 42, y: 52, align: "right" },
  { day: "Dia 2", place: "Pauillac", note: "Medoc", x: 48, y: 20, align: "right" },
  { day: "Dia 3", place: "Cadillac", note: "Sauternes", x: 50, y: 78, align: "right" },
  { day: "Dia 4", place: "Blaye", note: "Estuario", x: 55, y: 32, align: "left" },
  { day: "Dia 4", place: "Bourg-sur-Gironde", note: "Dordogne", x: 61, y: 43, align: "left" },
  { day: "Dia 5", place: "Libourne", note: "Saint-Emilion", x: 72, y: 55, align: "left" },
  { day: "Dia 7", place: "Bordeaux", note: "Retorno", x: 42, y: 52, align: "right" },
];

export default function BarcoPage() {
  const { t, cfg, settingsReady } = useLocale();
  // Navio editável no painel (aba Fichas → Navio); cai no arquivo enquanto não editado.
  const ship = (useGuideItem<any>("ship", "ss-bon-voyage") ?? fileShip) as typeof fileShip;
  const img = (key: string, def: string) => cleanSiteImage(cfg(key)) || (settingsReady ? cleanSiteImage(def) : undefined);
  const shipGallery = Array.isArray((ship as any).gallery) ? ((ship as any).gallery.filter(Boolean) as string[]) : [];
  const moreInfoItems = Array.isArray((ship as any).moreInfoItems) ? ((ship as any).moreInfoItems.filter(Boolean) as string[]) : [];

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

        {/* Rota do cruzeiro */}
        <section className="mt-16 overflow-hidden rounded-[3px] border" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.35fr]">
            <div className="border-b p-7 sm:p-9 lg:border-b-0 lg:border-r" style={{ borderColor: "var(--line)" }}>
              <p className="kicker">Mapa da rota</p>
              <h2 className="display mt-3 text-2xl sm:text-3xl">Bordeaux pelo rio</h2>
              <div className="gold-rule mt-5" />
              <p className="prose-luxe mt-5">
                Uma leitura redesenhada do percurso do SS Bon Voyage pelos rios Garonne e Dordogne,
                com retorno ao estuario da Gironde e paradas-chave do roteiro QIMO.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { icon: "Navigation", title: "Garonne", text: "Bordeaux a Cadillac" },
                  { icon: "Anchor", title: "Gironde", text: "Medoc, Pauillac e Blaye" },
                  { icon: "MapPin", title: "Dordogne", text: "Bourg, Libourne e Saint-Emilion" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 rounded-[3px] border bg-white/35 p-3" style={{ borderColor: "var(--line)" }}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/12 text-gold-deep">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <div>
                      <p className="font-sans text-[12px] font-semibold uppercase tracking-wide2 text-gold">{item.title}</p>
                      <p className="font-sans text-[12px] text-muted">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden bg-[#f8f4ed] p-5 sm:p-8">
              <div className="absolute inset-0 opacity-[0.42]" style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 35%, rgba(195,168,96,0.18), transparent 24%), radial-gradient(circle at 72% 50%, rgba(54,75,68,0.10), transparent 28%)",
              }} />
              <div className="relative h-[500px] rounded-[3px] border bg-white/60 shadow-sm" style={{ borderColor: "var(--line)" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M15 16 C22 28 27 38 35 46 C42 54 47 62 49 84" fill="none" stroke="rgba(91,111,103,0.18)" strokeWidth="1.2" />
                  <path d="M49 84 C43 72 40 62 42 52 C44 40 49 30 48 20" fill="none" stroke="rgba(91,111,103,0.22)" strokeWidth="1.1" />
                  <path d="M42 52 C53 48 58 42 61 43 C66 45 68 53 73 55 C77 57 82 55 88 51" fill="none" stroke="rgba(91,111,103,0.20)" strokeWidth="1.1" />
                  <path d="M42 52 C46 46 51 39 48 20" fill="none" stroke="#9f3b50" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="0.1 1.8" />
                  <path d="M42 52 C47 63 49 72 50 78" fill="none" stroke="#9f3b50" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="0.1 1.8" />
                  <path d="M48 20 C50 27 53 31 55 32 C57 34 58 39 61 43 C65 47 67 52 72 55" fill="none" stroke="#9f3b50" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="0.1 1.8" />
                  <path d="M72 55 C65 51 55 47 42 52" fill="none" stroke="#9f3b50" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="0.1 1.8" />
                </svg>

                <span className="absolute left-[8%] top-[12%] rounded-full bg-[#cfe6ef] px-4 py-2 font-sans text-[11px] font-semibold uppercase tracking-wide2 text-petrol-600">Atlantico</span>
                <span className="absolute left-[14%] top-[42%] font-serif text-2xl italic text-muted/70">Medoc</span>
                <span className="absolute left-[64%] top-[64%] font-serif text-2xl italic text-muted/70">Dordogne</span>
                <span className="absolute left-[43%] top-[87%] font-serif text-2xl italic text-muted/70">Garonne</span>

                {routeStops.map((stop, index) => {
                  const isReturn = index === routeStops.length - 1;
                  return (
                    <div
                      key={`${stop.day}-${stop.place}-${index}`}
                      className="absolute"
                      style={{ left: `${stop.x}%`, top: `${stop.y}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <span className={isReturn ? "block h-3 w-3 rounded-full border-2 border-gold bg-petrol-600" : "block h-4 w-4 rounded-full border-2 border-white bg-[#9f3b50] shadow"} />
                      {!isReturn && (
                        <div
                          className={`absolute top-1/2 min-w-[136px] -translate-y-1/2 rounded-[3px] border bg-white/90 px-3 py-2 shadow-sm ${
                            stop.align === "right" ? "right-5 text-right" : "left-5"
                          }`}
                          style={{ borderColor: "var(--line)" }}
                        >
                          <p className="font-sans text-[10px] font-semibold uppercase tracking-wide2 text-gold">{stop.day}</p>
                          <p className="font-serif text-[18px] font-light leading-tight text-petrol-700">{stop.place}</p>
                          <p className="mt-0.5 font-sans text-[11px] text-muted">{stop.note}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="relative mt-4 flex flex-wrap gap-2 font-sans text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1.5" style={{ borderColor: "var(--line)" }}>
                  <span className="h-2 w-2 rounded-full bg-[#9f3b50]" /> Navegacao
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1.5" style={{ borderColor: "var(--line)" }}>
                  <Icon name="MapPin" size={12} className="text-gold" /> Paradas do roteiro
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1.5" style={{ borderColor: "var(--line)" }}>
                  <Icon name="Landmark" size={12} className="text-gold" /> Saint-Emilion e Blaye, areas UNESCO
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Ficha rápida */}
        {shipGallery.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-3">
              <Icon name="Images" size={20} className="text-gold" />
              <h2 className="display text-2xl sm:text-3xl">Galeria do navio</h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shipGallery.map((src, i) => (
                <div key={`${src}-${i}`} className="card overflow-hidden">
                  <SmartImage src={src} alt={`${ship.name} ${i + 1}`} ratio="aspect-[4/3]" />
                </div>
              ))}
            </div>
          </section>
        )}

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
            {img("img.barco.dining", "/photos/ship-dining.jpg") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img("img.barco.dining", "/photos/ship-dining.jpg")} alt="Gastronomia a bordo" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="photo-placeholder h-full w-full opacity-[0.18]" />
            )}
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

        {((ship as any).moreInfoTitle || (ship as any).moreInfoText || moreInfoItems.length > 0) && (
          <section className="mt-16 rounded-[3px] border p-8 sm:p-10" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
            <p className="kicker">Informacoes QIMO</p>
            {(ship as any).moreInfoTitle && <h2 className="display mt-3 text-2xl sm:text-3xl">{(ship as any).moreInfoTitle}</h2>}
            {(ship as any).moreInfoText && <p className="prose-luxe mt-5 max-w-3xl">{(ship as any).moreInfoText}</p>}
            {moreInfoItems.length > 0 && (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {moreInfoItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-[10px] border bg-white/35 p-4" style={{ borderColor: "var(--line)" }}>
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/12 text-gold-deep">
                      <Icon name="Info" size={14} />
                    </span>
                    <p className="font-sans text-[13px] leading-relaxed text-muted">{item}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Ficha & nota */}
        <section className="mt-16 rounded-[3px] border p-8 sm:p-10" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
          <div className="flex flex-wrap items-center gap-4">
            <Pill icon="Ship">{ship.name}</Pill>
            <Pill icon="CalendarDays">{t("trip.nights")}</Pill>
            <Pill icon="Anchor">{t("trip.region")}</Pill>
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
