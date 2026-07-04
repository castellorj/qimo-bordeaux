"use client";

import { useLocale } from "./providers";

export function PageHero({
  kicker,
  title,
  intro,
  small,
  section,
  bgImage,
}: {
  kicker?: string;
  title?: string;
  intro?: string;
  small?: boolean;
  section?: string; // resolve automaticamente: nav.<s> (título), hero.<s>.k, hero.<s>.i
  bgImage?: string;
}) {
  const { t } = useLocale();
  const k = section ? t(`hero.${section}.k`) : kicker;
  const ti = section ? t(`nav.${section}`) : title;
  const i = section ? t(`hero.${section}.i`) : intro;

  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--line)" }}>
      {bgImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgImage} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-petrol-950/92 via-petrol-950/80 to-petrol-950/60" />
        </>
      ) : (
        <div className="photo-placeholder absolute inset-0 opacity-[0.16]" />
      )}
      <div className={`container-editorial relative z-10 ${small ? "py-14" : "py-20 sm:py-24"}`}>
        {k && <p className="kicker">{k}</p>}
        <h1 className={`display mt-4 text-4xl sm:text-5xl md:text-6xl ${bgImage ? "text-cream" : ""}`}>{ti}</h1>
        <div className="gold-rule mt-6" />
        {i && <p className={`prose-luxe mt-6 max-w-2xl ${bgImage ? "!text-cream/80" : ""}`}>{i}</p>}
      </div>
    </section>
  );
}
