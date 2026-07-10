"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fullDate, weekday } from "@/lib/format";
import { Icon } from "./Icon";
import { useGuideList } from "./GuideContent";
import type { Day } from "@/lib/types";

interface Flat {
  dayN: number;
  date: string;
  start: number;
  time: string | null;
  title: string;
  location?: string;
}

function flatten(itinerary: Day[]): Flat[] {
  const out: Flat[] = [];
  itinerary.forEach((d) => {
    d.activities.forEach((a) => {
      const hhmm = a.time?.split("–")[0]?.trim();
      const [h, m] = hhmm ? hhmm.split(":").map(Number) : [9, 0];
      const [y, mo, da] = d.date.split("-").map(Number);
      const start = new Date(y, mo - 1, da, h || 9, m || 0).getTime();
      out.push({ dayN: d.n, date: d.date, start, time: a.time ?? null, title: a.title, location: a.location });
    });
  });
  return out.sort((a, b) => a.start - b.start);
}

export function NextActivity() {
  const itinerary = useGuideList<Day>("day");
  const [next, setNext] = useState<Flat | null>(null);
  const [upcoming, setUpcoming] = useState(true);

  useEffect(() => {
    const all = flatten(itinerary);
    const now = Date.now();
    const n = all.find((a) => a.start > now);
    if (n) {
      setNext(n);
      setUpcoming(true);
    } else {
      setNext(all[all.length - 1] ?? null);
      setUpcoming(false);
    }
  }, [itinerary]);

  if (!next) return null;

  return (
    <Link
      href={`/programacao#dia-${next.dayN}`}
      className="card card-hover block p-5 text-left"
    >
      <div className="flex items-center justify-between">
        <p className="kicker">{upcoming ? "Próxima experiência" : "Última experiência"}</p>
        <Icon name="ArrowUpRight" size={16} className="text-gold" />
      </div>
      <p className="mt-3 font-serif text-xl font-light leading-snug">{next.title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="CalendarDays" size={13} /> Dia {next.dayN} · {weekday(next.date)}
        </span>
        {next.time && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="Clock" size={13} /> {next.time}
          </span>
        )}
        {next.location && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="MapPin" size={13} /> {next.location}
          </span>
        )}
      </div>
    </Link>
  );
}
