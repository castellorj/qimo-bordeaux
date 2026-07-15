"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { DayCard } from "./DayCard";
import { useGuideList } from "@/components/GuideContent";
import { cities, wineries } from "@/content";
import { cleanSiteImage } from "@/lib/siteImages";
import type { Day } from "@/lib/types";

// Foto representativa do dia: heroImage do dia, cidade ou vinicola vinculada. Fotos locais antigas sao ignoradas.
function dayImage(day: Day): string | undefined {
  const hero = cleanSiteImage(day.heroImage);
  if (hero) return hero;
  const city = day.activities.find((a) => a.linkedCity)?.linkedCity;
  if (city) {
    const c = cities.find((x) => x.slug === city);
    const img = cleanSiteImage(c?.heroImage);
    if (img) return img;
  }
  const win = day.activities.find((a) => a.linkedWinery)?.linkedWinery;
  if (win) {
    const w = wineries.find((x) => x.slug === win);
    const img = cleanSiteImage(w?.heroImage);
    if (img) return img;
  }
  return undefined;
}

/** Roteiro dia a dia — lido do banco (editável no painel) com fallback ao arquivo. */
export function ProgramacaoDays() {
  const itinerary = [...useGuideList<Day>("day")].sort((a, b) => a.n - b.n);
  const [active, setActive] = useState<number | null>(null);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Ao rolar, destaca o dia visível no índice (scroll-spy).
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id^="dia-"]'));
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const inBand = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({ n: Number(e.target.id.replace("dia-", "")), top: e.boundingClientRect.top }))
          .sort((a, b) => a.top - b.top);
        if (inBand.length) setActive(inBand[0].n);
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [itinerary.length]);

  // Mantém o chip ativo visível na barra horizontal.
  useEffect(() => {
    if (active == null || !navRef.current) return;
    const chip = navRef.current.querySelector<HTMLElement>(`[data-day="${active}"]`);
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const openAndFocusDay = (dayNumber: number) => {
    setActive(dayNumber);
    setOpenDay(dayNumber);
    requestAnimationFrame(() => {
      document.getElementById(`dia-${dayNumber}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      {/* Índice de dias */}
      <nav className="sticky top-16 z-30 border-b backdrop-blur-md" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
        <div ref={navRef} className="no-scrollbar container-editorial flex gap-2 overflow-x-auto py-2">
          {itinerary.map((d) => (
            <button key={d.n} type="button" onClick={() => openAndFocusDay(d.n)} data-day={d.n}
              className={clsx(
                "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 font-sans text-[12px] transition-colors min-h-[42px]",
                active === d.n ? "border-transparent bg-petrol-600 text-cream" : "hover:border-gold hover:text-gold"
              )}
              style={{ borderColor: active === d.n ? "transparent" : "var(--line)" }}>
              Dia {d.n}
            </button>
          ))}
        </div>
      </nav>

      <div className="container-editorial pt-6">
        <p className="font-sans text-[12px] italic text-muted">
          Toque em um dia para ver a programação. Horários sujeitos a alterações — confirmados a bordo.
        </p>
      </div>

      <div className="container-editorial space-y-10 pb-10 pt-6">
        {itinerary.map((day, idx) => (
          <DayCard
            key={day.n}
            day={day}
            img={dayImage(day)}
            priority={idx === 0}
            open={openDay === day.n}
            onToggle={() => setOpenDay((current) => (current === day.n ? null : day.n))}
          />
        ))}
      </div>
    </>
  );
}
