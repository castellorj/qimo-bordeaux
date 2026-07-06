import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Pill } from "@/components/ui";
import { itinerary, cities, wineries } from "@/content";
import { weekday, dayMonth } from "@/lib/format";
import type { ActivityType, Day } from "@/lib/types";

export const metadata: Metadata = { title: "Programação" };

const TYPE_ICON: Record<ActivityType, string> = {
  transfer: "Car", lecture: "BookOpen", tasting: "Wine", winery: "Grape",
  active: "Bike", entertainment: "Music", meal: "UtensilsCrossed",
  walk: "Compass", experience: "Sparkles", leisure: "Sunset",
};

const DEFAULT_IMAGES = [
  "/photos/hero-bordeaux.jpg", "/photos/hero-saint-emilion.jpg", "/photos/hero-medoc.jpg",
  "/photos/hero-dordogne-sunset.jpg", "/photos/hero-vignoble.jpg", "/photos/hero-margaux.jpg",
  "/photos/hero-lafite.jpg",
];

// Foto representativa do dia: heroImage do dia → cidade → vinícola vinculada → padrão.
function dayImage(day: Day, idx: number): string {
  if (day.heroImage) return day.heroImage;
  const city = day.activities.find((a) => a.linkedCity)?.linkedCity;
  if (city) { const c = cities.find((x) => x.slug === city); if (c?.heroImage) return c.heroImage; }
  const win = day.activities.find((a) => a.linkedWinery)?.linkedWinery;
  if (win) { const w = wineries.find((x) => x.slug === win); if (w?.heroImage) return w.heroImage; }
  return DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length];
}

export default function ProgramacaoPage() {
  return (
    <>
      <PageHero section="programacao" small bgImage="/photos/hero-dordogne-sunset.jpg" />

      {/* Índice de dias */}
      <nav className="sticky top-16 z-30 border-b backdrop-blur-md" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
        <div className="no-scrollbar container-editorial flex gap-2 overflow-x-auto py-3">
          {itinerary.map((d) => (
            <a key={d.n} href={`#dia-${d.n}`} className="shrink-0 rounded-full border px-4 py-1.5 font-sans text-[12px] transition-colors hover:border-gold hover:text-gold" style={{ borderColor: "var(--line)" }}>
              Dia {d.n}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-editorial space-y-16 py-10">
        {itinerary.map((day, idx) => (
          <section key={day.n} id={`dia-${day.n}`} className="scroll-mt-32">
            {/* Banner fotográfico do dia */}
            <div className="relative overflow-hidden rounded-[20px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dayImage(day, idx)} alt={day.title} className="aspect-[16/10] w-full object-cover sm:aspect-[21/8]" />
              <div className="scrim-bottom absolute inset-0" />
              <div className="text-on-photo absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="flex items-end gap-3">
                  <span className="font-serif text-5xl font-light leading-none text-gold-soft sm:text-6xl">{String(day.n).padStart(2, "0")}</span>
                  <div className="pb-1">
                    <p className="font-sans text-[11px] uppercase tracking-luxe text-cream/85">{weekday(day.date)} · {dayMonth(day.date)}</p>
                    <h2 className="display text-3xl leading-tight text-cream sm:text-4xl">{day.title}</h2>
                  </div>
                </div>
                {day.subtitle && <p className="mt-2 max-w-xl font-serif text-[15px] font-light italic text-cream/85">{day.subtitle}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {day.ports.map((p) => <Pill key={p} icon="MapPin">{p}</Pill>)}
                </div>
              </div>
            </div>

            {day.note && (
              <p className="mt-6 border-l-2 pl-4 font-serif text-lg font-light italic text-muted" style={{ borderColor: "var(--gold)" }}>{day.note}</p>
            )}

            {/* Atividades */}
            <ol className="mt-6 space-y-3">
              {day.activities.map((a) => (
                <li key={a.id} className="card card-hover group p-5">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border text-gold" style={{ borderColor: "var(--line)" }}>
                      <Icon name={TYPE_ICON[a.type]} size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {a.time && <span className="font-sans text-[12px] font-medium tabular-nums text-gold">{a.time}</span>}
                          <h3 className="font-serif text-xl font-light leading-snug">{a.title}</h3>
                        </div>
                        <FavoriteButton id={`act:${a.id}`} />
                      </div>
                      {a.description && <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{a.description}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {a.qimoSelect && <QimoSeal />}
                        {a.location && <Pill icon="MapPin">{a.location}</Pill>}
                        {a.capacity && <Pill icon="Users">até {a.capacity}</Pill>}
                        {a.linkedWinery && <Link href={`/vinicolas/${a.linkedWinery}`} className="chip hover:text-gold"><Icon name="Grape" size={13} /> Ver vinícola</Link>}
                        {a.linkedCity && <Link href={`/cidades/${a.linkedCity}`} className="chip hover:text-gold"><Icon name="Landmark" size={13} /> Ver cidade</Link>}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* Secundário: agenda do navio + traje */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[12px] border p-4" style={{ borderColor: "var(--line)" }}>
                <p className="kicker-muted flex items-center gap-1.5"><Icon name="Ship" size={13} /> Agenda do navio</p>
                <ul className="mt-2.5 space-y-1.5">
                  {day.ship.map((s, i) => (
                    <li key={i} className="flex items-center justify-between font-sans text-[12px]">
                      <span>{s.city}</span>
                      <span className="tabular-nums text-muted">
                        {s.eta && s.eta !== "overnight" ? `⚓ ${s.eta}` : s.eta === "overnight" ? "pernoite" : ""}
                        {s.etd && s.etd !== "overnight" ? ` → ${s.etd}` : s.etd === "overnight" ? " · pernoite" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {day.dressCode && (
                <div className="flex items-start gap-2 rounded-[12px] border p-4 font-sans text-[13px] text-muted" style={{ borderColor: "var(--line)" }}>
                  <Icon name="Shirt" size={15} className="mt-0.5 shrink-0 text-gold" />
                  <span>{day.dressCode}</span>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
