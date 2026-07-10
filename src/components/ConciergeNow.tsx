"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cities } from "@/content";
import { useLocale } from "./providers";
import { useGuideList } from "./GuideContent";
import type { Day } from "@/lib/types";
import { Icon } from "./Icon";
import { weekday } from "@/lib/format";

interface Flat {
  dayN: number;
  date: string;
  start: number;
  time: string | null;
  title: string;
  location?: string;
  type: string;
  dressCode?: string;
  linkedCity?: string;
}

function flatten(itinerary: Day[]): Flat[] {
  const out: Flat[] = [];
  itinerary.forEach((d) => {
    d.activities.forEach((a) => {
      const hhmm = a.time?.split("–")[0]?.trim();
      const [h, m] = hhmm ? hhmm.split(":").map(Number) : [9, 0];
      const [y, mo, da] = d.date.split("-").map(Number);
      const start = new Date(y, mo - 1, da, h || 9, m || 0).getTime();
      out.push({
        dayN: d.n,
        date: d.date,
        start,
        time: a.time ?? null,
        title: a.title,
        location: a.location,
        type: a.type,
        dressCode: a.dressCode || d.dressCode,
        linkedCity: a.linkedCity,
      });
    });
  });
  return out.sort((a, b) => a.start - b.start);
}

function countdown(target: number) {
  let d = Math.max(0, target - Date.now());
  const days = Math.floor(d / 86400000);
  d -= days * 86400000;
  const hours = Math.floor(d / 3600000);
  d -= hours * 3600000;
  const mins = Math.floor(d / 60000);
  return { days, hours, mins };
}

function mapsUrl(a: Flat) {
  if (a.linkedCity) {
    const c = cities.find((x) => x.slug === a.linkedCity);
    if (c?.coords) return `https://www.google.com/maps/search/?api=1&query=${c.coords.lat},${c.coords.lng}`;
  }
  const q = a.location ? `${a.location}, France` : "Bordeaux, France";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function ConciergeNow() {
  const { t } = useLocale();
  const itinerary = useGuideList<Day>("day");
  const [next, setNext] = useState<Flat | null>(null);
  const [cd, setCd] = useState<{ days: number; hours: number; mins: number } | null>(null);
  const [temp, setTemp] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const all = flatten(itinerary);
    const n = all.find((a) => a.start > Date.now()) || all[all.length - 1];
    setNext(n || null);
    if (n) setCd(countdown(n.start));
    const id = setInterval(() => n && setCd(countdown(n.start)), 30000);
    fetch("https://api.open-meteo.com/v1/forecast?latitude=44.84&longitude=-0.58&current=temperature_2m&timezone=Europe%2FParis")
      .then((r) => r.json())
      .then((j) => setTemp(Math.round(j.current.temperature_2m)))
      .catch(() => {});
    return () => clearInterval(id);
    // re-executa quando o roteiro editado chega do banco
  }, [itinerary]);

  if (!next) return null;

  const outdoor = ["walk", "active", "winery", "tasting", "meal"].includes(next.type);
  const recs: { icon: string; label: string }[] = [];
  if (outdoor) recs.push({ icon: "Compass", label: t("recWalk") });
  if (next.type === "active") recs.push({ icon: "Wind", label: t("recWater") });
  if (temp != null && temp < 15) recs.push({ icon: "CloudRain", label: t("recCoat") });
  if (outdoor && temp != null && temp >= 22) recs.push({ icon: "Sun", label: t("recSun") });
  if (next.dressCode) recs.push({ icon: "Shirt", label: next.dressCode });

  const when =
    cd && (cd.days > 0 ? `${cd.days}d ${cd.hours}h` : cd.hours > 0 ? `${cd.hours}h ${cd.mins}min` : `${cd.mins}min`);

  return (
    <div className="card overflow-hidden shadow-card">
      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="kicker">{t("whatNow")}</p>
          {when && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-petrol-50 px-3 py-1 font-sans text-[12px] font-medium text-petrol-600">
              <Icon name="Clock" size={13} /> {when}
            </span>
          )}
        </div>

        <h2 className="display mt-3 text-2xl leading-snug sm:text-3xl">{next.title}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[13px]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="CalendarDays" size={14} className="text-gold-deep" /> {t("day")} {next.dayN} · {weekday(next.date)}
          </span>
          {next.time && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="Clock" size={14} className="text-gold-deep" /> {next.time}
            </span>
          )}
          {next.location && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="MapPin" size={14} className="text-gold-deep" /> {next.location}
            </span>
          )}
        </div>

        {/* Ações */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <a href={mapsUrl(next)} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">
            <Icon name="Navigation" size={15} /> {t("howToGet")}
          </a>
          <button onClick={() => setOpen((v) => !v)} className="btn-ghost flex-1">
            <Icon name={open ? "Minus" : "Plus"} size={15} /> {open ? t("hideDetails") : t("seeDetails")}
          </button>
        </div>

        {/* Progressive disclosure */}
        {open && (
          <div className="mt-5 border-t pt-5 animate-fade-up" style={{ borderColor: "var(--line)" }}>
            {recs.length > 0 && (
              <>
                <p className="kicker-muted">{t("recommendations")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recs.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px]" style={{ borderColor: "var(--line)", color: "var(--text)" }}>
                      <Icon name={r.icon} size={13} className="text-gold-deep" /> {r.label}
                    </span>
                  ))}
                </div>
              </>
            )}
            <Link href={`/programacao#dia-${next.dayN}`} className="mt-5 inline-flex items-center gap-1.5 font-sans text-[12px] uppercase tracking-wide2 text-petrol-600 hover:text-petrol-500">
              {t("fullItinerary")} <Icon name="ArrowRight" size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
