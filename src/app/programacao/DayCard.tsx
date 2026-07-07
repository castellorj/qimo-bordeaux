"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { FavoriteButton, QimoSeal } from "@/components/ui";
import { weekday, dayMonth } from "@/lib/format";
import type { ActivityType, Day } from "@/lib/types";

const TYPE_ICON: Record<ActivityType, string> = {
  transfer: "Car", lecture: "BookOpen", tasting: "Wine", winery: "Grape",
  active: "Bike", entertainment: "Music", meal: "UtensilsCrossed",
  walk: "Compass", experience: "Sparkles", leisure: "Sunset",
};

export function DayCard({ day, img, priority = false }: { day: Day; img: string; priority?: boolean }) {
  const [open, setOpen] = useState(false);
  const nAtiv = day.activities.length;

  return (
    <section id={`dia-${day.n}`} className="scroll-mt-32">
      {/* Banner fotográfico — clicar abre/fecha os detalhes */}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="block w-full overflow-hidden rounded-[20px] text-left">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={day.title} loading={priority ? undefined : "lazy"} decoding="async"
            className="animate-ken-burns aspect-[16/10] w-full object-cover sm:aspect-[21/8]" />
          <div className="scrim-strong absolute inset-0" />

          <span className="chip-on-photo absolute right-4 top-4 z-10 font-medium uppercase tracking-wide2">
            {open ? "Ocultar" : "+ Detalhes"}
            <Icon name="ChevronDown" size={13} className={open ? "rotate-180" : ""} />
          </span>

          <div className="text-on-photo absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="flex items-end gap-3">
              <span className="font-serif text-5xl font-light leading-none text-gold-soft sm:text-6xl">{String(day.n).padStart(2, "0")}</span>
              <div className="pb-1">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-cream/90">{weekday(day.date)} · {dayMonth(day.date)}</p>
                <h2 className="display text-3xl leading-tight text-cream sm:text-4xl">{day.title}</h2>
              </div>
            </div>
            {day.subtitle && <p className="mt-2 max-w-xl font-serif text-[15px] font-light italic text-cream/90">{day.subtitle}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {day.ports.map((p) => (
                <span key={p} className="chip-on-photo"><Icon name="MapPin" size={13} /> {p}</span>
              ))}
            </div>
          </div>
        </div>
      </button>

      {/* Detalhes (colapsáveis) */}
      {open ? (
        <div className="animate-fade-up">
          {day.note && (
            <p className="mt-6 border-l-2 pl-4 font-serif text-lg font-light italic text-muted" style={{ borderColor: "var(--gold)" }}>{day.note}</p>
          )}

          <ol className="mt-6 space-y-3">
            {day.activities.map((a) => (
              <li key={a.id} className="card p-5">
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
                      {a.location && <span className="chip">{a.location}</span>}
                      {a.capacity && <span className="chip">até {a.capacity}</span>}
                      {a.linkedWinery && <Link href={`/vinicolas/${a.linkedWinery}`} className="chip hover:text-gold"><Icon name="Grape" size={13} /> Ver vinícola</Link>}
                      {a.linkedCity && <Link href={`/cidades/${a.linkedCity}`} className="chip hover:text-gold"><Icon name="Landmark" size={13} /> Ver cidade</Link>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

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
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border py-3 font-sans text-[12px] uppercase tracking-wide2 text-petrol-600 transition-colors hover:border-gold" style={{ borderColor: "var(--line)" }}>
          Ver programação do dia · {nAtiv} {nAtiv === 1 ? "atividade" : "atividades"}
          <Icon name="ChevronDown" size={14} />
        </button>
      )}
    </section>
  );
}
