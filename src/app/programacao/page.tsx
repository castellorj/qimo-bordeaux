import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { DayCard } from "./DayCard";
import { itinerary, cities, wineries } from "@/content";
import type { Day } from "@/lib/types";

export const metadata: Metadata = { title: "Programação" };

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

      <p className="container-editorial pt-6 font-sans text-[12px] italic text-muted">
        Toque em um dia para ver a programação. Horários sujeitos a alterações — confirmados a bordo.
      </p>

      <div className="container-editorial space-y-10 pb-10 pt-6">
        {itinerary.map((day, idx) => (
          <DayCard key={day.n} day={day} img={dayImage(day, idx)} priority={idx === 0} />
        ))}
      </div>
    </>
  );
}
