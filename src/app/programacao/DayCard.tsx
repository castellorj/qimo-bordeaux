"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { QimoSeal } from "@/components/ui";
import { ActivityReserve } from "@/components/ActivityReserve";
import { PhotoImg } from "@/components/PhotoImg";
import { useLocale } from "@/components/providers";
import { weekday, dayMonth } from "@/lib/format";
import type { Activity, ActivityType, Day } from "@/lib/types";

const TYPE_ICON: Record<ActivityType, string> = {
  transfer: "Car", lecture: "BookOpen", tasting: "Wine", winery: "Grape",
  active: "Bike", entertainment: "Music", meal: "UtensilsCrossed",
  walk: "Compass", experience: "Sparkles", leisure: "Sunset",
};

function activityTimeKey(activity: Activity) {
  return activity.time?.trim() || `sem-horario-${activity.id}`;
}

function groupActivities(activities: Activity[]) {
  const groups: Array<{ key: string; time?: string | null; items: Activity[] }> = [];
  activities.forEach((activity) => {
    const key = activityTimeKey(activity);
    const group = groups.find((g) => g.key === key);
    if (group) group.items.push(activity);
    else groups.push({ key, time: activity.time, items: [activity] });
  });
  return groups;
}

function isOnBoardActivity(activity: Activity) {
  const text = `${activity.title} ${activity.description || ""}`.toLowerCase();
  return !activity.location || text.includes("a bordo") || text.includes("navio");
}

export function DayCard({ day, img, priority = false }: { day: Day; img: string; priority?: boolean }) {
  const { t, cfg } = useLocale();
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const nAtiv = day.activities.length;

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const actKey = nAtiv === 1 ? "prog.activity" : "prog.activities";
  const rawWord = cfg(actKey);
  const countWord = rawWord !== undefined ? rawWord : t(actKey);
  const countSuffix = countWord.trim() ? ` · ${nAtiv} ${countWord}` : "";
  const activityGroups = groupActivities(day.activities);

  return (
    <section ref={sectionRef} id={`dia-${day.n}`} className="scroll-mt-32">
      <button type="button" onClick={() => (open ? close() : setOpen(true))} aria-expanded={open}
        className="block w-full overflow-hidden rounded-[20px] text-left shadow-card">
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[21/9]">
          <PhotoImg src={img} alt={day.title} priority={priority} sizes="(min-width:768px) 720px, 100vw"
            className="animate-ken-burns absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: "rgba(20,7,11,0.38)" }} />
          <div className="scrim-strong absolute inset-0" />

          <div className="absolute inset-x-0 bottom-0 p-6 pb-7 sm:p-8 sm:pb-8" style={{ textShadow: "0 1px 18px rgba(12,4,7,.85), 0 1px 3px rgba(12,4,7,.7)" }}>
            <div className="flex items-end gap-3">
              <span className="font-serif text-5xl font-light leading-none text-gold-soft sm:text-6xl">{String(day.n).padStart(2, "0")}</span>
              <div className="pb-1">
                <p className="font-sans text-[11px] uppercase tracking-luxe text-cream">{weekday(day.date)} · {dayMonth(day.date)}</p>
                <h2 className="display text-3xl leading-tight text-cream sm:text-4xl">{day.title}</h2>
              </div>
            </div>
            {day.subtitle && <p className="mt-2 max-w-xl font-serif text-[15px] font-light italic text-cream/95">{day.subtitle}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {day.ports.map((p) => (
                <span key={p} className="chip-on-photo"><Icon name="MapPin" size={13} /> {p}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 border-t bg-petrol-600 px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-cream shadow-[inset_0_1px_0_rgba(255,255,255,.16)]" style={{ borderColor: "rgba(255,255,255,.18)" }}>
          {open ? t("prog.hideDay") : `Programação${countSuffix}`}
          <Icon name="ChevronDown" size={15} className={open ? "rotate-180" : ""} />
        </div>
      </button>

      {open && (
        <div className="animate-fade-up">
          {day.note && (
            <p className="mt-6 border-l-2 pl-4 font-serif text-lg font-light italic text-muted" style={{ borderColor: "var(--gold)" }}>{day.note}</p>
          )}

          <ol className="relative mt-6 pl-1">
            <div className="absolute bottom-6 left-[21px] top-4 w-px" style={{ background: "linear-gradient(to bottom, color-mix(in srgb, var(--gold) 55%, transparent), color-mix(in srgb, var(--gold) 20%, transparent))" }} />
            {activityGroups.map((group) => {
              const isChoice = group.items.length > 1 && !!group.time;
              return (
                <li key={group.key} className="relative flex gap-4 pb-4 last:pb-0">
                  <span className="relative z-10 mt-1 grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-petrol-600 text-cream shadow-card">
                    <Icon name={isChoice ? "ListChecks" : TYPE_ICON[group.items[0].type]} size={18} />
                  </span>
                  <div className={isChoice ? "min-w-0 flex-1 rounded-[14px] border p-3" : "min-w-0 flex-1"} style={isChoice ? { borderColor: "var(--gold)", background: "color-mix(in srgb, var(--gold) 8%, transparent)" } : undefined}>
                    {isChoice && (
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                        <div>
                          <p className="font-sans text-[13px] font-semibold tabular-nums text-gold-deep">{group.time}</p>
                          <p className="font-sans text-[11px] uppercase tracking-wide2 text-muted">Escolha 1 opção neste horário</p>
                        </div>
                        <span className="rounded-full bg-petrol-600 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-cream">
                          {group.items.length} opções
                        </span>
                      </div>
                    )}
                    <div className={isChoice ? "space-y-3" : ""}>
                      {group.items.map((a, index) => {
                        const onBoard = isOnBoardActivity(a);
                        return (
                        <div
                          key={a.id}
                          className={`card p-4 ${onBoard ? "border-l-4 bg-petrol-600/[0.035]" : ""}`}
                          style={onBoard ? { borderLeftColor: "var(--gold)" } : undefined}
                        >
                          <div className="min-w-0">
                            {a.time && !isChoice && <span className="font-sans text-[13px] font-semibold tabular-nums text-gold-deep">{a.time}</span>}
                            {isChoice && <span className="mb-1 inline-flex rounded-full bg-black/[0.04] px-2 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide2 text-muted">Opção {index + 1}</span>}
                            <h3 className="font-serif text-xl font-light leading-snug">{a.title}</h3>
                          </div>
                          {a.description && <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">{a.description}</p>}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {onBoard && <span className="chip border-gold/50 bg-gold/10 text-gold-deep"><Icon name="Ship" size={13} /> A bordo</span>}
                            {a.qimoSelect && <QimoSeal />}
                            {a.location && <span className="chip">{a.location}</span>}
                            {a.linkedWinery && <Link href={`/vinicolas/${a.linkedWinery}`} className="chip hover:text-gold"><Icon name="Grape" size={13} /> Ver vinícola</Link>}
                            {a.linkedCity && <Link href={`/cidades/${a.linkedCity}`} className="chip hover:text-gold"><Icon name="Landmark" size={13} /> Ver cidade</Link>}
                          </div>
                          <ActivityReserve contentKey={a.id} />
                        </div>
                      );})}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 rounded-[12px] border p-4" style={{ borderColor: "var(--line)" }}>
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

          <button type="button" onClick={close}
            className="btn-ghost mt-4 w-full !rounded-[12px] !border-2 !px-4 !py-2.5 !tracking-wide text-[12px]">
            <Icon name="ChevronDown" size={15} className="rotate-180" /> {t("prog.hideDay")}
          </button>
        </div>
      )}
    </section>
  );
}
