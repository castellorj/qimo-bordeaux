"use client";

import { useLocale } from "./providers";
import { PhotoImg } from "./PhotoImg";
import { cleanSiteImage } from "@/lib/siteImages";

export function PageHero({
  kicker,
  title,
  intro,
  small,
  section,
  bgImage,
  kickerOnly,
  imageOnly,
}: {
  kicker?: string;
  title?: string;
  intro?: string;
  small?: boolean;
  section?: string; // resolve automaticamente: nav.<s> (título), hero.<s>.k, hero.<s>.i
  bgImage?: string;
  kickerOnly?: boolean;
  imageOnly?: boolean;
}) {
  const { t, cfg, settingsReady } = useLocale();
  const k = section ? t(`hero.${section}.k`) : kicker;
  // título explícito (prop) vence; senão usa o nome da seção
  const ti = title ?? (section ? t(`nav.${section}`) : undefined);
  const i = section ? t(`hero.${section}.i`) : intro;
  // Foto do topo editável no painel (chave img.sec.<seção>), com fallback ao bgImage local.
  const bg = cleanSiteImage(section ? cfg(`img.sec.${section}`) : undefined) || (settingsReady ? cleanSiteImage(bgImage) : undefined);

  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--line)" }}>
      {bg ? (
        <>
          <PhotoImg src={bg} alt="" aria-hidden sizes="100vw" priority className="animate-ken-burns absolute inset-0 h-full w-full object-cover" />
          {/* Escurecimento uniforme + reforço na base = texto legível mesmo em foto clara */}
          <div className="absolute inset-0" style={{ background: "rgba(18,6,10,0.5)" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-petrol-950/60 via-transparent to-transparent" />
        </>
      ) : (
        <div className="photo-placeholder absolute inset-0 opacity-[0.16]" />
      )}
      <div
        className={`container-editorial relative z-10 ${kickerOnly ? "min-h-[360px] py-14 sm:min-h-[420px]" : small ? "py-14" : "py-20 sm:py-24"}`}
        style={bg ? { textShadow: "0 1px 18px rgba(12,4,7,.9), 0 1px 3px rgba(12,4,7,.7)" } : undefined}
      >
        {!imageOnly && k && <p className={`kicker ${bg ? "!text-gold-soft" : ""}`}>{k}</p>}
        {!imageOnly && !kickerOnly && (
          <>
            <h1 className={`display mt-4 text-4xl sm:text-5xl md:text-6xl ${bg ? "text-cream" : ""}`}>{ti}</h1>
            <div className="gold-rule mt-6" />
            {i && <p className={`prose-luxe mt-6 max-w-2xl ${bg ? "!text-cream/95" : ""}`}>{i}</p>}
          </>
        )}
      </div>
    </section>
  );
}
