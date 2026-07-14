"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { DayCard } from "./DayCard";
import { useGuideList } from "@/components/GuideContent";
import { useReservations } from "@/components/providers";
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

function shortName(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).join(" ") || name || "";
}

/** Roteiro dia a dia — lido do banco (editável no painel) com fallback ao arquivo. */
export function ProgramacaoDays() {
  const itinerary = [...useGuideList<Day>("day")].sort((a, b) => a.n - b.n);
  const { guest, guestParty } = useReservations();
  const [active, setActive] = useState<number | null>(null);
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

  return (
    <>
      {/* Índice de dias */}
      <nav className="sticky top-16 z-30 border-b backdrop-blur-md" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
        <div ref={navRef} className="no-scrollbar container-editorial flex gap-2 overflow-x-auto py-2">
          {itinerary.map((d) => (
            <a key={d.n} href={`#dia-${d.n}`} data-day={d.n}
              className={clsx(
                "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 font-sans text-[12px] transition-colors min-h-[42px]",
                active === d.n ? "border-transparent bg-petrol-600 text-cream" : "hover:border-gold hover:text-gold"
              )}
              style={{ borderColor: active === d.n ? "transparent" : "var(--line)" }}>
              Dia {d.n}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-editorial pt-6">
        {guest?.name && (
          <div className="mb-4 rounded-[14px] border px-4 py-3" style={{ borderColor: "var(--line)", background: "var(--bg-elev)" }}>
            <p className="font-sans text-[11px] uppercase tracking-wide2 text-gold-deep">Bem-vindo a bordo</p>
            <h2 className="mt-1 font-serif text-2xl font-light">Olá, {shortName(guest.name)}</h2>
            <p className="mt-1 font-sans text-[12px] text-muted">
              Sua agenda usa seu telefone pessoal. {guestParty.length > 1 ? "Você pode reservar também para o seu par de cabine." : "Reservas vinculadas ao seu cadastro."}
            </p>
          </div>
        )}
        <p className="font-sans text-[12px] italic text-muted">
          Toque em um dia para ver a programação. Horários sujeitos a alterações — confirmados a bordo.
        </p>
      </div>

      <div className="container-editorial space-y-10 pb-10 pt-6">
        {itinerary.map((day, idx) => (
          <DayCard key={day.n} day={day} img={dayImage(day)} priority={idx === 0} />
        ))}
      </div>
    </>
  );
}
