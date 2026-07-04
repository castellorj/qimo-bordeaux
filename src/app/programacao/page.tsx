import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal, Pill } from "@/components/ui";
import { itinerary } from "@/content";
import { weekday, dayMonth } from "@/lib/format";
import type { ActivityType } from "@/lib/types";

export const metadata: Metadata = { title: "Programação" };

const TYPE_ICON: Record<ActivityType, string> = {
  transfer: "Car",
  lecture: "BookOpen",
  tasting: "Wine",
  winery: "Grape",
  active: "Bike",
  entertainment: "Music",
  meal: "UtensilsCrossed",
  walk: "Compass",
  experience: "Sparkles",
  leisure: "Sunset",
};

export default function ProgramacaoPage() {
  return (
    <>
      <PageHero section="programacao" />

      {/* Índice de dias */}
      <nav className="sticky top-16 z-30 border-b backdrop-blur-md" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
        <div className="no-scrollbar container-editorial flex gap-2 overflow-x-auto py-3">
          {itinerary.map((d) => (
            <a
              key={d.n}
              href={`#dia-${d.n}`}
              className="shrink-0 rounded-full border px-4 py-1.5 font-sans text-[12px] transition-colors hover:border-gold hover:text-gold"
              style={{ borderColor: "var(--line)" }}
            >
              Dia {d.n}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-editorial py-14">
        {itinerary.map((day) => (
          <section key={day.n} id={`dia-${day.n}`} className="scroll-mt-32 border-b py-12 first:pt-0 last:border-0" style={{ borderColor: "var(--line)" }}>
            <div className="grid gap-8 md:grid-cols-[220px_1fr]">
              {/* Cabeçalho do dia */}
              <div className="md:sticky md:top-32 md:self-start">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-6xl font-light leading-none text-gold">
                    {String(day.n).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-sans text-[11px] uppercase tracking-luxe text-muted">
                      {weekday(day.date)}
                    </p>
                    <p className="font-sans text-[13px]">{dayMonth(day.date)}</p>
                  </div>
                </div>
                <h2 className="display mt-4 text-2xl">{day.title}</h2>
                {day.subtitle && <p className="mt-1 font-sans text-[13px] text-muted">{day.subtitle}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {day.ports.map((p) => (
                    <Pill key={p} icon="MapPin">{p}</Pill>
                  ))}
                </div>

                {day.dressCode && (
                  <div className="mt-4 flex items-start gap-2 font-sans text-[12px] text-muted">
                    <Icon name="Shirt" size={14} className="mt-0.5 shrink-0 text-gold" />
                    <span>{day.dressCode}</span>
                  </div>
                )}

                {/* Agenda do navio */}
                <div className="mt-5 rounded-[3px] border p-4" style={{ borderColor: "var(--line)" }}>
                  <p className="kicker-muted flex items-center gap-1.5">
                    <Icon name="Ship" size={13} /> Agenda do navio
                  </p>
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
              </div>

              {/* Atividades */}
              <div>
                {day.note && (
                  <p className="mb-6 border-l-2 pl-4 font-serif text-lg font-light italic text-muted" style={{ borderColor: "var(--gold)" }}>
                    {day.note}
                  </p>
                )}
                <ol className="space-y-3">
                  {day.activities.map((a) => (
                    <li key={a.id} className="card card-hover group p-5">
                      <div className="flex items-start gap-4">
                        <span
                          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border text-gold"
                          style={{ borderColor: "var(--line)" }}
                        >
                          <Icon name={TYPE_ICON[a.type]} size={17} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              {a.time && (
                                <span className="font-sans text-[12px] font-medium tabular-nums text-gold">
                                  {a.time}
                                </span>
                              )}
                              <h3 className="font-serif text-xl font-light leading-snug">{a.title}</h3>
                            </div>
                            <FavoriteButton id={`act:${a.id}`} />
                          </div>

                          {a.description && (
                            <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">
                              {a.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {a.qimoSelect && <QimoSeal />}
                            {a.location && <Pill icon="MapPin">{a.location}</Pill>}
                            {a.capacity && <Pill icon="Users">até {a.capacity}</Pill>}
                            {a.linkedWinery && (
                              <Link href={`/vinicolas/${a.linkedWinery}`} className="chip hover:text-gold">
                                <Icon name="Grape" size={13} /> Ver vinícola
                              </Link>
                            )}
                            {a.linkedCity && (
                              <Link href={`/cidades/${a.linkedCity}`} className="chip hover:text-gold">
                                <Icon name="Landmark" size={13} /> Ver cidade
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
